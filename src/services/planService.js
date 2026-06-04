import { api } from "./apiClient";

/**
 * PLANES de suscripción del SaaS (tabla `plan` en Dental_Licencia).
 * Modelo híbrido: cada plan es un "tier" con nombre y precio mensual base, y
 * empaqueta un conjunto de módulos (relación `plan_modulo`). Los módulos no
 * incluidos pueden venderse aparte como add-on por licencia.
 *
 * GET /admin/plan — listado. Devuelve { data, total } o un array plano.
 */
export async function listPlanes({ search, estado, page = 1, size = 50 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (estado !== undefined && estado !== null && estado !== "") {
    params.set("estado", String(estado));
  }
  params.set("page", page);
  params.set("size", size);
  const res = await api.get(`/admin/plan?${params.toString()}`);
  if (Array.isArray(res)) return { data: res, total: res.length, page, size };
  return res;
}

/** GET /admin/plan/{id} — detalle con la lista de módulos incluidos. */
export function getPlan(id) {
  return api.get(`/admin/plan/${id}`);
}

/**
 * POST /admin/plan
 * payload: { plncodigo, plnnom, plndesc, plnprecio, plnperiodo,
 *            plnmaxterminales, plndestacado, plnest, modulos: [modid, ...] }
 */
export function createPlan(payload) {
  return api.post("/admin/plan", payload);
}

/** PUT /admin/plan/{id} */
export function updatePlan(id, payload) {
  return api.put(`/admin/plan/${id}`, payload);
}

/** DELETE /admin/plan/{id} — soft-delete (plnest = false). */
export function deletePlan(id) {
  return api.del(`/admin/plan/${id}`);
}
