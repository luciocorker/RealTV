import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, CheckCircle, XCircle, Shield, Search, Send, MessageSquare, ImagePlus, X, Upload, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionUser {
  id: string;
  username: string;
  name: string;
  whatsapp_number: string;
  expiration_date: string;
  user_type: string;
  line_id: number | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, login } = useAuth();
  const [users, setUsers] = useState<SubscriptionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [showTable, setShowTable] = useState(false);

  // Admin login form state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Bulk messaging state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [msgTarget, setMsgTarget] = useState<"expired" | "active" | "all" | "selected">("expired");
  const [msgText, setMsgText] = useState("");
  const [msgLinkUrl, setMsgLinkUrl] = useState("");
  const [msgImageUrl, setMsgImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const [msgResult, setMsgResult] = useState<{ sent: number; failed: number; skippedNoPhone: number; errorMsg?: string; errors?: string[] } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: "single"; userId: string; name: string } | { type: "selected" } | { type: "all" } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.user_type === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, whatsapp_number, expiration_date, user_type, line_id, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await login(adminUsername, adminPassword);
    if (!result.success) {
      setLoginError(result.error || "Login failed");
    }
    setLoginLoading(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredUsers.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selectedUserIds.has(id));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `admin-msg/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from("message-images")
        .upload(fileName, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("message-images")
        .getPublicUrl(data.path);
      setMsgImageUrl(urlData.publicUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      alert("Image upload failed: " + (err.message || "Unknown error"));
    }
    setImageUploading(false);
    e.target.value = "";
  };

  const sendBulkMessage = async () => {
    if (!msgText.trim() || !user) return;
    if (msgTarget === "selected" && selectedUserIds.size === 0) return;
    setMsgSending(true);
    setMsgResult(null);
    try {
      const body: any = { message: msgText, target: msgTarget, adminUserId: user.id };
      if (msgTarget === "selected") {
        body.userIds = Array.from(selectedUserIds);
      }
      if (msgLinkUrl.trim()) {
        body.linkUrl = msgLinkUrl.trim();
      }
      if (msgImageUrl.trim()) {
        body.imageUrl = msgImageUrl.trim();
      }
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-whatsapp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          },
          body: JSON.stringify(body),
        }
      );
      const text = await response.text();
      console.log("Edge function response:", response.status, text);
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Status ${response.status}: ${text.slice(0, 200)}`); }
      if (!response.ok) throw new Error(data.error || `Status ${response.status}: ${text.slice(0, 200)}`);
      setMsgResult({ sent: data.sent, failed: data.failed, skippedNoPhone: data.skippedNoPhone, errors: data.errors });
    } catch (err: any) {
      console.error("Bulk message error:", err);
      setMsgResult({ sent: 0, failed: -1, skippedNoPhone: 0, errorMsg: err.message || "Unknown error" });
    }
    setMsgSending(false);
  };

  const now = new Date();

  const getStatus = (expirationDate: string) => {
    if (!expirationDate) return "expired";
    return new Date(expirationDate) > now ? "active" : "expired";
  };

  const activeUsers = users.filter((u) => getStatus(u.expiration_date) === "active");
  const expiredUsers = users.filter((u) => getStatus(u.expiration_date) === "expired");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.whatsapp_number?.includes(search);
    const matchesStatus =
      statusFilter === "all" || getStatus(u.expiration_date) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      let body: { userIds?: string[]; deleteAll?: boolean; adminUserId: string };
      let deletedIds: Set<string>;

      if (deleteTarget.type === "single") {
        body = { userIds: [deleteTarget.userId], adminUserId: user.id };
        deletedIds = new Set([deleteTarget.userId]);
      } else if (deleteTarget.type === "selected") {
        body = { userIds: Array.from(selectedUserIds), adminUserId: user.id };
        deletedIds = new Set(selectedUserIds);
      } else {
        body = { deleteAll: true, adminUserId: user.id };
        deletedIds = new Set(users.map((u) => u.id));
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          },
          body: JSON.stringify(body),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Status ${response.status}`);

      setUsers((prev) => prev.filter((u) => !deletedIds.has(u.id)));
      setSelectedUserIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err: any) {
      alert("Delete failed: " + (err.message || "Unknown error"));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const getDaysRemaining = (expirationDate: string) => {
    if (!expirationDate) return null;
    const diff = new Date(expirationDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Not logged in or not admin — show login form
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle className="text-white text-xl">Admin Portal</CardTitle>
            <p className="text-gray-400 text-sm">Sign in with your admin account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <Input
                placeholder="Email"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              {user && !isAdmin && (
                <p className="text-red-500 text-sm">Access denied. Admin accounts only.</p>
              )}
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Subscription overview</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {/* Stats Cards — click to filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className={`bg-gray-900 border-2 cursor-pointer transition-colors ${
              statusFilter === "all" ? "border-blue-500" : "border-gray-800 hover:border-gray-600"
            }`}
            onClick={() => { setStatusFilter("all"); setShowTable(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-600/20">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gray-900 border-2 cursor-pointer transition-colors ${
              statusFilter === "active" ? "border-green-500" : "border-gray-800 hover:border-gray-600"
            }`}
            onClick={() => { setStatusFilter("active"); setShowTable(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-600/20">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-green-400">{activeUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gray-900 border-2 cursor-pointer transition-colors ${
              statusFilter === "expired" ? "border-red-500" : "border-gray-800 hover:border-gray-600"
            }`}
            onClick={() => { setStatusFilter("expired"); setShowTable(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-600/20">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expired Subscriptions</p>
                  <p className="text-3xl font-bold text-red-400">{expiredUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search bar — always visible */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search users by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-700 text-white"
          />
        </div>

        {/* Users Table */}
        {(showTable || search.trim().length > 0) && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {statusFilter === "all" ? "All Users" : statusFilter === "active" ? "Active Users" : "Expired Users"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => { setShowTable(false); setSearch(""); }}
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {!loading && filteredUsers.length > 0 && (
              <div className="flex gap-2 mb-4">
                {selectedUserIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                    onClick={() => setDeleteTarget({ type: "selected" })}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected ({selectedUserIds.size})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-900 text-red-500 hover:bg-red-900/20"
                  onClick={() => setDeleteTarget({ type: "all" })}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All
                </Button>
              </div>
            )}
            {loading ? (
              <p className="text-gray-400 text-center py-8">Loading users...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400 w-10">
                      <Checkbox
                        checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))}
                        onCheckedChange={toggleAllVisible}
                        className="border-gray-600"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">WhatsApp</TableHead>
                    <TableHead className="text-gray-400">Plan</TableHead>
                    <TableHead className="text-gray-400">Expiry Date</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Days Left</TableHead>
                    <TableHead className="text-gray-400 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const status = getStatus(u.expiration_date);
                    const days = getDaysRemaining(u.expiration_date);
                    return (
                      <TableRow key={u.id} className={`border-gray-800 ${selectedUserIds.has(u.id) ? "bg-gray-800/50" : ""}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(u.id)}
                            onCheckedChange={() => toggleUserSelection(u.id)}
                            className="border-gray-600"
                          />
                        </TableCell>
                        <TableCell className="text-white font-medium">{u.name || "—"}</TableCell>
                        <TableCell className="text-gray-300">{u.username}</TableCell>
                        <TableCell className="text-gray-300">{u.whatsapp_number || "—"}</TableCell>
                        <TableCell className="text-gray-300 capitalize">{u.user_type || "—"}</TableCell>
                        <TableCell className="text-gray-300">
                          {u.expiration_date
                            ? new Date(u.expiration_date).toLocaleDateString("en-ZA")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={status === "active" ? "default" : "destructive"}
                            className={
                              status === "active"
                                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                            }
                          >
                            {status === "active" ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {days !== null ? (
                            days > 0 ? (
                              <span className={days <= 7 ? "text-yellow-400" : "text-green-400"}>
                                {days}d
                              </span>
                            ) : (
                              <span className="text-red-400">{Math.abs(days)}d ago</span>
                            )
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20 px-2"
                            onClick={() => setDeleteTarget({ type: "single", userId: u.id, name: u.name || u.username })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        )}
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                {deleteTarget?.type === "single"
                  ? `Delete "${deleteTarget.name}"?`
                  : deleteTarget?.type === "selected"
                  ? `Delete ${selectedUserIds.size} selected user${selectedUserIds.size !== 1 ? "s" : ""}?`
                  : `Delete all ${users.length} users?`}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action is permanent and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700" disabled={deleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk WhatsApp Messaging */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              Bulk WhatsApp Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target selector */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Send to</label>
              <div className="flex flex-wrap gap-1.5">
                {(["selected", "expired", "active", "all"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setMsgTarget(value)}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      msgTarget === value
                        ? value === "expired"
                          ? "bg-red-600 text-white"
                          : value === "active"
                          ? "bg-green-600 text-white"
                          : value === "selected"
                          ? "bg-purple-600 text-white"
                          : "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
                    }`}
                  >
                    {value === "selected"
                      ? `Selected (${selectedUserIds.size})`
                      : value === "expired"
                      ? `Expired (${expiredUsers.length})`
                      : value === "active"
                      ? `Active (${activeUsers.length})`
                      : `All (${users.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick templates */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Quick templates</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    setMsgText(
                      `Hi {name} 👋\n\n*⚠️ Subscription Expired*\n\nYour RealTV subscription has expired. Renew now to keep enjoying *10,000+ live channels*, movies & series!\n\nTap the link below to renew 👇\n\n— *RealTV Team* 📺`
                    );
                    setMsgLinkUrl("https://realtv.co.za/account");
                  }}
                >
                  🔄 Renewal Reminder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    setMsgText(
                      `Hi {name} 👋\n\n📢 *RealTV App Update Available!*\n\nPlease update your app with the new downloader code to get the *latest features and channels*.\n\nDownload here 👇\n\n— *RealTV Team* 📺`
                    );
                    setMsgLinkUrl("https://realtv.co.za/download");
                  }}
                >
                  📲 App Update
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => {
                    setMsgText(`Hi {name} 👋\n\n`);
                    setMsgLinkUrl("");
                  }}
                >
                  ✏️ Custom Message
                </Button>
              </div>
            </div>

            {/* Message input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                Message <span className="text-gray-600">— use {'{name}'} and {'{email}'} for personalization. Format: *bold* _italic_ ~strikethrough~</span>
              </label>
              <Textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="bg-gray-800 border-gray-700 text-white resize-none"
              />
            </div>

            {/* Link preview URL */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                Link URL <span className="text-gray-600">(optional — sends as a rich link preview)</span>
              </label>
              <Input
                placeholder="https://realtv.co.za/account"
                value={msgLinkUrl}
                onChange={(e) => setMsgLinkUrl(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-1">
                <ImagePlus className="w-4 h-4" />
                Image <span className="text-gray-600">(optional — message becomes the caption)</span>
              </label>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700 transition-colors text-sm text-gray-300">
                  <Upload className="w-4 h-4" />
                  {imageUploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </label>
                <span className="text-gray-600 text-sm">or</span>
                <Input
                  placeholder="Paste image URL..."
                  value={msgImageUrl}
                  onChange={(e) => setMsgImageUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                />
                {msgImageUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 px-2"
                    onClick={() => setMsgImageUrl("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {msgImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 w-fit">
                  <img
                    src={msgImageUrl}
                    alt="Preview"
                    className="max-h-32 object-contain"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            {/* Send button & result */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
              <Button
                onClick={sendBulkMessage}
                disabled={msgSending || !msgText.trim()}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto h-12 text-base font-semibold px-8"
                size="lg"
              >
                <Send className="w-5 h-5 mr-2" />
                {msgSending ? "Sending..." : "Send Messages"}
              </Button>

              {msgResult && (
                <div className="text-sm space-y-1">
                  {msgResult.failed === -1 ? (
                    <span className="text-red-400">Failed: {msgResult.errorMsg || "Unknown error"}</span>
                  ) : (
                    <>
                      <span className="text-gray-300">
                        ✅ {msgResult.sent} sent
                        {msgResult.failed > 0 && <>, ❌ {msgResult.failed} failed</>}
                        {msgResult.skippedNoPhone > 0 && (
                          <>, ⏭️ {msgResult.skippedNoPhone} skipped (no phone)</>)}
                      </span>
                      {msgResult.errors && msgResult.errors.length > 0 && (
                        <div className="text-red-400 text-xs mt-1">
                          {msgResult.errors.map((e, i) => <div key={i}>{e}</div>)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
