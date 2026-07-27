import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { formatMoney } from "../../utils/format";
import { listLaboratorios } from "../../services/laboratorioService";

// "hace 3 días", "hoy", "—" — para saber de un vistazo si el lab sigue activo.
function haceCuanto(iso) {
  if (!iso) return "—";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} d`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} m`;
  return `hace ${Math.floor(dias / 365)} a`;
}

const fmtFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// Un laboratorio "usa" el sistema si recibió al menos una orden; si no, se registró y no volvió.
const ESTADOS = [
  { key: "", label: "Todos" },
  { key: "usando", label: "Usando el sistema" },
  { key: "sin_uso", label: "Registrados sin uso" },
  { key: "inactivos", label: "Inactivos" },
];

/**
 * Menú "Laboratorios" del ADM: los que se registraron en DentaLab, con sus números
 * (usuarios, odontologías vinculadas, órdenes y facturación) para ver quién lo usa.
 */
export default function LaboratoriosPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("");

  const cargar = useCallback(() => {
    cargarLoader();
    listLaboratorios()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err.message || "No se pudieron cargar los laboratorios"))
      .finally(() => ocultarLoader());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const usa = (l) => (l.ordenes || 0) > 0;

  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return rows.filter((l) => {
      if (filtro === "usando" && !usa(l)) return false;
      if (filtro === "sin_uso" && (usa(l) || l.activo === false)) return false;
      if (filtro === "inactivos" && l.activo !== false) return false;
      if (!texto) return true;
      return `${l.nombre} ${l.ruc} ${l.email} ${l.ciudad} ${l.codigo}`.toLowerCase().includes(texto);
    });
  }, [rows, q, filtro]);

  // Resumen arriba: total, cuántos usan y cuánto facturaron todos juntos.
  const total = rows.length;
  const usando = rows.filter(usa).length;
  const ingresoTotal = rows.reduce((s, l) => s + Number(l.ingreso || 0), 0);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Laboratorios</h1>
          <p className="page__subtitle">
            Laboratorios registrados en DentaLab · {usando} de {total} usando el sistema ·{" "}
            {formatMoney(ingresoTotal)} facturado en total
          </p>
        </div>
      </header>

      <div className="page__filters">
        <div className="filter filter--search">
          <Icon name="search" size={16} className="filter__icon" />
          <input
            className="filter__input"
            placeholder="Buscar por nombre, RUC, correo o código…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="filter filter__control" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          {ESTADOS.map((e) => (
            <option key={e.key} value={e.key}>{e.label}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Laboratorio</th>
                <th>Usuarios</th>
                <th>Odontologías</th>
                <th>Órdenes</th>
                <th>Facturado</th>
                <th>Actividad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="data-table__empty">
                    {rows.length === 0
                      ? "Todavía no se registró ningún laboratorio en DentaLab."
                      : "Ningún laboratorio coincide con la búsqueda."}
                  </td>
                </tr>
              ) : (
                visibles.map((l) => (
                  <tr key={l.id}>
                    <td data-label="Laboratorio">
                      <span className="cell-name">
                        <span className="cell-name__avatar">
                          <Icon name="package" size={16} />
                        </span>
                        <span>
                          {l.nombre || "—"}
                          <small style={{ display: "block", color: "var(--color-text-tertiary)", fontWeight: 400 }}>
                            {[l.ruc ? `RUC ${l.ruc}` : null, l.ciudad, `registrado ${fmtFecha(l.creado)}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td data-label="Usuarios">{l.usuarios ?? 0}</td>
                    <td data-label="Odontologías">{l.clinicas ?? 0}</td>
                    <td data-label="Órdenes">{l.ordenes ?? 0}</td>
                    <td data-label="Facturado">{formatMoney(l.ingreso)}</td>
                    <td data-label="Actividad" title={l.ultimaActividad ? `Última orden: ${fmtFecha(l.ultimaActividad)}` : "Nunca recibió una orden"}>
                      {haceCuanto(l.ultimaActividad)}
                    </td>
                    <td data-label="Estado">
                      {l.activo === false ? (
                        <span className="badge badge--off">Inactivo</span>
                      ) : usa(l) ? (
                        <span className="badge badge--on">Usando</span>
                      ) : (
                        <span className="badge badge--accent">Sin uso</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
