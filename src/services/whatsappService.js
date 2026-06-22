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
