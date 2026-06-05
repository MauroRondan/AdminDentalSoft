import { api } from "./apiClient";

/**
 * GET /admin/dashboard — KPIs y series del panel SaaS: licencias (total/activas/
 * suspendidas/con-sin plan), planes/módulos/add-ons, MRR estimado, facturación
 * (pendiente/vencida/cobrado del mes), ingresos por mes y licencias por plan.
 */
export function getDashboard() {
  return api.get("/admin/dashboard");
}
