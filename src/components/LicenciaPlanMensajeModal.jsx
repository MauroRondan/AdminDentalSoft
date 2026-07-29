import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import { formatMoney } from "../utils/format";
import { listPlanesMensaje, getPlanMensajeLicencia, setPlanMensajeLicencia } from "../services/planMensajeService";

/**
 * Asigna un PLAN DE MENSAJES de WhatsApp a una licencia (o lo quita). Mismo patrón
 * que LicenciaPlanModal, con una regla extra: si el plan del SaaS de la licencia no
 * incluye el módulo WhatsApp/Bot, no se puede asignar (el backend también lo valida).
 */
export default function LicenciaPlanMensajeModal({ open, onClose, licencia = null, onSaved }) {
  const [planes, setPlanes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [elegible, setElegible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [render, setRender] = useState(open);

  const licid = licencia?.licid;

  useEffect(() => {
    if (!open || !licid) return;
    setRender(true);
    setLoading(true);
    Promise.all([listPlanesMensaje(), getPlanMensajeLicencia(licid)])
      .then(([cat, mio]) => {
        setPlanes(cat ?? []);
        setSelected(mio?.actual?.pmsid ?? null);
        setElegible(Boolean(mio?.elegible));
      })
      .catch((err) => toast.error(err.message || "No se pudo cargar el plan de mensajes"))
      .finally(() => setLoading(false));
  }, [open, licid]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!render) return null;

  const handleAnimationEnd = (e) => {
    if (e.target === e.currentTarget && !open) setRender(false);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await setPlanMensajeLicencia(licid, selected);
      toast.success(selected ? "Plan de mensajes asignado" : "Plan de mensajes quitado");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const fmtCupo = (n) => Number(n ?? 0).toLocaleString("es-PY");

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className="modal-card modal-card--md"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">Plan de mensajes · WhatsApp</h2>
            <p className="appt-modal__subtitle">{licencia?.licnom || "Licencia"}</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          {!elegible && !loading && (
            <p
              style={{
                margin: "0 0 0.9rem",
                padding: "0.65rem 0.8rem",
                borderRadius: "0.6rem",
                fontSize: "0.85rem",
                background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                color: "var(--color-error)",
              }}
            >
              El plan de esta licencia <strong>no incluye el módulo WhatsApp/Bot</strong>.
              Asignale un plan con bot habilitado (o el add-on WhatsApp) antes de venderle mensajes.
            </p>
          )}

          {loading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Cargando…</p>
          ) : (
            <div className="module-picker">
              <button
                type="button"
                className={`module-option${selected == null ? " module-option--selected" : ""}`}
                onClick={() => setSelected(null)}
              >
                <span className="module-option__check">
                  {selected == null && <Icon name="check" size={14} />}
                </span>
                <span className="module-option__info">
                  <span className="module-option__name">Sin plan de mensajes</span>
                  <span className="module-option__meta">La clínica queda sin cupo de mensajería</span>
                </span>
              </button>

              {planes.map((p) => {
                const checked = selected === p.pmsid;
                return (
                  <button
                    type="button"
                    key={p.pmsid}
                    className={`module-option${checked ? " module-option--selected" : ""}`}
                    onClick={() => elegible && setSelected(p.pmsid)}
                    disabled={!elegible}
                    style={!elegible ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    <span className="module-option__check">
                      {checked && <Icon name="check" size={14} />}
                    </span>
                    <span className="module-option__info">
                      <span className="module-option__name">{p.nombre}</span>
                      <span className="module-option__meta">
                        {fmtCupo(p.cupo)} conversaciones · {fmtCupo(p.cupo)} recordatorios ·{" "}
                        {fmtCupo(p.cupo)} iniciás vos — Meta {formatMoney(p.costo)} · ganás{" "}
                        {formatMoney(p.ganancia)}
                      </span>
                    </span>
                    <span className="module-option__price">{formatMoney(p.precio)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="appt-modal__save"
            onClick={guardar}
            disabled={saving || loading || (!elegible && selected != null)}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
