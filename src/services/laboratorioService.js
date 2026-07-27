import { api } from "./apiClient";

/**
 * Laboratorios de DentaLab, para el menú "Laboratorios" del ADM: quiénes se
 * registraron y quiénes usan el sistema de verdad.
 *
 * Cada item: { id, nombre, ruc, responsable, email, telefono, ciudad, codigo,
 *   activo, creado, usuarios, clinicas, ordenes, ingreso, ultimaActividad }
 */
export function listLaboratorios() {
  return api.get("/admin/laboratorio");
}
