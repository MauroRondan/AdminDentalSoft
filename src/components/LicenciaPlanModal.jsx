import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { formatMoney } from "../utils/format";

/**
 * Asigna un plan a una licencia (o lo quita). `planes` = planes activos disponibles.
 * `licencia` = la licencia en edición (usa su planid actual como selección inicial).
 */
export default function LicenciaPlanModal({
  open,
  onClose,
  onSave,
  licencia = null,
  planes = [],
  saving = false,
}) {
  const [selected, setSelected] = useState(null);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setSelected(licencia?.planid ?? null);
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
            <h2 className="appt-modal__title">Asignar plan</h2>
            <p className="appt-modal__subtitle">{licencia?.licnom || "Licencia"}</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
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
                <span className="module-option__name">Sin plan</span>
                <span className="module-option__meta">La clínica queda sin plan asignado</span>
              </span>
            </button>

            {planes.map((p) => {
              const checked = selected === p.plnid;
              return (
                <button
                  type="button"
                  key={p.plnid}
                  className={`module-option${checked ? " module-option--selected" : ""}`}
                  onClick={() => setSelected(p.plnid)}
                >
                  <span className="module-option__check">
                    {checked && <Icon name="check" size={14} />}
                  </span>
                  <span className="module-option__info">
                    <span className="module-option__name">{p.plnnom}</span>
                    <span className="module-option__meta">
                      {p.plncodigo} · {p.plnperiodo === "ANUAL" ? "anual" : "mensual"}
                    </span>
                  </span>
                  <span className="module-option__price">{formatMoney(p.plnprecio)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="appt-modal__save"
            onClick={() => onSave(selected)}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Asignar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
