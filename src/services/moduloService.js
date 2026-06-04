import { api } from "./apiClient";

/**
 * Catálogo de MÓDULOS / funcionalidades del ERP (tabla `modulo` en Dental_Licencia).
 * Cada módulo tiene un precio mensual de referencia (como add-on suelto) y una
 * clave técnica (`modcodigo`) que el ERP usará para gatear features.
 *
 * GET /admin/modulo — paginado + filtros. Devuelve { data, total, page, size }.
 * El backend puede devolver también un array plano; `listModulos` normaliza.
 */
export async function listModulos({ search, estado, page = 1, size = 50 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (estado !== undefined && estado !== null && estado !== "") {
    params.set("estado", String(estado));
  }
  params.set("page", page);
  params.set("size", size);
  const res = await api.get(`/admin/modulo?${params.toString()}`);
  // Normaliza array plano -> { data, total }.
  if (Array.isArray(res)) return { data: res, total: res.length, page, size };
  return res;
}

/** Lista solo módulos activos (para el selector de planes). */
export async function listModulosActivos() {
  const res = await listModulos({ estado: true, page: 1, size: 200 });
  return res?.data ?? [];
}

/** POST /admin/modulo */
export function createModulo(payload) {
  return api.post("/admin/modulo", payload);
}

/** PUT /admin/modulo/{id} */
export function updateModulo(id, payload) {
  return api.put(`/admin/modulo/${id}`, payload);
}

/** DELETE /admin/modulo/{id} — soft-delete (modest = false). */
export function deleteModulo(id) {
  return api.del(`/admin/modulo/${id}`);
}

/**
 * POST /admin/modulo/inicializar-defaults — siembra el catálogo base de
 * módulos del ERP (Turnos, Caja, Reportes, …). Idempotente y aditivo.
 */
export function inicializarModulosDefault() {
  return api.post("/admin/modulo/inicializar-defaults");
}
