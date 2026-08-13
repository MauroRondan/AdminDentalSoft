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

/* Onboarding sin Facebook (Sprint 92): WABAs madre + activar número por código SMS. */

export function listWabas() {
  return api.get(`/admin/whatsapp/wabas`);
}

export function crearWaba(nombre, wabaId) {
  return api.post(`/admin/whatsapp/wabas`, { nombre, wabaId });
}

export function eliminarWaba(id) {
  return api.del(`/admin/whatsapp/wabas/${id}`);
}

/** Paso 1: agrega el número del cliente a la WABA y Meta le manda el código. */
export function onboardingAgregarNumero(licid, body) {
  return api.post(`/admin/whatsapp/${licid}/numero/agregar`, body);
}

/** Paso 2: verifica el código — la clínica queda conectada sola. */
export function onboardingVerificarNumero(licid, body) {
  return api.post(`/admin/whatsapp/${licid}/numero/verificar`, body);
}

/** Reintento del registro en Cloud API (sin esto el número queda mudo en Meta). */
export function onboardingRegistrarNumero(licid, body) {
  return api.post(`/admin/whatsapp/${licid}/numero/registrar`, body || {});
}

/* Plantillas de la WABA (Sprint 95): son GENÉRICAS — una vez por WABA, no por
   clínica. Se leen/escriben directo en Meta, así el estado que se ve es el real. */

export function listPlantillasWaba(wabaId) {
  return api.get(`/admin/whatsapp/wabas/${wabaId}/plantillas`);
}

export function crearPlantillaWaba(wabaId, payload) {
  return api.post(`/admin/whatsapp/wabas/${wabaId}/plantillas`, payload);
}

export function eliminarPlantillaWaba(wabaId, nombre) {
  return api.del(`/admin/whatsapp/wabas/${wabaId}/plantillas?nombre=${encodeURIComponent(nombre)}`);
}
