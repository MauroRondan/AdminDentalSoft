import { api } from "./apiClient";

/**
 * Reporte de atribución de ventas del QR de prueba: cuántos trials entraron por cada
 * vendedor/red y por canal, cuántos convirtieron a pago, y la serie mensual.
 *
 * GET /admin/ventas/atribucion?desde=&hasta= (rango opcional, ISO yyyy-mm-dd).
 * Devuelve { porOrigen, porCanal, serie, totales }.
 */
export function getAtribucion({ desde, hasta } = {}) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString();
  return api.get(`/admin/ventas/atribucion${qs ? `?${qs}` : ""}`);
}
