import { api } from "./apiClient";

/**
 * Conexión de WhatsApp (Meta Cloud API) por clínica — onboarding gestionado por el SA.
 * GET devuelve el estado + los datos a pegar en Meta (verifyToken/webhookPath); nunca el token.
 */
export function getWhatsApp(licid) {
  return api.get(`/admin/whatsapp/${licid}`);
}

export function saveWhatsApp(licid, payload) {
  return api.post(`/admin/whatsapp/${licid}`, payload);
}

/** Módulo WhatsApp del ADM: odontologías con bot (plan/add-on WHATSAPP) + su conexión. */
export function listLicenciasConBot() {
  return api.get("/admin/whatsapp");
}

/** Plantillas de una licencia (estado refrescado desde Meta). */
export function listPlantillas(licid) {
  return api.get(`/admin/whatsapp/${licid}/plantillas`);
}

export function crearPlantilla(licid, payload) {
  return api.post(`/admin/whatsapp/${licid}/plantillas`, payload);
}

export function marcarRecordatorio(licid, wplid) {
  return api.post(`/admin/whatsapp/${licid}/plantillas/${wplid}/recordatorio`, {});
}

export function crearRecordatorioPlantilla(licid, nombre) {
  return api.post(`/admin/whatsapp/${licid}/plantillas/recordatorio`, nombre ? { nombre } : {});
}

export function eliminarPlantilla(licid, wplid) {
  return api.del(`/admin/whatsapp/${licid}/plantillas/${wplid}`);
}
