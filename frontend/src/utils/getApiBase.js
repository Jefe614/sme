// src/utils/getApiBase.js
export function getApiBase({ company, useTenant = true } = {}) {
  const hostname = window.location.hostname; // e.g., sme.localhost or tenant.myapp.com
  const protocol = window.location.protocol; // http:// or https://
  const port = import.meta.env.VITE_BACKEND_PORT || "";
  const ENV_API = import.meta.env.VITE_BASE_API; // fallback API base

  let schema = null;

  // 1. Explicit company schema (from object)
  if (company?.schema && useTenant) {
    schema = company.schema;
  }

  // 2. Extract from subdomain
  if (!schema && useTenant) {
    const parts = hostname.split(".");
    if (hostname.includes("localhost") && parts.length > 1) {
      // e.g., tenant.localhost
      const sub = parts[0];
      if (sub && sub !== "www") schema = sub;
    } else if (parts.length > 2) {
      // e.g., tenant.myapp.com
      const sub = parts[0];
      if (sub && sub !== "www") schema = sub;
    }
  }

  // 3. Fallback to localStorage
  if (!schema && useTenant) {
    const storedSchema = localStorage.getItem("tenantSchema");
    if (storedSchema) schema = storedSchema;
  }

  // 4. Build API URL
  if (schema && useTenant) {
    if (hostname.includes("localhost")) {
      return `${protocol}//${schema}.localhost${port ? `:${port}` : ""}/api`;
    } else {
      const domain = hostname.split(".").slice(1).join(".");
      return `${protocol}//${schema}.${domain}/api`;
    }
  }

  // 5. Fallback public API
  return `${ENV_API}/api`;
}
