import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [ready, setReady] = useState(() => !localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user_profile")); } catch { return null; }
  });

  useEffect(() => {
    if (!localStorage.getItem("access_token")) { setUser(null); setReady(true); return; }
    api.currentUser().then((profile) => { localStorage.setItem("user_profile", JSON.stringify(profile)); setUser(profile); })
      .catch(() => { api.logout(); setUser(null); }).finally(() => setReady(true));
  }, []);

  const login = async (email, password) => setUser((await api.login(email, password)).user);
  const register = async (details) => setUser((await api.register(details)).user);
  const doctorLogin = async (email, password) => setUser((await api.doctorLogin(email, password)).user);
  const logout = () => {
    api.logout();
    setUser(null);
    setReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, doctorLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
