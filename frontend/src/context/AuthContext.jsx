import { createContext, useState, useEffect } from "react";
import { login } from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [tenantSchema, setTenantSchema] = useState(localStorage.getItem("tenantSchema") || null);

  // Optionally: fetch user profile if token exists
  useEffect(() => {
    if (token && !user) {
      // e.g., fetch("/me") → setUser()
    }
  }, [token, user]);

 const handleLogin = async (credentials) => {
  const tenantSchema = localStorage.getItem("tenantSchema") || null;

  const res = await login({
    ...credentials,
    schema: tenantSchema,
  });

  const { user, token, company } = res.data;

  setUser(user);
  setToken(token);
  setTenantSchema(company.schema);

  localStorage.setItem("authUser", JSON.stringify(user));
  localStorage.setItem("authToken", token);
  localStorage.setItem("tenantSchema", company.schema);

  return res;
};


  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setTenantSchema(null);

    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("tenantSchema");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantSchema,
        handleLogin,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
