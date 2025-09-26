// src/utils/getApiBase.js
export function getApiBase({ company, useTenant = true } = {}) {
  const hostname = window.location.hostname; // e.g. localhost or myapp.com
  const protocol = window.location.protocol; // http:// or https://
  const port = import.meta.env.VITE_BACKEND_PORT || "";
  const ENV_API = import.meta.env.VITE_BASE_API; // fallback public API (e.g., https://api.myapp.com)

  // 1. Explicit company schema
  if (company?.schema && useTenant) {
    if (hostname === "localhost") {
      return `${protocol}//${company.schema}.localhost${port ? `:${port}` : ""}/api`;
    }
    return `${protocol}//${company.schema}.${hostname}/api`;
  }

  // 2. Stored tenant schema
  const tenantSchema = useTenant ? localStorage.getItem("tenantSchema") : null;
  if (tenantSchema) {
    if (hostname === "localhost") {
      return `${protocol}//${tenantSchema}.localhost${port ? `:${port}` : ""}/api`;
    }
    return `${protocol}//${tenantSchema}.${hostname}/api`;
  }

  // 3. Public API
  return `${ENV_API}/api`;
}
