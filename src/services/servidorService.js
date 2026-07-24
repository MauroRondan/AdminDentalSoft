import { api } from "./apiClient";

/**
 * Métricas del VPS (menú Servidor): CPU, RAM, disco, bases, JVM e historial de
 * 24 h. El backend las lee del propio sistema — sin agentes externos.
 *
 * Shape: { cpu:{pct,nucleos,loadAvg}, ram:{total,usada,pct},
 *          disco:{total,usado,pct}, jvm:{heapUsado,heapMax,uptimeMs},
 *          sistema:{uptimeMs}, bases:[{nombre,bytes}],
 *          historia:[{ts,cpu,ram,disco}] }  (bytes crudos; pct 0-100)
 */
export function getServidor() {
  return api.get("/admin/servidor");
}
