import { api } from "./apiClient";

/**
 * PLANES DE MENSAJES de WhatsApp (Sprint 85, tabla `plan_mensaje` en Dental_Licencia).
 * Cada plan trae el MISMO cupo para las 3 categorías (conversaciones del bot,
 * recordatorios y chats que inicia la clínica), lo que cuesta a Meta y el precio
 * final al cliente. Solo se asigna a licencias cuyo plan incluye el módulo WHATSAPP.
 */

/** GET /admin/plan-mensaje — catálogo activo (Bronce → Esmeralda). */
export function listPlanesMensaje() {
  return api.get("/admin/plan-mensaje");
}

/** GET /admin/licencia/{id}/plan-mensaje — { actual, elegible }. */
export function getPlanMensajeLicencia(licid) {
  return api.get(`/admin/licencia/${licid}/plan-mensaje`);
}

/** PUT /admin/licencia/{id}/plan-mensaje — asigna (pmsid) o quita (null). */
export function setPlanMensajeLicencia(licid, pmsid) {
  return api.put(`/admin/licencia/${licid}/plan-mensaje`, { pmsid });
}
