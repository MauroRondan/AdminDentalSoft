import { useEffect, useState } from "react";
import { Icon } from "./icons";

/**
 * Confirmación con la UI del panel (nunca `window.confirm`: los diálogos nativos del
 * navegador rompen el diseño y no se pueden estilar). Mismo esqueleto que el resto de
 * los modales del ADM.
 *
 * Props: open, titulo, mensaje, textoOk, danger, onConfirm, onClose, saving
 */
export default function ConfirmModal({
  open,
  titulo = "¿Confirmás?",
  mensaje,
  textoOk = "Aceptar",
  danger = false,
  onConfirm,
  onClose,
  saving = false,
}) {
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (open) setRender(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  if (!render) return null;

  const handleAnimationEnd = (e) => {
    if (e.target === e.currentTarget && !open) setRender(false);
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={() => !saving && onClose?.()}
      onAnimationEnd={handleAnimationEnd}
      /* Por encima del modal que lo abrió: si no, queda detrás y parece que no pasó nada. */
      style={{ zIndex: 1200 }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">{titulo}</h2>
          </div>
          <button
            type="button"
            className="appt-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <p style={{ margin: 0, whiteSpace: "pre-line", color: "var(--color-text-secondary)" }}>
            {mensaje}
          </p>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="appt-modal__save"
            onClick={onConfirm}
            disabled={saving}
            style={danger ? { background: "var(--color-error)" } : undefined}
          >
            {saving ? "Procesando…" : textoOk}
          </button>
        </footer>
      </div>
    </div>
  );
}
