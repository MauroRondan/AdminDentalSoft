import { api } from "./apiClient";

/**
 * Catálogo de ORÍGENES DE VENTA (vendedores y redes) para la atribución del QR de
 * prueba (tabla `venta_origen` en Dental_Licencia). Cada origen tiene su propio QR:
 * la URL lleva ?ref=<vorcodigo> y la landing lo manda al registrarse.
 *
 * GET /admin/venta-origen — paginado + filtros. Devuelve { data, total, page, size }.
 */
export async function listVentaOrigenes({ search, canal, estado, page = 1, size = 100 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (canal) params.set("canal", canal);
  if (estado !== undefined && estado !== null && estado !== "") {
    params.set("estado", String(estado));
  }
  params.set("page", page);
  params.set("size", size);
  const res = await api.get(`/admin/venta-origen?${params.toString()}`);
  if (Array.isArray(res)) return { data: res, total: res.length, page, size };
  return res;
}

/** Lista solo orígenes activos (para el selector del QR). */
export async function listVentaOrigenesActivos() {
  const res = await listVentaOrigenes({ estado: true, page: 1, size: 200 });
  return res?.data ?? [];
}

/** POST /admin/venta-origen */
export function createVentaOrigen(payload) {
  return api.post("/admin/venta-origen", payload);
}

/** PUT /admin/venta-origen/{id} */
export function updateVentaOrigen(id, payload) {
  return api.put(`/admin/venta-origen/${id}`, payload);
}

/** DELETE /admin/venta-origen/{id} — soft-delete (vorest = false). */
export function deleteVentaOrigen(id) {
  return api.del(`/admin/venta-origen/${id}`);
}
