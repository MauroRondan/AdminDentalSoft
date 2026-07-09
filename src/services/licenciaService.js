import { api } from "./apiClient";

/**
 * Licencias = clínicas suscriptas al ERP (tabla `licencia` en Dental_Licencia).
 * El panel SaaS las lista, les asigna un plan, las suspende/reactiva y administra
 * sus add-ons (módulos extra fuera del plan, tabla `licencia_modulo`).
 *
 * GET /admin/licencia — paginado + filtros. Devuelve { data, total, page, size }.
 */
export async function listLicencias({ search, estado, planid, trial, page = 1, size = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (estado !== undefined && estado !== null && estado !== "") {
    params.set("estado", String(estado));
  }
  if (planid) params.set("planid", planid);
  if (trial !== undefined && trial !== null) params.set("trial", String(trial));
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

/** GET /admin/edicion — ediciones activas (para el selector "Edición" del alta de licencia). */
export function listEdiciones() {
  return api.get("/admin/edicion");
}

/** PUT /admin/edicion/{id} — actualiza el branding de una edición (marca, logo, color, dominio). */
export function updateEdicionBranding(id, payload) {
  return api.put(`/admin/edicion/${id}`, payload);
}

/**
 * PUT /admin/licencia/{id} — edita los datos de contacto/comerciales de la
 * clínica. No incluye el RUC (los usuarios se vinculan por él) ni la contraseña.
 * payload: { licnom, licmail, lictel, licterminales }
 */
export function updateLicencia(id, payload) {
  return api.put(`/admin/licencia/${id}`, payload);
}

/** PUT /admin/licencia/{id}/plan — asigna (o quita, planid=null) el plan. */
export function asignarPlan(id, planid) {
  return api.put(`/admin/licencia/${id}/plan`, { planid: planid ?? null });
}

/** PUT /admin/licencia/{id}/estado — suspende (false) o reactiva (true). */
export function cambiarEstadoLicencia(id, estado) {
  return api.put(`/admin/licencia/${id}/estado`, { estado });
}

/** PUT /admin/licencia/{id}/convertir — convierte un trial en suscripción paga (limpia trial + plan opcional). */
export function convertirLicencia(id, planid) {
  return api.put(`/admin/licencia/${id}/convertir`, { planid: planid ?? null });
}

/** PUT /admin/licencia/{id}/extender-trial — extiende la prueba N días. */
export function extenderTrial(id, dias) {
  return api.put(`/admin/licencia/${id}/extender-trial`, { dias });
}

/** POST /admin/licencia/{id}/modulo — agrega/actualiza un add-on. */
export function agregarAddon(id, modid, precio) {
  return api.post(`/admin/licencia/${id}/modulo`, { modid, precio: precio ?? null });
}

/** DELETE /admin/licencia/{id}/modulo/{modid} — quita un add-on. */
export function quitarAddon(id, modid) {
  return api.del(`/admin/licencia/${id}/modulo/${modid}`);
}

/**
 * GET /admin/licencia/{id}/limite — estado de cupos de la licencia.
 * Devuelve { recursos:[{recurso,etiqueta,enforced}], planLimites:{recurso:valor},
 * overrides:{recurso:valor}, uso:[{recurso,etiqueta,limite,usado,disponible,enforced}] }.
 */
export function getLimitesLicencia(id) {
  return api.get(`/admin/licencia/${id}/limite`);
}

/** PUT /admin/licencia/{id}/limite — reemplaza los overrides de cupo de la licencia. */
export function setLimitesLicencia(id, limites) {
  return api.put(`/admin/licencia/${id}/limite`, { limites });
}
