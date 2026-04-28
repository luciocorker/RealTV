import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  LogOut,
  KeyRound,
  Calendar,
  Shield,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

export default function Account() {
  const { user, isLoading, login, register, logout, updatePassword, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [isRegister, setIsRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPw, setRegConfirmPw] = useState("");
  const [regWhatsApp, setRegWhatsApp] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Change password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoginLoading(true);
    const result = await login(username.trim(), password);
    setLoginLoading(false);
    if (!result.success) {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Welcome!", description: "Logged in successfully" });
      setUsername("");
      setPassword("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword || !regWhatsApp.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (regPassword !== regConfirmPw) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (regPassword.length < 4) {
      toast({ title: "Error", description: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    setRegLoading(true);
    const result = await register({
      username: regUsername.trim(),
      password: regPassword,
      name: regName.trim(),
      whatsapp_number: regWhatsApp.trim(),
    });
    setRegLoading(false);
    if (!result.success) {
      toast({ title: "Registration Failed", description: result.error, variant: "destructive" });
    } else {
      setShowTrialModal(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      toast({ title: "Error", description: "New passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 4) {
      toast({ title: "Error", description: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const result = await updatePassword(currentPw, newPw);
    setPwLoading(false);
    if (result.success) {
      toast({ title: "Success", description: "Password updated" });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowChangePw(false);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out" });
  };

  const isExpired = user?.expiration_date
    ? new Date(user.expiration_date) < new Date()
    : false;

  const daysLeft = user?.expiration_date
    ? Math.ceil((new Date(user.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Not logged in ────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            {isRegister ? (
              <UserPlus className="mx-auto mb-4 h-12 w-12 text-primary" />
            ) : (
              <User className="mx-auto mb-4 h-12 w-12 text-primary" />
            )}
            <h1 className="font-display text-2xl font-bold text-foreground">
              {isRegister ? "Create Account" : "Account Login"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRegister
                ? "Sign up for a RealTV account"
                : "Sign in with your RealTV credentials"}
            </p>
          </div>

          {!isRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setIsRegister(true)}
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="regName">Full Name</Label>
                <Input
                  id="regName"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regUsername">Username / Email</Label>
                <Input
                  id="regUsername"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="username"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regWhatsApp">WhatsApp Number</Label>
                <Input
                  id="regWhatsApp"
                  value={regWhatsApp}
                  onChange={(e) => setRegWhatsApp(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 0812345678"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="regPassword"
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regConfirmPw">Confirm Password</Label>
                <Input
                  id="regConfirmPw"
                  type="password"
                  value={regConfirmPw}
                  onChange={(e) => setRegConfirmPw(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={regLoading}>
                {regLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setIsRegister(false)}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─── Logged in ────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        {/* Account details */}
        <div className="space-y-4 mb-8">
          {/* User type */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <Shield className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Account Type</p>
              <p className="font-semibold text-foreground capitalize">{user.user_type}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              user.user_type?.toLowerCase().includes("premium")
                ? "bg-primary/10 text-primary"
                : "bg-secondary text-foreground"
            }`}>
              {user.user_type?.toLowerCase().includes("premium") ? "Premium" : "Standard"}
            </span>
          </div>

          {/* Expiration */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Subscription Expiry</p>
              <p className="font-semibold text-foreground">
                {user.expiration_date
                  ? new Date(user.expiration_date).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
            {user.expiration_date && (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                isExpired
                  ? "bg-red-500/10 text-red-500"
                  : daysLeft <= 7
                    ? "bg-yellow-500/10 text-yellow-500"
                    : "bg-green-500/10 text-green-500"
              }`}>
                {isExpired ? "Expired" : `${daysLeft} days left`}
              </span>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">WhatsApp Number</p>
              <p className="font-semibold text-foreground">{user.whatsapp_number || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="mb-6">
          {!showChangePw ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowChangePw(true)}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="currentPw" className="text-xs">Current Password</Label>
                  <Input
                    id="currentPw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newPw" className="text-xs">New Password</Label>
                  <Input
                    id="newPw"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPw" className="text-xs">Confirm New Password</Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={pwLoading}>
                    {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowChangePw(false);
                      setCurrentPw("");
                      setNewPw("");
                      setConfirmPw("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Renew if expired */}
        {isExpired && (
          <Button
            className="w-full mb-4"
            size="lg"
            onClick={() => navigate("/shop")}
          >
            Renew Subscription
          </Button>
        )}

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>

    <Dialog open={showTrialModal} onOpenChange={setShowTrialModal}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Shield className="h-8 w-8 text-green-500" />
          </div>
          <DialogTitle className="text-xl">Free Trial Activated!</DialogTitle>
          <DialogDescription className="text-sm">
            Your <strong>3 day free trial</strong> has been activated. Enjoy full access to RealTV!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => setShowTrialModal(false)}>
            Okay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
