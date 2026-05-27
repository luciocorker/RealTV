import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const DB_HEADERS = { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" };
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
import { Users, CheckCircle, XCircle, Shield, Search, Send, MessageSquare, ImagePlus, X, Upload, Trash2, Pencil, Check, Settings2, UserPlus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface SubscriptionUser {
  id: string;
  username: string;
  name: string;
  whatsapp_number: string;
  expiration_date: string;
  user_type: string;
  line_id: string | null;
  line_username: string | null;
  line_password: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { user, login } = useAuth();
  const [users, setUsers] = useState<SubscriptionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "new">("all");
  const [newUsersDays, setNewUsersDays] = useState<1 | 2 | 3 | 7>(7);
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

  // Expiry date editing
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [editingExpiryValue, setEditingExpiryValue] = useState("");
  const [savingExpiryId, setSavingExpiryId] = useState<string | null>(null);

  // Line details editing
  const [editingLineUser, setEditingLineUser] = useState<SubscriptionUser | null>(null);
  const [lineForm, setLineForm] = useState({ line_id: "", line_username: "", line_password: "" });
  const [savingLine, setSavingLine] = useState(false);

  // User type toggling
  const [savingUserTypeId, setSavingUserTypeId] = useState<string | null>(null);

  // Create user
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    password: "",
    user_type: "standard" as "standard" | "premium",
    plan: "trial" as "trial" | "std-monthly" | "std-3month" | "std-6month" | "std-yearly",
    lineMethod: "auto" as "auto" | "manual",
    line_username: "",
    line_password: "",
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState("");

  const isAdmin = user?.user_type === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=id,username,name,whatsapp_number,expiration_date,user_type,line_id,line_username,line_password,created_at&order=created_at.desc`,
      { headers: DB_HEADERS }
    );
    if (res.ok) setUsers(await res.json());
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
      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/message-images/${fileName}`, {
        method: "POST",
        headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": file.type, "x-upsert": "true" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      setMsgImageUrl(`${SUPABASE_URL}/storage/v1/object/public/message-images/${fileName}`);
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      alert("Image upload failed: " + (err instanceof Error ? err.message : "Unknown error"));
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
      const body: Record<string, unknown> = { message: msgText, target: msgTarget, adminUserId: user.id };
      if (msgTarget === "selected") body.userIds = Array.from(selectedUserIds);
      if (msgLinkUrl.trim()) body.linkUrl = msgLinkUrl.trim();
      if (msgImageUrl.trim()) body.imageUrl = msgImageUrl.trim();
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/send-bulk-whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
          body: JSON.stringify(body),
        }
      );
      const text = await response.text();
      console.log("Edge function response:", response.status, text);
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Status ${response.status}: ${text.slice(0, 200)}`); }
      if (!response.ok) throw new Error(data.error || `Status ${response.status}: ${text.slice(0, 200)}`);
      setMsgResult({ sent: data.sent, failed: data.failed, skippedNoPhone: data.skippedNoPhone, errors: data.errors });
    } catch (err: unknown) {
      console.error("Bulk message error:", err);
      setMsgResult({ sent: 0, failed: -1, skippedNoPhone: 0, errorMsg: err instanceof Error ? err.message : "Unknown error" });
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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newCutoff = new Date(now.getTime() - newUsersDays * 24 * 60 * 60 * 1000);
  const newUsers = users.filter((u) => u.created_at && new Date(u.created_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.whatsapp_number?.includes(search);
    const matchesStatus =
      statusFilter === "all" ? true :
      statusFilter === "new" ? (u.created_at && new Date(u.created_at) >= newCutoff) :
      getStatus(u.expiration_date) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      let body: { userIds?: string[]; deleteAll?: boolean; adminUserId: string };
      let deletedIds: Set<string>;

      if (deleteTarget.type === "single") {
        body = { userIds: [deleteTarget.userId], adminUserId: user!.id };
        deletedIds = new Set([deleteTarget.userId]);
      } else if (deleteTarget.type === "selected") {
        body = { userIds: Array.from(selectedUserIds), adminUserId: user!.id };
        deletedIds = new Set(selectedUserIds);
      } else {
        body = { deleteAll: true, adminUserId: user!.id };
        deletedIds = new Set(users.map((u) => u.id));
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
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
    } catch (err: unknown) {
      alert("Delete failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const startEditExpiry = (userId: string, currentDate: string) => {
    setEditingExpiryId(userId);
    // Format as YYYY-MM-DD for the date input
    const d = currentDate ? new Date(currentDate) : new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setEditingExpiryValue(`${yyyy}-${mm}-${dd}`);
  };

  const saveExpiry = async (userId: string) => {
    if (!editingExpiryValue) return;
    setSavingExpiryId(userId);
    try {
      const isoDate = new Date(editingExpiryValue + "T00:00:00").toISOString();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...DB_HEADERS, "Prefer": "return=minimal" },
        body: JSON.stringify({ expiration_date: isoDate, mobile_expiration_date: isoDate }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? { ...u, expiration_date: isoDate } : u)
      );
      setEditingExpiryId(null);
    } catch (err: unknown) {
      alert("Update failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    setSavingExpiryId(null);
  };

  const toggleUserType = async (u: SubscriptionUser) => {
    if (savingUserTypeId) return;
    const newType = u.user_type === "premium" ? "standard" : "premium";
    setSavingUserTypeId(u.id);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${u.id}`, {
        method: "PATCH",
        headers: { ...DB_HEADERS, "Prefer": "return=minimal" },
        body: JSON.stringify({ user_type: newType }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers((prev) =>
        prev.map((usr) => usr.id === u.id ? { ...usr, user_type: newType } : usr)
      );
    } catch (err: unknown) {
      alert("Update failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    setSavingUserTypeId(null);
  };

  const openLineEdit = (u: SubscriptionUser) => {
    setEditingLineUser(u);
    setLineForm({
      line_id: u.line_id ?? "",
      line_username: u.line_username ?? "",
      line_password: u.line_password ?? "",
    });
  };

  const saveLineDetails = async () => {
    if (!editingLineUser) return;
    setSavingLine(true);
    try {
      const updates: { line_id: string | null; line_username: string | null; line_password: string | null } = {
        line_id: lineForm.line_id.trim() || null,
        line_username: lineForm.line_username.trim() || null,
        line_password: lineForm.line_password.trim() || null,
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${editingLineUser.id}`, {
        method: "PATCH",
        headers: { ...DB_HEADERS, "Prefer": "return=minimal" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers((prev) =>
        prev.map((u) => u.id === editingLineUser.id ? { ...u, ...updates } : u)
      );
      setEditingLineUser(null);
    } catch (err: unknown) {
      alert("Update failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
    setSavingLine(false);
  };

  const getDaysRemaining = (expirationDate: string) => {
    if (!expirationDate) return null;
    const diff = new Date(expirationDate).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const PLAN_LABELS: Record<string, string> = {
    trial: "1-Day Free Trial",
    "std-monthly": "1 Month",
    "std-3month": "3 Months",
    "std-6month": "6 Months",
    "std-yearly": "1 Year",
  };

  const handleCreateUser = async () => {
    setCreateUserError("");
    const name = createUserForm.name.trim();
    const email = createUserForm.email.trim().toLowerCase();
    const whatsapp = createUserForm.whatsapp.trim();
    if (!name || !email || !whatsapp) {
      setCreateUserError("Name, email and WhatsApp number are required.");
      return;
    }
    setCreateUserLoading(true);
    try {
      const password = createUserForm.password.trim() || generatePassword();

      // Check for duplicate email
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(email)}&select=id&limit=1`,
        { headers: DB_HEADERS }
      );
      const existing = await checkRes.json();
      if (existing?.length > 0) {
        setCreateUserError("A user with this email already exists.");
        setCreateUserLoading(false);
        return;
      }

      // Insert user
      const PLAN_DAYS: Record<string, number> = {
        trial: 1, "std-monthly": 30, "std-3month": 90, "std-6month": 180, "std-yearly": 365,
      };
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + (PLAN_DAYS[createUserForm.plan] ?? 1));

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: { ...DB_HEADERS, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({ username: email, password, name, whatsapp_number: whatsapp, user_type: createUserForm.user_type, expiration_date: expirationDate.toISOString() }),
      });
      if (!insertRes.ok) throw new Error(await insertRes.text());
      const [newUser] = await insertRes.json();

      if (createUserForm.lineMethod === "manual") {
        // Save manual line details to user record
        if (createUserForm.line_username.trim() || createUserForm.line_password.trim()) {
          await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${newUser.id}`, {
            method: "PATCH",
            headers: { ...DB_HEADERS, "Prefer": "return=minimal" },
            body: JSON.stringify({
              line_username: createUserForm.line_username.trim() || null,
              line_password: createUserForm.line_password.trim() || null,
            }),
          });
        }
        // Send WhatsApp welcome message with manual line details
        const planLabel = PLAN_LABELS[createUserForm.plan] ?? createUserForm.plan;
        const message =
          `🎉 *Welcome to RealTV, ${name}!*\n\n` +
          `Your *${planLabel} subscription* has been activated! 📺\n\n` +
          `*Your app login details:*\n` +
          `• Username: ${email}\n` +
          `• Password: ${password}\n\n` +
          `Download the RealTV app and start streaming now!\n\n` +
          `If you need help, just reply to this message. Enjoy! 🚀`;
        await fetch(`${SUPABASE_URL}/functions/v1/send-bulk-whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
          body: JSON.stringify({ message, target: "selected", userIds: [newUser.id], adminUserId: user!.id }),
        });
      } else if (createUserForm.plan === "trial") {
        // create-line handles line creation + WhatsApp automatically
        const lineRes = await fetch(`${SUPABASE_URL}/functions/v1/create-line`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
          body: JSON.stringify({ username: email }),
        });
        if (!lineRes.ok) throw new Error("User created, but failed to create trial line: " + await lineRes.text());
      } else {
        // extend-line creates the line with the correct package
        const lineRes = await fetch(`${SUPABASE_URL}/functions/v1/extend-line`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
          body: JSON.stringify({ userEmail: email, planId: createUserForm.plan }),
        });
        if (!lineRes.ok) throw new Error("User created, but failed to create line: " + await lineRes.text());

        // Send WhatsApp welcome message via bulk-whatsapp edge function
        const planLabel = PLAN_LABELS[createUserForm.plan] ?? createUserForm.plan;
        const message =
          `🎉 *Welcome to RealTV, ${name}!*\n\n` +
          `Your *${planLabel} subscription* has been activated! 📺\n\n` +
          `*Your login details:*\n` +
          `• Username: ${email}\n` +
          `• Password: ${password}\n\n` +
          `Download the RealTV app and start streaming now!\n\n` +
          `If you need help, just reply to this message. Enjoy! 🚀`;
        await fetch(`${SUPABASE_URL}/functions/v1/send-bulk-whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
          body: JSON.stringify({ message, target: "selected", userIds: [newUser.id], adminUserId: user!.id }),
        });
      }

      await fetchUsers();
      setShowTable(true);
      setStatusFilter("all");
      setCreateUserOpen(false);
      setCreateUserForm({ name: "", email: "", whatsapp: "", password: "", user_type: "standard", plan: "trial", lineMethod: "auto", line_username: "", line_password: "" });
    } catch (err: unknown) {
      setCreateUserError(err instanceof Error ? err.message : "Failed to create user");
    }
    setCreateUserLoading(false);
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
              Admin
            </h1>
            <p className="text-gray-400 text-sm mt-1">Subscription overview</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setCreateUserError(""); setCreateUserOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              Create User
            </Button>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards — click to filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <p className="text-gray-400 text-sm">Active Users</p>
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
                  <p className="text-gray-400 text-sm">Expired Users</p>
                  <p className="text-3xl font-bold text-red-400">{expiredUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gray-900 border-2 cursor-pointer transition-colors ${
              statusFilter === "new" ? "border-yellow-500" : "border-gray-800 hover:border-gray-600"
            }`}
            onClick={() => { setStatusFilter("new"); setShowTable(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-600/20">
                  <UserPlus className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">New Users</p>
                  <p className="text-3xl font-bold text-yellow-400">{newUsers.length}</p>
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
                {statusFilter === "all" ? "All Users" : statusFilter === "active" ? "Active Users" : statusFilter === "new" ? "New Users" : "Expired Users"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {statusFilter === "new" && (
                  <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
                    {([1, 2, 3, 7] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setNewUsersDays(d)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          newUsersDays === d ? "bg-yellow-500 text-black" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => { setShowTable(false); setSearch(""); }}
                >
                  Hide
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
              <>
                {/* Mobile card list — visible on small screens */}
                <div className="md:hidden space-y-3">
                  {filteredUsers.length > 0 && (
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                      <Checkbox
                        checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))}
                        onCheckedChange={toggleAllVisible}
                        className="border-gray-600"
                      />
                      <span className="text-gray-400 text-sm">Select all ({filteredUsers.length})</span>
                    </div>
                  )}
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No users found</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const status = getStatus(u.expiration_date);
                      const days = getDaysRemaining(u.expiration_date);
                      return (
                        <div
                          key={u.id}
                          className={`rounded-lg border p-3 space-y-2 ${
                            selectedUserIds.has(u.id) ? "border-gray-600 bg-gray-800/60" : "border-gray-800 bg-gray-800/20"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedUserIds.has(u.id)}
                              onCheckedChange={() => toggleUserSelection(u.id)}
                              className="border-gray-600 shrink-0"
                            />
                            <span className="text-white font-medium flex-1 truncate">{u.name || "—"}</span>
                            <Badge
                              variant={status === "active" ? "default" : "destructive"}
                              className={status === "active" ? "bg-green-600/20 text-green-400 hover:bg-green-600/30" : "bg-red-600/20 text-red-400 hover:bg-red-600/30"}
                            >
                              {status === "active" ? "Active" : "Expired"}
                            </Badge>
                          </div>
                          <div className="text-gray-400 text-sm truncate pl-6">{u.username}</div>
                          <div className="flex items-center gap-2 pl-6">
                            <button
                              onClick={() => toggleUserType(u)}
                              disabled={savingUserTypeId === u.id}
                              title="Click to toggle plan type"
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                                u.user_type === "premium"
                                  ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
                                  : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/40"
                              } ${savingUserTypeId === u.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {savingUserTypeId === u.id ? "..." : (u.user_type || "standard")}
                            </button>
                          </div>
                          <div className="flex items-center justify-between pl-6">
                            <span className="text-gray-400 text-sm">{u.whatsapp_number || "No phone"}</span>
                            {days !== null && (
                              <span className={`text-sm font-medium ${days > 7 ? "text-green-400" : days > 0 ? "text-yellow-400" : "text-red-400"}`}>
                                {days > 0 ? `${days}d left` : `${Math.abs(days)}d ago`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between pl-6 pt-1 border-t border-gray-800">
                            {editingExpiryId === u.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={editingExpiryValue}
                                  onChange={(e) => setEditingExpiryValue(e.target.value)}
                                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
                                  autoFocus
                                />
                                <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 px-1" onClick={() => saveExpiry(u.id)} disabled={savingExpiryId === u.id}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-1" onClick={() => setEditingExpiryId(null)} disabled={savingExpiryId === u.id}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                className="flex items-center gap-1 text-gray-400 text-sm hover:text-white transition-colors"
                                onClick={() => startEditExpiry(u.id, u.expiration_date)}
                              >
                                {u.expiration_date ? new Date(u.expiration_date).toLocaleDateString("en-ZA") : "No expiry"}
                                <Pencil className="w-3 h-3 ml-1" />
                              </button>
                            )}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20 px-2 h-8"
                                onClick={() => openLineEdit(u)}
                                title="Edit line details"
                              >
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-900/20 px-2 h-8"
                                onClick={() => setDeleteTarget({ type: "single", userId: u.id, name: u.name || u.username })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {/* Desktop table — hidden on small screens */}
                <div className="hidden md:block overflow-x-auto">
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
                        <TableCell>
                          <button
                            onClick={() => toggleUserType(u)}
                            disabled={savingUserTypeId === u.id}
                            title="Click to toggle between Standard and Premium"
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                              u.user_type === "premium"
                                ? "bg-purple-600/20 text-purple-400 hover:bg-purple-600/40"
                                : "bg-blue-600/20 text-blue-400 hover:bg-blue-600/40"
                            } ${savingUserTypeId === u.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {savingUserTypeId === u.id ? "..." : (u.user_type || "standard")}
                          </button>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {editingExpiryId === u.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={editingExpiryValue}
                                onChange={(e) => setEditingExpiryValue(e.target.value)}
                                className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-400 hover:text-green-300 px-1"
                                onClick={() => saveExpiry(u.id)}
                                disabled={savingExpiryId === u.id}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white px-1"
                                onClick={() => setEditingExpiryId(null)}
                                disabled={savingExpiryId === u.id}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group">
                              <span>
                                {u.expiration_date
                                  ? new Date(u.expiration_date).toLocaleDateString("en-ZA")
                                  : "—"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white px-1 h-auto py-0"
                                onClick={() => startEditExpiry(u.id, u.expiration_date)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/20 px-2"
                              onClick={() => openLineEdit(u)}
                              title="Edit line details"
                            >
                              <Settings2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-900/20 px-2"
                              onClick={() => setDeleteTarget({ type: "single", userId: u.id, name: u.name || u.username })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
        )}
        {/* Create User Dialog */}
        <Dialog open={createUserOpen} onOpenChange={(open) => { if (!open && !createUserLoading) { setCreateUserOpen(false); setCreateUserError(""); } }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Create New User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className="space-y-3 rounded-lg border border-gray-800 p-3 sm:p-4">
                <Label className="text-gray-300">Subscription Type *</Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {(["standard", "premium"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      disabled={createUserLoading}
                      onClick={() => setCreateUserForm((f) => ({ ...f, user_type: role }))}
                      className={`rounded-lg border p-2.5 text-center text-sm font-semibold transition-colors disabled:opacity-50 ${
                        createUserForm.user_type === role
                          ? "border-green-500 bg-green-600/20 text-green-300"
                          : "bg-gray-800 border-gray-600 hover:border-gray-400 text-gray-300"
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-gray-800 p-3 sm:p-4">
                <Label className="text-gray-300">Account Details *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-gray-400">Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={createUserForm.name}
                      onChange={(e) => setCreateUserForm((f) => ({ ...f, name: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      disabled={createUserLoading}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-400">WhatsApp Number</Label>
                    <Input
                      placeholder="0812345678"
                      value={createUserForm.whatsapp}
                      onChange={(e) => setCreateUserForm((f) => ({ ...f, whatsapp: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      disabled={createUserLoading}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-gray-400">Email (username)</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      disabled={createUserLoading}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-gray-400">Password <span className="text-gray-600">(leave blank to auto-generate)</span></Label>
                    <Input
                      placeholder="Auto-generated if empty"
                      value={createUserForm.password}
                      onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      disabled={createUserLoading}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-gray-800 p-3 sm:p-4">
                <Label className="text-gray-300">Line Setup *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {([{ id: "auto", label: "Auto Create", sub: "Via Argon TV API" }, { id: "manual", label: "Manual Entry", sub: "Enter details yourself" }] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={createUserLoading}
                      onClick={() => setCreateUserForm((f) => ({ ...f, lineMethod: opt.id }))}
                      className={`rounded-lg border p-2.5 text-center text-sm transition-colors disabled:opacity-50 ${
                        createUserForm.lineMethod === opt.id
                          ? "border-green-500 bg-green-600/20 text-green-300"
                          : "bg-gray-800 border-gray-600 hover:border-gray-400 text-gray-300"
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                {createUserForm.lineMethod === "manual" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-gray-400">Line Username</Label>
                      <Input
                        placeholder="iptv_username"
                        value={createUserForm.line_username}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, line_username: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={createUserLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-gray-400">Line Password</Label>
                      <Input
                        placeholder="iptv_password"
                        value={createUserForm.line_password}
                        onChange={(e) => setCreateUserForm((f) => ({ ...f, line_password: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        disabled={createUserLoading}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-lg border border-gray-800 p-3 sm:p-4">
                <Label className="text-gray-300">Plan *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {([
                    { id: "trial", label: "Trial", sub: "24 hours" },
                    { id: "std-monthly", label: "1 Month", sub: "" },
                    { id: "std-3month", label: "3 Months", sub: "" },
                    { id: "std-6month", label: "6 Months", sub: "" },
                    { id: "std-yearly", label: "1 Year", sub: "" },
                  ] as const).map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={createUserLoading}
                      onClick={() => setCreateUserForm((f) => ({ ...f, plan: plan.id }))}
                      className={`rounded-lg border p-2.5 text-center text-sm transition-colors disabled:opacity-50 ${
                        createUserForm.plan === plan.id
                          ? "border-green-500 bg-green-600/20 text-green-300"
                          : "bg-gray-800 border-gray-600 hover:border-gray-400 text-gray-300"
                      }`}
                    >
                      <div className="font-semibold">{plan.label}</div>
                      {plan.sub && <div className="text-xs opacity-70 mt-0.5">{plan.sub}</div>}
                    </button>
                  ))}
                </div>
              </div>
              {createUserError && <p className="text-red-400 text-sm">{createUserError}</p>}
            </div>
            <DialogFooter className="shrink-0 border-t border-gray-800 pt-3 bg-gray-900">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateUserOpen(false)}
                disabled={createUserLoading}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateUser}
                disabled={createUserLoading}
              >
                {createUserLoading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Line Details Edit Dialog */}
        <Dialog open={!!editingLineUser} onOpenChange={(open) => { if (!open && !savingLine) setEditingLineUser(null); }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                Edit Line Details — {editingLineUser?.name || editingLineUser?.username}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-gray-400">Line ID</Label>
                <Input
                  type="text"
                  placeholder="e.g. 12345"
                  value={lineForm.line_id}
                  onChange={(e) => setLineForm((f) => ({ ...f, line_id: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400">Line Username</Label>
                <Input
                  placeholder="Username"
                  value={lineForm.line_username}
                  onChange={(e) => setLineForm((f) => ({ ...f, line_username: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-gray-400">Line Password</Label>
                <Input
                  placeholder="Password"
                  value={lineForm.line_password}
                  onChange={(e) => setLineForm((f) => ({ ...f, line_password: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingLineUser(null)}
                disabled={savingLine}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveLineDetails}
                disabled={savingLine}
              >
                {savingLine ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-700 transition-colors text-sm text-gray-300 shrink-0">
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
                  className="bg-gray-800 border-gray-700 text-white w-full sm:flex-1"
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
                variant="outline"
                size="sm"
                onClick={sendBulkMessage}
                disabled={msgSending || !msgText.trim()}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
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
