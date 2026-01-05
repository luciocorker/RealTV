import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  name: string;
  expiration_date: string;
  max_devices: number;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on initial render
    const savedUser = localStorage.getItem('realtv_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('realtv_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('realtv_user');
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('realtv_user');
  };

  const isLoggedIn = !!user;

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
