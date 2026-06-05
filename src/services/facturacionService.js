import { api } from "./apiClient";

/**
 * Cobranza del SaaS: facturas mensuales por licencia, pago manual, config.
 * GET /admin/facturacion — paginado + filtros. Devuelve { data, total }.
 */
export async function listFacturas({ licid, estado, periodo, soloVencidas, page = 1, size = 20 } = {}) {
  const params = new URLSearchParams();
  if (licid) params.set("licid", licid);
  if (estado) params.set("estado", estado);
  if (periodo) params.set("periodo", periodo);
  if (soloVencidas) params.set("soloVencidas", "true");
  params.set("page", page);
  params.set("size", size);
  const res = await api.get(`/admin/facturacion?${params.toString()}`);
  if (Array.isArray(res)) return { data: res, total: res.length, page, size };
  return res;
}

/** POST /admin/facturacion/generar — genera la facturación del período (idempotente). */
export function generarFacturacion(periodo) {
  return api.post("/admin/facturacion/generar", { periodo: periodo || null });
}

/** PUT /admin/facturacion/{id}/pagar — registra el pago manual. */
export function registrarPago(id, payload) {
  return api.put(`/admin/facturacion/${id}/pagar`, payload);
}

/** DELETE /admin/facturacion/{id} — anula una factura pendiente. */
export function anularFactura(id) {
  return api.del(`/admin/facturacion/${id}`);
}

/** GET /admin/facturacion/config — día de cobro + días de gracia. */
export function getConfigCobranza() {
  return api.get("/admin/facturacion/config");
}

/** PUT /admin/facturacion/config */
export function updateConfigCobranza(payload) {
  return api.put("/admin/facturacion/config", payload);
}
