import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import { getLimitesLicencia, setLimitesLicencia } from "../services/licenciaService";

/**
 * Override de cupos de una licencia puntual (Sprint 42). Muestra, por recurso,
 * el cupo del plan, el uso actual y un campo para fijar un cupo a medida
 * (vacío = usar el del plan). Reemplaza los overrides al guardar.
 */
export default function LicenciaLimitesModal({ open, onClose, licencia = null, onChanged }) {
  const [data, setData] = useState(null); // { recursos, planLimites, overrides, uso }
  const [overrides, setOverrides] = useState({}); // recurso -> string
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open || !licencia) return;
    setRender(true);
    setData(null);
    setOverrides({});
    setLoading(true);
    getLimitesLicencia(licencia.licid)
      .then((res) => {
        setData(res);
        const ov = {};
        Object.entries(res?.overrides ?? {}).forEach(([k, v]) => {
          ov[k] = v == null ? "" : String(v);
        });
        setOverrides(ov);
      })
      .catch((err) => toast.error(err.message || "No se pudieron cargar los cupos"))
      .finally(() => setLoading(false));
  }, [open, licencia]);

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

  const usoDe = (recurso) =>
    (data?.uso ?? []).find((u) => u.recurso === recurso) || {};

  const planDe = (recurso) => {
    const v = data?.planLimites?.[recurso];
    return v == null ? null : v;
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const payload = {};
    (data?.recursos ?? []).forEach((r) => {
      const v = overrides[r.recurso];
      if (v !== "" && v != null && !Number.isNaN(Number(v))) {
        payload[r.recurso] = Math.max(0, Math.trunc(Number(v)));
      }
    });
    try {
      await setLimitesLicencia(licencia.licid, payload);
      toast.success("Cupos de la clínica actualizados");
      onChanged?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

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
            <h2 className="appt-modal__title">Cupos de la licencia</h2>
            <p className="appt-modal__subtitle">
              {licencia?.licnom || "Licencia"} · cupos a medida (vacío = usar el del plan)
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          {loading ? (
            <p className="field__hint">Cargando cupos…</p>
          ) : (data?.recursos ?? []).length === 0 ? (
            <p className="field__hint">No se pudo cargar el catálogo de recursos.</p>
          ) : (
            <div className="limite-list">
              {data.recursos.map((r) => {
                const uso = usoDe(r.recurso);
                const plan = planDe(r.recurso);
                const efectivo = uso.limite == null ? "∞" : uso.limite;
                return (
                  <div className="limite-row" key={r.recurso}>
                    <div className="limite-row__info">
                      <span className="limite-row__name">
                        {r.etiqueta}
                        {!r.enforced && <span className="field__hint-inline"> · informativo</span>}
                      </span>
                      <span className="limite-row__meta">
                        Plan: {plan == null ? "∞" : plan} · Usa {uso.usado ?? 0} ·
                        Efectivo: {efectivo}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="field__input limite-row__input"
                      placeholder={plan == null ? "∞" : `Plan: ${plan}`}
                      value={overrides[r.recurso] ?? ""}
                      onChange={(e) =>
                        setOverrides((prev) => ({ ...prev, [r.recurso]: e.target.value }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={save} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar cupos"}
          </button>
        </footer>
      </div>
    </div>
  );
}
