// src/utils/getApiBase.js
export function getApiBase({ company, useTenant = true } = {}) {
  const hostname = window.location.hostname; // e.g. sme.localhost or api.myapp.com
  const protocol = window.location.protocol; // http:// or https://
  const port = import.meta.env.VITE_BACKEND_PORT || "";
  const ENV_API = import.meta.env.VITE_BASE_API; // fallback (e.g., https://api.myapp.com)

  // 1. Explicit company schema (preferred)
  if (company?.schema && useTenant) {
    if (hostname === "localhost") {
      return `${protocol}//${company.schema}.localhost${port ? `:${port}` : ""}/api`;
    }
    return `${protocol}//${company.schema}.${hostname}/api`;
  }

  // 2. Try to extract schema from subdomain (works for tenant.localhost or tenant.myapp.com)
  if (useTenant) {
    const parts = hostname.split(".");
    // localhost handling (schema.localhost → [schema, localhost])
    if (hostname.includes("localhost") && parts.length > 1) {
      const schema = parts[0];
      if (schema && schema !== "www") {
        return `${protocol}//${schema}.localhost${port ? `:${port}` : ""}/api`;
      }
    }

    // production domain handling (schema.myapp.com → [schema, myapp, com])
    if (parts.length > 2) {
      const schema = parts[0];
      if (schema && schema !== "www") {
        return `${protocol}//${schema}.${parts.slice(1).join(".")}/api`;
      }
    }
  }

  // 3. Stored tenant schema in localStorage
  const tenantSchema = useTenant ? localStorage.getItem("tenantSchema") : null;
  if (tenantSchema) {
    if (hostname === "localhost") {
      return `${protocol}//${tenantSchema}.localhost${port ? `:${port}` : ""}/api`;
    }
    return `${protocol}//${tenantSchema}.${hostname}/api`;
  }

  // 4. Public API fallback
  return `${ENV_API}/api`;
}
