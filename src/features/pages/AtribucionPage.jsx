import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { getAtribucion } from "../../services/atribucionService";

const card = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow-soft)",
  padding: "1.25rem",
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const labelMes = (periodo = "") => {
  const [y, m] = periodo.split("-");
  return `${MESES[Number(m) - 1] || m} ${String(y).slice(2)}`;
};

const pct = (parte, total) => (total > 0 ? Math.round((parte / total) * 100) : 0);

const canalNombre = (c) =>
  c === "VENDEDOR" ? "Dpto. de ventas" : c === "REDES" ? "Redes sociales" : "Directo";

export default function AtribucionPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [d, setD] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    cargarLoader();
    try {
      const data = await getAtribucion({ desde: desde || undefined, hasta: hasta || undefined });
      setD(data);
      setError(false);
    } catch (err) {
      toast.error(err.message || "No se pudo cargar el reporte de atribución");
      setError(true);
    } finally {
      ocultarLoader();
    }
  }, [desde, hasta]);

  useEffect(() => {
    load();
  }, [load]);

  const tot = d?.totales ?? { registrados: 0, activos: 0, convertidos: 0, vencidos: 0 };
  const porOrigen = d?.porOrigen ?? [];
  const porCanal = d?.porCanal ?? [];
  const serie = d?.serie ?? [];
  const maxSerie = Math.max(1, ...serie.map((s) => s.vendedor + s.redes + s.directo));

  const exportarCSV = () => {
    if (!porOrigen.length) {
      toast.error("No hay datos para exportar");
      return;
    }
    const head = ["Origen", "Canal", "Codigo", "Registrados", "En prueba", "Convertidos", "Vencidos", "Conversion %"];
    const lines = porOrigen.map((f) =>
      [
        `"${(f.nombre || "").replace(/"/g, '""')}"`,
        canalNombre(f.canal),
        f.codigo || "",
        f.registrados,
        f.activos,
        f.convertidos,
        f.vencidos,
        pct(f.convertidos, f.registrados),
      ].join(","),
    );
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atribucion-ventas${desde || hasta ? `-${desde || "inicio"}_${hasta || "hoy"}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const kpis = [
    { icon: "sparkles", value: tot.registrados, label: "Pruebas registradas", hint: "Por QR en el período" },
    {
      icon: "check",
      value: tot.convertidos,
      label: "Convertidas a pago",
      hint: `${pct(tot.convertidos, tot.registrados)}% de conversión`,
    },
    { icon: "building", value: tot.activos, label: "En prueba (vigentes)", hint: "Aún sin convertir" },
    { icon: "alertCircle", value: tot.vencidos, label: "Vencidas sin convertir", hint: "Prueba expirada" },
  ];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Atribución de ventas</h1>
          <p className="page__subtitle">
            Por dónde entran las pruebas (vendedores vs. redes) y cuántas convierten
          </p>
        </div>
        <div className="page__head-actions">
          <button className="page__ghost" onClick={exportarCSV}>
            <Icon name="copy" size={18} /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="page__filters">
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Desde</span>
          <input
            type="date"
            className="filter filter__control"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
          />
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Hasta</span>
          <input
            type="date"
            className="filter filter__control"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
          />
        </label>
        {(desde || hasta) && (
          <button
            className="page__ghost"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="stat-grid">
        {kpis.map((k) => (
          <div className="stat-card" key={k.label}>
            <span className="stat-card__icon">
              <Icon name={k.icon} size={22} />
            </span>
            <div>
              <div className="stat-card__value">{d ? k.value : "…"}</div>
              <div className="stat-card__label">{k.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                {k.hint}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {/* Resumen por canal */}
        <div style={card}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Pruebas por canal</h2>
          {porCanal.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              {error ? "Sin datos." : "Todavía no entraron pruebas por QR."}
            </p>
          ) : (
            <div>
              {porCanal.map((c) => (
                <div key={c.canal} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 120, fontSize: 13 }}>{canalNombre(c.canal)}</span>
                  <div style={{ flex: 1, height: 18, background: "var(--color-border)", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct(c.registrados, tot.registrados)}%`,
                        height: "100%",
                        background: c.canal === "REDES" ? "var(--color-accent, #a855f7)" : "var(--color-primary)",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <span style={{ width: 92, textAlign: "right", fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {c.registrados} reg · {c.convertidos} conv
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Serie mensual (registros por canal) */}
        <div style={card}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Registros por mes</h2>
          {serie.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              {error ? "Sin datos." : "Sin registros en el período."}
            </p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 150 }}>
                {serie.map((s) => {
                  const total = s.vendedor + s.redes + s.directo;
                  const h = (n) => `${(n / maxSerie) * 120}px`;
                  return (
                    <div key={s.periodo} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{total}</span>
                      <div
                        title={`Vendedores ${s.vendedor} · Redes ${s.redes} · Directo ${s.directo}`}
                        style={{ width: "100%", maxWidth: 46, display: "flex", flexDirection: "column-reverse" }}
                      >
                        <div style={{ height: h(s.vendedor), minHeight: s.vendedor ? 3 : 0, background: "var(--color-primary)" }} />
                        <div style={{ height: h(s.redes), minHeight: s.redes ? 3 : 0, background: "var(--color-accent, #a855f7)" }} />
                        <div style={{ height: h(s.directo), minHeight: s.directo ? 3 : 0, background: "var(--color-border)" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{labelMes(s.periodo)}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
                <span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-primary)", borderRadius: 2, marginRight: 4 }} />Vendedores</span>
                <span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-accent, #a855f7)", borderRadius: 2, marginRight: 4 }} />Redes</span>
                <span><i style={{ display: "inline-block", width: 10, height: 10, background: "var(--color-border)", borderRadius: 2, marginRight: 4 }} />Directo</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detalle por origen */}
      <div className="table-card" style={{ marginTop: "1rem" }}>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Origen</th>
                <th>Canal</th>
                <th style={{ textAlign: "right" }}>Registradas</th>
                <th style={{ textAlign: "right" }}>En prueba</th>
                <th style={{ textAlign: "right" }}>Convertidas</th>
                <th style={{ textAlign: "right" }}>Conversión</th>
                <th style={{ textAlign: "right" }}>Vencidas</th>
              </tr>
            </thead>
            <tbody>
              {porOrigen.length === 0 ? (
                <tr>
                  <td colSpan={7} className="data-table__empty">
                    {error ? "Sin datos." : "Todavía no hay pruebas atribuidas. Generá QR por vendedor/red desde Orígenes de venta."}
                  </td>
                </tr>
              ) : (
                porOrigen.map((f, i) => (
                  <tr key={f.codigo || `directo-${i}`}>
                    <td data-label="Origen">{f.nombre}</td>
                    <td data-label="Canal">
                      <span className={`badge badge--${f.canal === "REDES" ? "accent" : f.canal === "VENDEDOR" ? "primary" : "off"}`}>
                        {canalNombre(f.canal)}
                      </span>
                    </td>
                    <td data-label="Registradas" style={{ textAlign: "right", fontWeight: 700 }}>{f.registrados}</td>
                    <td data-label="En prueba" style={{ textAlign: "right" }}>{f.activos}</td>
                    <td data-label="Convertidas" style={{ textAlign: "right" }}>{f.convertidos}</td>
                    <td data-label="Conversión" style={{ textAlign: "right" }}>{pct(f.convertidos, f.registrados)}%</td>
                    <td data-label="Vencidas" style={{ textAlign: "right" }}>{f.vencidos}</td>
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
