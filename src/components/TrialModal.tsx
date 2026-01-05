import { useState } from "react";
import { X, Mail, User, Loader2, Lock, Eye, EyeOff, Download, CheckCircle, Smartphone, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createTrialUser, loginUser } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginOnly?: boolean;
}

export function TrialModal({ isOpen, onClose, loginOnly = false }: TrialModalProps) {
  const [mode, setMode] = useState<"signup" | "login">(loginOnly ? "login" : "signup");
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup" && !name) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    
    if (!email || !password) {
      toast({
        title: "All fields required",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup" && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { user, error } = await createTrialUser(email, password, name);
        
        if (error) {
          toast({
            title: "Sign up failed",
            description: error,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (user) {
          setUser(user);
        }

        toast({
          title: "Account Created! 🎉",
          description: "Your 24-hour free trial has started!",
        });
        
        setIsLoading(false);
        setStep("success");
        return;
      } else {
        const { user, error } = await loginUser(email, password);
        
        if (error) {
          toast({
            title: "Login failed",
            description: error,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (user) {
          setUser(user);
        }

        toast({
          title: "Welcome back! 🎉",
          description: "You're now logged in. Enjoy your content!",
        });
      }

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsLoading(false);
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setMode(loginOnly ? "login" : "signup");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-md animate-scale-in rounded-xl bg-card p-6 shadow-2xl gradient-border glow mx-4">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {step === "success" ? (
          /* Success Screen with Instructions */
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Welcome, {name}! 🎉
              </h2>
              <p className="text-muted-foreground">
                Your 24-hour free trial has started
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Your Login Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground font-mono">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground font-mono">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="text-foreground font-mono">••••••••</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left mb-6">
              <h3 className="font-semibold text-foreground text-center">Next Steps:</h3>
              
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Download the App</p>
                  <p className="text-sm text-muted-foreground">
                    Go to the Download section and get the app for your device
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Open the App & Login</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and password shown above
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Start Watching!</p>
                  <p className="text-sm text-muted-foreground">
                    Enjoy unlimited access to all channels for 24 hours
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                handleClose();
                document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold relative z-50 cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" />
              Go to Downloads
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {loginOnly 
                  ? (mode === "signup" ? "Create Account" : "Sign In")
                  : (mode === "signup" ? "Start Your Free Trial" : "Welcome Back")}
              </h2>
              <p className="text-muted-foreground">
                {loginOnly
                  ? (mode === "signup" 
                      ? "Create an account to continue" 
                      : "Sign in to access your account")
                  : (mode === "signup" 
                      ? "Get 24 hours of unlimited access" 
                      : "Login to continue watching")}
              </p>
            </div>

        {/* Toggle between signup and login */}
        <div className="flex mb-6 bg-secondary rounded-lg p-1 relative z-50">
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer relative z-50 ${
              mode === "signup" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer relative z-50 ${
              mode === "login" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email Address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-secondary border-border"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm Password *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold relative z-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "signup" ? "Creating Account..." : "Logging in..."}
              </>
            ) : (
              loginOnly
                ? (mode === "signup" ? "Create Account" : "Sign In")
                : (mode === "signup" ? "Start Free Trial" : "Login")
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signup" 
            ? (loginOnly ? "Already have an account? Click Login above." : "No credit card required. 24-hour free trial.")
            : "Don't have an account? Click Sign Up above."}
        </p>
          </>
        )}
      </div>
    </div>
  );
}
