import { api } from "./apiClient";

/**
 * Licencias = clínicas suscriptas al ERP (tabla `licencia` en Dental_Licencia).
 * El panel SaaS las lista, les asigna un plan, las suspende/reactiva y administra
 * sus add-ons (módulos extra fuera del plan, tabla `licencia_modulo`).
 *
 * GET /admin/licencia — paginado + filtros. Devuelve { data, total, page, size }.
 */
export async function listLicencias({ search, estado, planid, page = 1, size = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (estado !== undefined && estado !== null && estado !== "") {
    params.set("estado", String(estado));
  }
  if (planid) params.set("planid", planid);
  params.set("page", page);
  params.set("size", size);
  const res = await api.get(`/admin/licencia?${params.toString()}`);
  if (Array.isArray(res)) return { data: res, total: res.length, page, size };
  return res;
}

/** GET /admin/licencia/{id} — detalle con la lista de add-ons activos. */
export function getLicencia(id) {
  return api.get(`/admin/licencia/${id}`);
}

/**
 * POST /admin/licencia — alta de una clínica nueva (licencia + usuario admin).
 * payload: { licnom, licruc, licmail, lictel, adminNombre, adminEmail, password, planid?, licterminales? }
 */
export function crearLicencia(payload) {
  return api.post("/admin/licencia", payload);
}

/** PUT /admin/licencia/{id}/plan — asigna (o quita, planid=null) el plan. */
export function asignarPlan(id, planid) {
  return api.put(`/admin/licencia/${id}/plan`, { planid: planid ?? null });
}

/** PUT /admin/licencia/{id}/estado — suspende (false) o reactiva (true). */
export function cambiarEstadoLicencia(id, estado) {
  return api.put(`/admin/licencia/${id}/estado`, { estado });
}

/** POST /admin/licencia/{id}/modulo — agrega/actualiza un add-on. */
export function agregarAddon(id, modid, precio) {
  return api.post(`/admin/licencia/${id}/modulo`, { modid, precio: precio ?? null });
}

/** DELETE /admin/licencia/{id}/modulo/{modid} — quita un add-on. */
export function quitarAddon(id, modid) {
  return api.del(`/admin/licencia/${id}/modulo/${modid}`);
}
