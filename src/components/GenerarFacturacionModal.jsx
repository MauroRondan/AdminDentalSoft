import { useEffect, useState } from "react";
import { Icon } from "./icons";

const mesActual = () => new Date().toISOString().slice(0, 7); // YYYY-MM

/** Genera la facturación de un período para todas las licencias activas. */
export default function GenerarFacturacionModal({ open, onClose, onSave, saving = false }) {
  const [periodo, setPeriodo] = useState(mesActual());
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setPeriodo(mesActual());
  }, [open]);

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
        className="modal-card modal-card--sm"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">Generar facturación</h2>
            <p className="appt-modal__subtitle">Crea la cuota del período para todas las clínicas activas</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Período (mes)</span>
              <input
                type="month"
                className="field__input"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              />
              <span className="field__hint">
                Es idempotente: si una clínica ya tiene la cuota de este período, no se duplica.
              </span>
            </label>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="appt-modal__save"
            onClick={() => onSave(periodo)}
            disabled={saving}
          >
            {saving ? "Generando…" : "Generar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
