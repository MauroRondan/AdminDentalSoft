import { SESSION_KEY, NIVEL_SUPERADMIN } from "../config/constants";
import { save, remove } from "../utils/storage";
import { api } from "./apiClient";

/**
 * Login contra POST /usuario/validar (el mismo endpoint del ERP).
 * El backend devuelve JwtResponse: { token, nombre, nivel, mail, ... }.
 *
 * Este panel SOLO admite superadmins del SaaS (usunivel = 'SA'). Si la cuenta
 * tiene otro nivel (administrador de clínica, doctor, etc.), rechazamos el
 * acceso aunque las credenciales sean válidas.
 */
export async function login({ email, password }) {
  const data = await api.post("/usuario/validar", {
    usermail: email,
    password,
  });

  if (!data?.token) {
    throw new Error("Respuesta inválida del servidor");
  }

  if (String(data.nivel) !== NIVEL_SUPERADMIN) {
    throw new Error(
      "Esta cuenta no tiene acceso al panel de administración de DentalSoft.",
    );
  }

  save(SESSION_KEY, data);
  return data;
}

export function logout() {
  remove(SESSION_KEY);
}
