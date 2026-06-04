import { API_URL, SESSION_KEY } from "../config/constants";
import { get, remove } from "../utils/storage";

/**
 * Endpoints públicos donde un 401 NO debe disparar logout/redirect
 * (porque el usuario no está logueado todavía).
 */
const PUBLIC_PATHS = ["/usuario/validar", "/usuario/hello"];

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Maneja un 401 en endpoint privado: borra sesión y redirige a /login.
 */
function handleUnauthorized(path) {
  if (PUBLIC_PATHS.includes(path)) return;
  remove(SESSION_KEY);
  if (typeof window !== "undefined" && !window.location.hash.endsWith("#/login")) {
    window.location.hash = "#/login";
    window.location.reload();
  }
}

/**
 * Parseo común de la respuesta: asume JSON, mapea no-OK al `mensaje` del
 * ResponseDTO del backend y desloguea ante un 401 en endpoint privado.
 */
async function handleResponse(res, path) {
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized(path);
    const message =
      data?.mensaje ||
      data?.message ||
      `Error ${res.status}: ${res.statusText || "Solicitud fallida"}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Wrapper fino sobre fetch:
 * - Prefija API_URL.
 * - Inyecta `Authorization: Bearer <token>` si hay sesión.
 * - Asume y devuelve JSON.
 */
async function request(path, { method = "GET", body, headers } = {}) {
  const session = get(SESSION_KEY);
  const token = session?.token;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  return handleResponse(res, path);
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
