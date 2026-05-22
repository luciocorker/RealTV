import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  whatsapp_number: string;
  expiration_date: string;
  user_type: string;
  line_id?: number;
  line_username?: string;
  line_password?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fields: { username: string; password: string; name: string; whatsapp_number: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const USER_SELECT = "id, username, name, whatsapp_number, expiration_date, user_type, line_id, line_username, line_password";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isRegistering = useRef(false);

  const fetchProfile = async (id: string): Promise<UserProfile | null> => {
    const { data } = await supabase.from("users").select(USER_SELECT).eq("id", id).maybeSingle();
    return data ?? null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isRegistering.current) return;
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
    if (error || !data.user) {
      return { success: false, error: "Invalid username or password" };
    }
    const profile = await fetchProfile(data.user.id);
    setUser(profile);
    return { success: true };
  };

  const register = async (fields: { username: string; password: string; name: string; whatsapp_number: string }) => {
    const t0 = performance.now();
    const elapsed = (label: string) => console.log(`[register] ${label}: ${(performance.now() - t0).toFixed(0)}ms`);

    // Run both existence checks in parallel
    const [{ data: existing }, { data: existingWa }] = await Promise.all([
      supabase.from("users").select("id").eq("username", fields.username).maybeSingle(),
      supabase.from("users").select("id").eq("whatsapp_number", fields.whatsapp_number).maybeSingle(),
    ]);
    elapsed("DB duplicate checks done");

    if (existing) {
      return { success: false, error: "Username already taken" };
    }
    if (existingWa) {
      return { success: false, error: "This WhatsApp number is already registered to an account." };
    }

    // Verify WhatsApp number — 5 s timeout so a slow Green API doesn't stall registration
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const waCheckRes = await fetch(
        "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/check-whatsapp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fields.whatsapp_number }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      const waCheck = await waCheckRes.json();
      elapsed(`check-whatsapp done (exists=${waCheck.exists})`);
      if (!waCheck.exists) {
        return { success: false, error: "WhatsApp number not valid. Please enter a valid WhatsApp number." };
      }
    } catch (e) {
      elapsed(`check-whatsapp failed/timed out (${e})`);
      // Timeout or network error — fail open
    }

    isRegistering.current = true;
    const trialExpiry = new Date();
    trialExpiry.setHours(trialExpiry.getHours() + 3);

    // Create Supabase Auth account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: fields.username,
      password: fields.password,
    });
    elapsed("signUp done");

    if (signUpError || !authData.user) {
      isRegistering.current = false;
      return { success: false, error: signUpError?.message || "Registration failed" };
    }

    // Populate the users row created by the DB trigger
    // Also write password so the Android app can read it from the users table
    const { data: profileData, error: updateError } = await supabase
      .from("users")
      .update({
        name: fields.name,
        whatsapp_number: fields.whatsapp_number,
        expiration_date: trialExpiry.toISOString(),
        mobile_expiration_date: trialExpiry.toISOString(),
        password: fields.password,
      })
      .eq("id", authData.user.id)
      .select(USER_SELECT)
      .single();
    elapsed("user row update done");

    if (updateError || !profileData) {
      isRegistering.current = false;
      return { success: false, error: updateError?.message || "Profile setup failed" };
    }

    // Create a 3-hour trial ArgonTV line
    try {
      const lineResponse = await fetch(
        "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/create-line",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          },
          body: JSON.stringify({ username: fields.username, packageId: "3day-trial" }),
        }
      );
      const lineData = await lineResponse.json();
      elapsed("create-line done");
      console.log("create-line response:", lineData);
      if (lineData.success) {
        profileData.line_id = lineData.line_id;
        profileData.line_username = lineData.line_username;
        profileData.line_password = lineData.line_password;
      }
    } catch (lineErr) {
      elapsed("create-line failed");
      console.error("Failed to create line:", lineErr);
    }

    elapsed("registration complete");
    setUser(profileData);
    isRegistering.current = false;
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: "Not logged in" };

    // Verify the current password first
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.username,
      password: currentPassword,
    });
    if (verifyError) {
      return { success: false, error: "Current password is incorrect" };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: `Failed to update password: ${error.message}` };
    }

    return { success: true };
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updatePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
