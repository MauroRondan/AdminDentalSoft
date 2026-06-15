import { api } from "./apiClient";

/**
 * POST /admin/usuario/revelar-pass — función oculta del panel SA (atajo F6):
 * descifra y devuelve la contraseña de los usuarios con ese email. Es solo de
 * lectura/recuperación; no modifica nada.
 *
 * Devuelve un array porque el mismo email puede existir en varias clínicas
 * (multi-tenant): cada item trae el contexto de la clínica para desambiguar.
 * item: { usuid, usunom, usumail, usunivel, licencia, licnom, usuest, password, descifrada }
 */
export function revelarPass(usumail) {
  return api.post("/admin/usuario/revelar-pass", { usumail });
}
