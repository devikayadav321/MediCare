import { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("mt_user")); } catch { return null; }
  });

  const save = ({ token, user }) => {
    sessionStorage.setItem("mt_token", token);
    sessionStorage.setItem("mt_user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => save(await api.login(email, password));
  const register = async (details) => save(await api.register(details));
  const doctorLogin = async (email, password) => save(await api.doctorLogin(email, password));
  const logout = () => {
    sessionStorage.removeItem("mt_token");
    sessionStorage.removeItem("mt_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, doctorLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
