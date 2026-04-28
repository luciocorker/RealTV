import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("realtv_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        localStorage.removeItem("realtv_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, name, whatsapp_number, expiration_date, user_type, line_id, line_username, line_password")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "Invalid username or password" };
    }

    const profile: UserProfile = data;
    setUser(profile);
    localStorage.setItem("realtv_user", JSON.stringify(profile));
    return { success: true };
  };

  const register = async (fields: { username: string; password: string; name: string; whatsapp_number: string }) => {
    // Check if username already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", fields.username)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Username already taken" };
    }

    // Check if WhatsApp number is already registered
    const { data: existingWa } = await supabase
      .from("users")
      .select("id")
      .eq("whatsapp_number", fields.whatsapp_number)
      .maybeSingle();

    if (existingWa) {
      return { success: false, error: "This WhatsApp number is already registered to an account." };
    }

    // Verify WhatsApp number exists
    try {
      const waCheckRes = await fetch(
        "https://bdtgjltygenmxlrifeds.supabase.co/functions/v1/check-whatsapp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: fields.whatsapp_number }),
        }
      );
      const waCheck = await waCheckRes.json();
      if (!waCheck.exists) {
        return { success: false, error: "WhatsApp number not valid. Please enter a valid WhatsApp number." };
      }
    } catch {
      return { success: false, error: "Could not verify WhatsApp number. Please try again." };
    }

    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 3);

    const { data, error } = await supabase
      .from("users")
      .insert({
        username: fields.username,
        password: fields.password,
        name: fields.name,
        whatsapp_number: fields.whatsapp_number,
        user_type: "standard",
        expiration_date: trialExpiry.toISOString(),
        mobile_expiration_date: trialExpiry.toISOString(),
      })
      .select("id, username, name, whatsapp_number, expiration_date, user_type, line_id, line_username, line_password")
      .single();

    if (error || !data) {
      console.error("Register error:", error);
      return { success: false, error: error?.message || "Registration failed" };
    }

    // Create a 3-day trial line via ArgonTV
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
      console.log("create-line response:", lineData);
      if (lineData.success) {
        data.line_id = lineData.line_id;
        data.line_username = lineData.line_username;
        data.line_password = lineData.line_password;
      }
    } catch (lineErr) {
      console.error("Failed to create line:", lineErr);
    }

    const profile: UserProfile = data;
    setUser(profile);
    localStorage.setItem("realtv_user", JSON.stringify(profile));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("realtv_user");
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: "Not logged in" };

    // Verify current password
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("username", user.username)
      .eq("password", currentPassword)
      .maybeSingle();

    if (!data) {
      return { success: false, error: "Current password is incorrect" };
    }

    const { data: updated, error } = await supabase
      .from("users")
      .update({ password: newPassword })
      .eq("id", data.id)
      .select("id");

    if (error) {
      console.error("Password update error:", error);
      return { success: false, error: `Failed to update password: ${error.message}` };
    }

    if (!updated || updated.length === 0) {
      return { success: false, error: "Password update failed. Please try again." };
    }

    return { success: true };
  };

  const refreshUser = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("id, username, name, whatsapp_number, expiration_date, user_type, line_id, line_username, line_password")
      .eq("username", user.username)
      .maybeSingle();

    if (data) {
      setUser(data);
      localStorage.setItem("realtv_user", JSON.stringify(data));
    }
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
