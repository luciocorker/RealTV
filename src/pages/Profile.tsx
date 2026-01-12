import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { User, Mail, Calendar, Tv, LogOut, ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/realtv-logo.png";
import { SEOHead } from "@/components/SEOHead";

const Profile = () => {
  const { user, logout, isLoggedIn } = useUser();
  const navigate = useNavigate();

  // Redirect to home if not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <SEOHead 
          title="Profile - RealTV" 
          description="View and manage your RealTV account profile and subscription."
          canonical="https://real-tv.vercel.app/profile"
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Not Logged In</h1>
          <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Calculate time remaining for trial
  const getTimeRemaining = () => {
    if (!user.expiration_date) return null;
    const expiration = new Date(user.expiration_date);
    const now = new Date();
    const diff = expiration.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="RealTV" className="h-10 w-auto" width="100" height="40" />
          </a>
          <Button onClick={() => navigate("/")} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {user.name || user.username}
            </h1>
            <p className="text-muted-foreground">Welcome to your RealTV account</p>
          </div>

          {/* Account Details Card */}
          <div className="bg-secondary/30 rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Details
            </h2>
            
            <div className="space-y-4">
              {user.name && (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Name</span>
                  </div>
                  <span className="text-foreground font-medium">{user.name}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                </div>
                <span className="text-foreground font-medium">{user.username}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Tv className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Max Devices</span>
                </div>
                <span className="text-foreground font-medium">{user.max_devices || 1}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Member Since</span>
                </div>
                <span className="text-foreground font-medium">
                  {user.created_at ? formatDate(user.created_at) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Status Card */}
          <div className="bg-secondary/30 rounded-xl border border-white/10 p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Subscription Status
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Status</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  Free Trial
                </span>
              </div>
              
              {user.expiration_date && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="text-foreground font-medium">
                      {formatDate(user.expiration_date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <span className="text-muted-foreground">Time Remaining</span>
                    <span className="text-accent font-bold">
                      {getTimeRemaining()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Upgrade Plan
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
