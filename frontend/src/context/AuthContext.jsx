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
      // fetch user profile here if needed
      // e.g., fetch("/me") → setUser()
    }
  }, [token, user]);

  // Detect tenant subdomain automatically if no schema is stored
  useEffect(() => {
    if (!tenantSchema) {
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      let subdomain = null;

      if (hostname.includes("localhost") && parts.length > 1) {
        // e.g., tenant.localhost
        subdomain = parts[0];
      } else if (parts.length > 2) {
        // e.g., tenant.myapp.com
        subdomain = parts[0];
      }

      if (subdomain && subdomain !== "www") {
        setTenantSchema(subdomain);
        localStorage.setItem("tenantSchema", subdomain);
      }
    }
  }, [tenantSchema]);

  // Handle login
  const handleLogin = async (credentials) => {
    const schema = localStorage.getItem("tenantSchema") || null;

    const res = await login({
      ...credentials,
      schema,
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

  // Handle logout
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
