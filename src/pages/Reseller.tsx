import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Coins,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  Store,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppButton";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;

const SESSION_KEY = "realtv_reseller_session";

// RealTV sales WhatsApp (same number used across the site)
const WHATSAPP_NUMBER = "27769681973";

// Must match the PLANS map in supabase/functions/reseller-portal (the server enforces the real costs)
interface ResellerPlan {
  id: "1m" | "2m" | "3m" | "6m" | "1y";
  label: string;
  cost: number;
  days: number;
}

const RESELLER_PLANS: ResellerPlan[] = [
  { id: "1m", label: "1 Month", cost: 1, days: 30 },
  { id: "2m", label: "2 Months", cost: 2, days: 60 },
  { id: "3m", label: "3 Months", cost: 3, days: 90 },
  { id: "6m", label: "6 Months", cost: 5, days: 180 },
  { id: "1y", label: "1 Year", cost: 10, days: 365 },
];

// Credit top-up packages (must match the price list agreed with RealTV)
interface TopUpPackage {
  credits: number;
  price: number;
}

const TOPUP_PACKAGES: TopUpPackage[] = [
  { credits: 10, price: 250 },
  { credits: 25, price: 600 },
  { credits: 50, price: 1200 },
  { credits: 100, price: 2300 },
  { credits: 200, price: 4500 },
  { credits: 500, price: 10000 },
];

// "John Doe" / "john@x.com" -> "JD" / "JO" for the avatar
const getInitials = (name: string, email: string) => {
  const source = (name || email || "?").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

interface ResellerSession {
  id: string;
  name: string;
  username: string;
  whatsapp_number: string;
  credits: number;
  password: string;
  user_type: "reseller" | "sub_reseller";
}

interface Customer {
  name: string;
  username: string;
  expiration_date: string | null;
  user_type: string;
}

interface SubReseller {
  id: string;
  username: string;
  name: string;
  whatsapp_number: string;
  credits: number;
  created_at: string;
}

export default function ResellerPage() {
  const { toast } = useToast();

  const [session, setSession] = useState<ResellerSession | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Extend form
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ResellerPlan | null>(null);
  const [extending, setExtending] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState<TopUpPackage | null>(null);

  // Sub-reseller management (full resellers only)
  const [subs, setSubs] = useState<SubReseller[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [createSubForm, setCreateSubForm] = useState({ name: "", email: "", whatsapp: "", password: "" });
  const [creatingSub, setCreatingSub] = useState(false);
  const [transferAmounts, setTransferAmounts] = useState<Record<string, string>>({});
  const [transferringSubId, setTransferringSubId] = useState<string | null>(null);

  const isSub = session?.user_type === "sub_reseller";

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) setSession(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Every portal action re-verifies the reseller's credentials server-side
  const callPortal = async (payload: Record<string, unknown>) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/reseller-portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        ...payload,
        username: session?.username ?? loginEmail,
        password: session?.password ?? loginPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword) return;
    setLoginLoading(true);
    try {
      const data = await callPortal({ action: "login" });
      const s: ResellerSession = { ...data.reseller, password: loginPassword };
      setSession(s);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      toast({ title: "Welcome back!", description: `Logged in as ${s.name || s.username}` });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
    setLoginLoading(false);
  };

  const resetExtendForm = () => {
    setLookupEmail("");
    setCustomer(null);
    setSelectedPlan(null);
    setExtending(false);
    setSelectedTopUp(null);
  };

  const handleLogout = () => {
    setSession(null);
    sessionStorage.removeItem(SESSION_KEY);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    resetExtendForm();
  };

  const refreshBalance = async () => {
    if (!session) return;
    try {
      const data = await callPortal({ action: "login" });
      const updated: ResellerSession = { ...session, credits: data.reseller.credits, name: data.reseller.name };
      setSession(updated);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      if (updated.user_type === "reseller") fetchSubs();
      toast({ title: `Balance: ${updated.credits} credits` });
    } catch (err) {
      // Credentials can no longer be verified — force a fresh sign-in
      handleLogout();
      toast({
        title: "Session expired",
        description: err instanceof Error ? err.message : "Please sign in again",
        variant: "destructive",
      });
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    setLookupLoading(true);
    setCustomer(null);
    setSelectedPlan(null);
    try {
      const data = await callPortal({ action: "lookup", email: lookupEmail.trim() });
      setCustomer(data.customer);
    } catch (err) {
      toast({
        title: "Account not found",
        description: err instanceof Error ? err.message : "Lookup failed",
        variant: "destructive",
      });
    }
    setLookupLoading(false);
  };

  const handleExtend = async () => {
    if (!session || !customer || !selectedPlan) return;
    setExtending(true);
    try {
      const data = await callPortal({ action: "extend", email: customer.username, plan: selectedPlan.id });
      const updated: ResellerSession = { ...session, credits: data.credits };
      setSession(updated);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      toast({
        title: "Account extended",
        description: `${customer.name || customer.username} — new expiry: ${
          data.newExpirationDate
            ? new Date(data.newExpirationDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
            : "—"
        }`,
      });
      setCustomer((prev) => (prev ? { ...prev, expiration_date: data.newExpirationDate ?? null } : prev));
      setSelectedPlan(null);
    } catch (err) {
      toast({
        title: "Extension failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
    setExtending(false);
  };

  const previewExpiry = (base: string | null, plan: ResellerPlan) => {
    const baseDate = base && new Date(base) > new Date() ? new Date(base) : new Date();
    return new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);
  };

  const handleTopUpRequest = () => {
    if (!session || !selectedTopUp) return;
    const message =
      `Hi RealTV! I'd like to top up my reseller account.\n\n` +
      `• Reseller: ${session.name || session.username} (${session.username})\n` +
      `• Credits: ${selectedTopUp.credits}\n` +
      `• Price: R${selectedTopUp.price.toLocaleString("en-ZA")}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    toast({
      title: "Opening WhatsApp...",
      description: "Send the pre-filled message to complete your top up.",
    });
  };

  // ----- Sub-resellers (parents only) -----
  const fetchSubs = async () => {
    if (!session || session.user_type !== "reseller") return;
    setSubsLoading(true);
    try {
      const data = await callPortal({ action: "list_subs" });
      setSubs(data.subs ?? []);
    } catch {
      // The sub list is a convenience feature — never block the dashboard
    }
    setSubsLoading(false);
  };

  useEffect(() => {
    if (session?.user_type === "reseller") {
      fetchSubs();
    } else {
      setSubs([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingSub(true);
    try {
      await callPortal({ action: "create_sub", ...createSubForm });
      setCreateSubForm({ name: "", email: "", whatsapp: "", password: "" });
      setShowCreateSub(false);
      await fetchSubs();
      toast({
        title: "Sub-reseller created",
        description: "They sign in on this page with the email and password you set.",
      });
    } catch (err) {
      toast({
        title: "Could not create sub-reseller",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
    setCreatingSub(false);
  };

  const handleTransfer = async (sub: SubReseller) => {
    if (!session) return;
    const amount = Math.round(Number(transferAmounts[sub.id]));
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (session.credits < amount) return;
    setTransferringSubId(sub.id);
    try {
      const data = await callPortal({ action: "transfer_credits", subId: sub.id, amount });
      const newSessionCredits = data.senderCredits ?? session.credits - amount;
      const newSubCredits = data.receiverCredits ?? sub.credits + amount;
      const updated: ResellerSession = { ...session, credits: newSessionCredits };
      setSession(updated);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      setTransferAmounts((m) => ({ ...m, [sub.id]: "" }));
      setSubs((list) => list.map((s) => s.id === sub.id ? { ...s, credits: newSubCredits } : s));
      toast({
        title: `Sent ${amount} credit${amount === 1 ? "" : "s"}`,
        description: `${sub.name || sub.username} now has ${newSubCredits} credits.`,
      });
    } catch (err) {
      toast({
        title: "Transfer failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
    setTransferringSubId(null);
  };

  // ----- Login screen -----
  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-16 flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-purple-600/20 flex items-center justify-center mb-2">
              <Store className="w-7 h-7 text-purple-400" />
            </div>
            <CardTitle className="text-white text-2xl">Reseller Portal</CardTitle>
            <p className="text-gray-400 text-sm mt-1">
              Sign in to extend customer accounts using your credits
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reseller-email">Email</Label>
                <Input
                  id="reseller-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reseller-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reseller-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={loginLoading}>
                {loginLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                ) : (
                  <><Store className="w-4 h-4 mr-2" />Sign In</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ----- Dashboard -----
  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 relative">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-purple-900/20 to-transparent" />
      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Profile header */}
        <Card className="bg-gray-900/80 border-gray-800 overflow-hidden backdrop-blur">
          <div className="h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-500" />
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative shrink-0">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-purple-500/30">
                  {getInitials(session.name, session.username)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-600 ring-2 ring-gray-900" title="Active" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-widest text-purple-400 font-semibold">Reseller Portal</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <h2 className="text-xl font-bold text-white truncate">{session.name || "Reseller"}</h2>
                  {isSub ? (
                    <Badge className="bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30">
                      <UserPlus className="w-3 h-3 mr-1" />
                      Sub-Reseller
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30">
                      <Store className="w-3 h-3 mr-1" />
                      Reseller
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 min-w-0">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    <span className="truncate">{session.username}</span>
                  </span>
                  {session.whatsapp_number && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                      {session.whatsapp_number}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={refreshBalance}>
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Log Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits — balance & top up */}
        <Card className="bg-gradient-to-br from-purple-950 to-gray-900 border-purple-900/50">
          <CardContent className="pt-6 pb-6 space-y-6">
            {/* Balance */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Coins className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Available Credits</p>
                <p className="text-4xl font-bold text-amber-400">{session.credits ?? 0}</p>
              </div>
            </div>

            {/* Top up — full resellers only; sub-resellers are topped up by their parent */}
            {isSub ? (
              <div className="border-t border-white/10 pt-6">
                <p className="text-white font-semibold flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  Top Up Credits
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Top-ups are not available on sub-reseller accounts. Your parent reseller can send you credits from
                  their own balance — ask them to top up your account.
                </p>
              </div>
            ) : (
              <div className="border-t border-white/10 pt-6 space-y-4">
              <p className="text-white font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Top Up Credits
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TOPUP_PACKAGES.map((p) => {
                  const selected = selectedTopUp?.credits === p.credits;
                  return (
                    <button
                      key={p.credits}
                      type="button"
                      onClick={() => setSelectedTopUp(p)}
                      className={`rounded-lg border p-3 text-center transition-colors ${
                        selected
                          ? "border-green-500 bg-green-600/20 text-green-300"
                          : "bg-gray-800 border-gray-600 hover:border-gray-400 text-gray-300"
                      }`}
                    >
                      <span className="block text-lg font-bold">{p.credits}</span>
                      <span className="block text-xs text-gray-400">credits</span>
                      <span className={`block text-sm font-semibold mt-1 ${selected ? "text-green-300" : "text-amber-400"}`}>
                        R{p.price.toLocaleString("en-ZA")}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleTopUpRequest}
                disabled={!selectedTopUp}
              >
                {!selectedTopUp ? (
                  "Select a package to top up"
                ) : (
                  <>
                    <WhatsAppIcon className="w-4 h-4 mr-2" />
                    Request {selectedTopUp.credits} credits — R{selectedTopUp.price.toLocaleString("en-ZA")}
                  </>
                )}
              </Button>
              <p className="text-gray-500 text-xs">
                Opens WhatsApp with your request pre-filled — just hit send and we'll add your credits once payment is received.
              </p>
              </div>
            )}
            </CardContent>
          </Card>

        {/* Sub-resellers — full resellers only */}
        {session.user_type === "reseller" && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-fuchsia-400" />
                  Sub-Resellers
                </CardTitle>
                <Button
                  size="sm"
                  variant={showCreateSub ? "outline" : "default"}
                  className={showCreateSub ? "border-gray-700 text-gray-300" : "bg-fuchsia-600 hover:bg-fuchsia-700 text-white"}
                  onClick={() => setShowCreateSub((v) => !v)}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {showCreateSub ? "Cancel" : "Create Sub-Reseller"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-500 text-sm">
                Sub-resellers sign in on this page and can only extend customer subscriptions — spending the credits
                you send them. Top-ups stay with you.
              </p>
              {showCreateSub && (
                <form onSubmit={handleCreateSub} className="space-y-3 rounded-lg border border-gray-800 p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sub-name">Full Name</Label>
                      <Input
                        id="sub-name"
                        value={createSubForm.name}
                        onChange={(e) => setCreateSubForm((f) => ({ ...f, name: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sub-email">Email (their login)</Label>
                      <Input
                        id="sub-email"
                        type="email"
                        value={createSubForm.email}
                        onChange={(e) => setCreateSubForm((f) => ({ ...f, email: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sub-whatsapp">WhatsApp Number</Label>
                      <Input
                        id="sub-whatsapp"
                        value={createSubForm.whatsapp}
                        onChange={(e) => setCreateSubForm((f) => ({ ...f, whatsapp: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sub-password">Password</Label>
                      <Input
                        id="sub-password"
                        value={createSubForm.password}
                        onChange={(e) => setCreateSubForm((f) => ({ ...f, password: e.target.value }))}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white" disabled={creatingSub}>
                    {creatingSub ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" />Create Sub-Reseller</>
                    )}
                  </Button>
                </form>
              )}
              {subsLoading ? (
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading sub-resellers...
                </p>
              ) : subs.length === 0 ? (
                <p className="text-gray-500 text-sm py-2">
                  No sub-resellers yet — create one to start delegating extensions.
                </p>
              ) : (
                <div className="space-y-3">
                  {subs.map((sub) => {
                    const amount = Math.round(Number(transferAmounts[sub.id]));
                    const hasInput = (transferAmounts[sub.id] ?? "").trim() !== "";
                    const valid = Number.isFinite(amount) && amount > 0 && (session.credits ?? 0) >= amount;
                    return (
                      <div key={sub.id} className="rounded-lg border border-gray-800 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{sub.name || sub.username}</p>
                            <p className="text-gray-500 text-xs truncate">{sub.username}</p>
                          </div>
                          <Badge className="bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 shrink-0">
                            <Coins className="w-3 h-3 mr-1" />
                            {sub.credits ?? 0} credits
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="Credits to send"
                            value={transferAmounts[sub.id] ?? ""}
                            onChange={(e) => setTransferAmounts((m) => ({ ...m, [sub.id]: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white"
                            disabled={transferringSubId !== null}
                          />
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                            disabled={!valid || transferringSubId !== null}
                            onClick={() => handleTransfer(sub)}
                          >
                            {transferringSubId === sub.id ? (
                              <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Sending...</>
                            ) : (
                              <><Send className="w-4 h-4 mr-1" />Send</>
                            )}
                          </Button>
                        </div>
                        {hasInput && !valid && (
                          <p className="text-red-400 text-xs">
                            {(session.credits ?? 0) < amount
                              ? "Not enough credits in your balance"
                              : "Enter a positive credit amount"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Extend account */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Extend Customer Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lookup form */}
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Customer account email..."
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700 text-white"
                  disabled={lookupLoading || extending}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="border-gray-700"
                disabled={lookupLoading || extending || !lookupEmail.trim()}
              >
                {lookupLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</> : "Look Up"}
              </Button>
            </form>

            {customer && (
              <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 space-y-4">
                {/* Customer info */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-white">{customer.name || "Customer"}</p>
                    <p className="text-gray-400 text-sm">{customer.username}</p>
                  </div>
                  {customer.user_type === "admin" ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Admin — cannot be extended
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`border-gray-700 ${
                        customer.expiration_date && new Date(customer.expiration_date) > new Date()
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {customer.expiration_date && new Date(customer.expiration_date) > new Date() ? "Active" : "Expired"}
                      {customer.expiration_date
                        ? ` · until ${new Date(customer.expiration_date).toLocaleDateString("en-ZA")}`
                        : " · no expiry"}
                    </Badge>
                  )}
                </div>

                {customer.user_type !== "admin" && (
                  <>
                    {/* Plan picker */}
                    <div>
                      <Label className="text-gray-400 text-sm">Choose plan</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                        {RESELLER_PLANS.map((p) => {
                          const affordable = (session.credits ?? 0) >= p.cost;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={extending}
                              onClick={() => setSelectedPlan(p)}
                              className={`rounded-lg border p-2.5 text-center transition-colors disabled:opacity-50 ${
                                selectedPlan?.id === p.id
                                  ? "border-green-500 bg-green-600/20 text-green-300"
                                  : affordable
                                    ? "bg-gray-800 border-gray-600 hover:border-gray-400 text-gray-300"
                                    : "bg-gray-800/50 border-gray-800 text-gray-600"
                              }`}
                            >
                              <span className="block text-sm font-semibold">{p.label}</span>
                              <span
                                className={`block text-xs mt-0.5 ${
                                  selectedPlan?.id === p.id
                                    ? "text-green-400"
                                    : affordable
                                      ? "text-amber-400"
                                      : "text-gray-600"
                                }`}
                              >
                                {p.cost} credit{p.cost === 1 ? "" : "s"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* New expiry preview */}
                    {selectedPlan && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CalendarClock className="w-4 h-4 text-blue-400" />
                        New expiry:{" "}
                        <span className="text-white font-semibold">
                          {previewExpiry(customer.expiration_date, selectedPlan).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleExtend}
                      disabled={!selectedPlan || extending || session.credits < (selectedPlan?.cost ?? 0)}
                    >
                      {extending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Extending...</>
                      ) : !selectedPlan ? (
                        "Select a plan to extend"
                      ) : session.credits < selectedPlan.cost ? (
                        <><AlertTriangle className="w-4 h-4 mr-2" />Not enough credits</>
                      ) : (
                        <>Extend {selectedPlan.label} — {selectedPlan.cost} credit{selectedPlan.cost === 1 ? "" : "s"}</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}
            <p className="text-gray-600 text-xs">
              Extensions stack onto the customer's current expiry if still active — otherwise they start from today.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
