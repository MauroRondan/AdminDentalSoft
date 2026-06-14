import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import { SESSION_KEY } from "../../config/constants";
import { get } from "../../utils/storage";
import { getDashboard } from "../../services/dashboardService";

const firstName = (fullName = "") => fullName.trim().split(/\s+/)[0] || "";

const fmtGs = (n) =>
  `Gs. ${Number(n ?? 0).toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;

// Formato compacto para etiquetas de gráficos (1.5M / 250k / 800).
const fmtCompact = (n) => {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const labelMes = (periodo = "") => {
  const [y, m] = periodo.split("-");
  const i = Number(m) - 1;
  return `${MESES[i] || m} ${String(y).slice(2)}`;
};

const card = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow-soft)",
  padding: "1.25rem",
};

export default function DashboardPage() {
  const session = get(SESSION_KEY);
  const [d, setD] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDashboard();
      setD(data);
      setError(false);
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar las métricas");
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const v = (x) => (d ? x : "…");

  const kpis = [
    {
      icon: "building",
      value: v(d?.licenciasActivas),
      label: "Licencias activas",
      hint: d ? `${d.licenciasSuspendidas} suspendidas · ${d.licenciasSinPlan} sin plan` : null,
    },
    {
      icon: "wallet",
      value: d ? fmtGs(d.mrr) : "…",
      label: "Ingreso mensual estimado",
      hint: "Planes + add-ons de licencias activas",
    },
    {
      icon: "check",
      value: d ? fmtGs(d.cobradoMes) : "…",
      label: "Cobrado este mes",
      hint: d ? `${d.cobrosMes} factura(s) pagada(s)` : null,
    },
    {
      icon: "tag",
      value: d ? fmtGs(d.facturacionPendiente) : "…",
      label: "Pendiente de cobro",
      hint: d ? `${d.facturasPendientes} factura(s) pendiente(s)` : null,
    },
    {
      icon: "alertCircle",
      value: d ? fmtGs(d.facturacionVencida) : "…",
      label: "Vencido (mora)",
      hint: d ? `${d.facturasVencidas} factura(s) vencida(s)` : null,
      danger: d && d.facturasVencidas > 0,
    },
    {
      icon: "sparkles",
      value: v(d?.trialesActivos),
      label: "Pruebas activas",
      hint: d ? `${d.trialesPorVencer} por vencer (≤3d) · ${d.trialesVencidos} vencidas` : null,
      danger: d && d.trialesVencidos > 0,
    },
    {
      icon: "package",
      value: d ? `${d.planesActivos} / ${d.modulosActivos} / ${d.addonsActivos}` : "…",
      label: "Planes / Módulos / Add-ons",
      hint: "Catálogo del SaaS",
    },
  ];

  const ingresos = d?.ingresosPorMes ?? [];
  const maxIngreso = Math.max(1, ...ingresos.map((s) => Number(s.monto || 0)));
  const dist = d?.licenciasPorPlan ?? [];
  const maxCant = Math.max(1, ...dist.map((x) => Number(x.cantidad || 0)));

  return (
    <div className="page">
      <section className="welcome-card">
        <h1 className="welcome-card__title">
          Hola{session?.nombre ? `, ${firstName(session.nombre)}` : ""} 👋
        </h1>
        <p className="welcome-card__text">
          Panel de administración de DentalSoft. Acá ves el estado de tus{" "}
          <strong>licencias</strong>, el <strong>ingreso recurrente</strong> y la{" "}
          <strong>cobranza</strong> del SaaS de un vistazo.
        </p>
      </section>

      <div className="stat-grid">
        {kpis.map((k) => (
          <div className="stat-card" key={k.label}>
            <span
              className="stat-card__icon"
              style={
                k.danger
                  ? { background: "color-mix(in srgb, var(--color-error) 14%, transparent)", color: "var(--color-error)" }
                  : undefined
              }
            >
              <Icon name={k.icon} size={22} />
            </span>
            <div>
              <div
                className="stat-card__value"
                style={k.danger ? { color: "var(--color-error)" } : undefined}
              >
                {k.value}
              </div>
              <div className="stat-card__label">{k.label}</div>
              {k.hint && (
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                  {k.hint}
                </div>
              )}
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
        {/* Ingresos cobrados por mes */}
        <div style={card}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Ingresos cobrados por mes</h2>
          {ingresos.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              {error ? "Sin datos." : "Todavía no hay facturas pagadas."}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 170 }}>
              {ingresos.map((s) => (
                <div
                  key={s.periodo}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                >
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {fmtCompact(s.monto)}
                  </span>
                  <div
                    title={fmtGs(s.monto)}
                    style={{
                      width: "100%",
                      maxWidth: 46,
                      height: `${(Number(s.monto || 0) / maxIngreso) * 120}px`,
                      minHeight: 4,
                      background: "var(--color-primary)",
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                    {labelMes(s.periodo)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Licencias por plan */}
        <div style={card}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>Licencias activas por plan</h2>
          {dist.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              {error ? "Sin datos." : "Todavía no hay licencias activas con plan."}
            </p>
          ) : (
            <div>
              {dist.map((x) => (
                <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      width: 110,
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={x.label}
                  >
                    {x.label}
                  </span>
                  <div style={{ flex: 1, height: 18, background: "var(--color-border)", borderRadius: 6, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(Number(x.cantidad || 0) / maxCant) * 100}%`,
                        height: "100%",
                        background: "var(--color-primary)",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <span style={{ width: 28, textAlign: "right", fontWeight: 700 }}>{x.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
