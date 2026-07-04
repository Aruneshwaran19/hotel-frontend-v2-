import { createContext, useContext, useEffect, useState } from "react";
import auth from "../auth/axiosInstance";

// Create and export the context
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasBanner, setHasBanner] = useState(false);

  // 🔄 Restore session on refresh
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await auth.get("/auth/profile");
        setUser(res.data); // { id, role, name, ... }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, hasBanner, setHasBanner }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
