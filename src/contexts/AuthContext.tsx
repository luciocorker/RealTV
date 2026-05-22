import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;
const DB_HEADERS = { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };
const DB_JSON_HEADERS = { ...DB_HEADERS, "Content-Type": "application/json" };

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

  const fetchProfileById = async (id: string): Promise<UserProfile | null> => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=${encodeURIComponent(USER_SELECT)}&limit=1`,
      { headers: DB_HEADERS }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  };

  useEffect(() => {
    // Restore session from localStorage — no SDK calls that could hang
    const stored = localStorage.getItem("realtv_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("realtv_user"); }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    let resp: Response;
    try {
      resp = await fetch(
        `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=${encodeURIComponent(USER_SELECT + ",password")}&limit=1`,
        {
          headers: {
            "apikey": ANON_KEY,
            "Authorization": `Bearer ${ANON_KEY}`,
          },
        }
      );
    } catch {
      return { success: false, error: "Network error — cannot reach database" };
    }

    const rows = await resp.json();

    if (!resp.ok) {
      return { success: false, error: `DB error: ${rows?.message ?? resp.status}` };
    }
    if (!rows || rows.length === 0) {
      return { success: false, error: "Invalid username or password" };
    }

    const row = rows[0];
    if (row.password !== password) {
      return { success: false, error: "Invalid username or password" };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...profile } = row;
    setUser(profile as UserProfile);
    localStorage.setItem("realtv_user", JSON.stringify(profile));
    return { success: true };
  };

  const register = async (fields: { username: string; password: string; name: string; whatsapp_number: string }) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const headers = { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" };

    // Check for duplicate username / WhatsApp
    const [usernameRes, waRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(fields.username)}&select=id&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/users?whatsapp_number=eq.${encodeURIComponent(fields.whatsapp_number)}&select=id&limit=1`, { headers }),
    ]);
    const [existingUsers, existingWa] = await Promise.all([usernameRes.json(), waRes.json()]);
    if (existingUsers?.length > 0) return { success: false, error: "Username already taken" };
    if (existingWa?.length > 0) return { success: false, error: "This WhatsApp number is already registered to an account." };

    // Verify WhatsApp number — 5s timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const waCheckRes = await fetch(`${SUPABASE_URL}/functions/v1/check-whatsapp`, {
        method: "POST", headers, body: JSON.stringify({ phone: fields.whatsapp_number }), signal: controller.signal,
      });
      clearTimeout(timer);
      const waCheck = await waCheckRes.json();
      if (!waCheck.exists) return { success: false, error: "WhatsApp number not valid. Please enter a valid WhatsApp number." };
    } catch {
      // Timeout or network error — fail open
    }

    isRegistering.current = true;
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 1);

    // Create Supabase Auth account via raw fetch
    const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers, body: JSON.stringify({ email: fields.username, password: fields.password }),
    });
    const authData = await signUpRes.json();
    if (!signUpRes.ok || !authData.user) {
      isRegistering.current = false;
      return { success: false, error: authData.error_description || authData.msg || "Registration failed" };
    }
    const userId = authData.user.id;

    // Update the users row created by the DB trigger
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({
          name: fields.name,
          whatsapp_number: fields.whatsapp_number,
          expiration_date: trialExpiry.toISOString(),
          mobile_expiration_date: trialExpiry.toISOString(),
          password: fields.password,
        }),
      }
    );
    const updatedRows = await updateRes.json();
    if (!updateRes.ok || !updatedRows?.[0]) {
      isRegistering.current = false;
      return { success: false, error: "Profile setup failed" };
    }
    const profileData = updatedRows[0];

    // Create 1-day trial ArgonTV line
    try {
      const lineResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-line`, {
        method: "POST",
        headers,
        body: JSON.stringify({ username: fields.username, packageId: "3day-trial" }),
      });
      const lineData = await lineResponse.json();
      if (lineData.success) {
        profileData.line_id = lineData.line_id;
        profileData.line_username = lineData.line_username;
        profileData.line_password = lineData.line_password;
      }
    } catch (lineErr) {
      console.error("Failed to create line:", lineErr);
    }

    setUser(profileData);
    isRegistering.current = false;
    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("realtv_user");
    // Fire-and-forget sign out of Supabase Auth if there was a session
    fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: DB_HEADERS }).catch(() => {});
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: "Not logged in" };

    // Verify current password
    const verifyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}&password=eq.${encodeURIComponent(currentPassword)}&select=id&limit=1`,
      { headers: DB_HEADERS }
    );
    const verified = await verifyRes.json();
    if (!verified?.[0]) return { success: false, error: "Current password is incorrect" };

    // Update password
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: "PATCH",
      headers: { ...DB_JSON_HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({})) as { message?: string };
      return { success: false, error: err.message || "Failed to update password" };
    }
    return { success: true };
  };

  const refreshUser = async () => {
    if (!user) return;
    const profile = await fetchProfileById(user.id);
    if (profile) {
      setUser(profile);
      localStorage.setItem("realtv_user", JSON.stringify(profile));
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
