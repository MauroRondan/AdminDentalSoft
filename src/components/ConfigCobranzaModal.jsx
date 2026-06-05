import { useEffect, useState } from "react";
import { Icon } from "./icons";

/** Edita la config global de cobranza: día de cobro + días de gracia. */
export default function ConfigCobranzaModal({ open, onClose, onSave, config = null, saving = false }) {
  const [diacobro, setDiacobro] = useState(1);
  const [graciadias, setGraciadias] = useState(5);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setDiacobro(config?.fcgdiacobro ?? 1);
    setGraciadias(config?.fcggraciadias ?? 5);
  }, [open, config]);

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

  const submit = () => {
    const d = Math.max(1, Math.min(28, Number(diacobro) || 1));
    const g = Math.max(0, Math.min(60, Number(graciadias) || 0));
    onSave({ diacobro: d, graciadias: g });
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
            <h2 className="appt-modal__title">Configuración de cobranza</h2>
            <p className="appt-modal__subtitle">Aplica a todas las clínicas</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field">
              <span className="field__label">Día de cobro (1–28)</span>
              <input
                type="number"
                min="1"
                max="28"
                className="field__input"
                value={diacobro}
                onChange={(e) => setDiacobro(e.target.value)}
              />
              <span className="field__hint">Día del mes en que vence la cuota.</span>
            </label>
            <label className="field">
              <span className="field__label">Días de gracia</span>
              <input
                type="number"
                min="0"
                max="60"
                className="field__input"
                value={graciadias}
                onChange={(e) => setGraciadias(e.target.value)}
              />
              <span className="field__hint">Tras el vencimiento, antes de bloquear.</span>
            </label>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
