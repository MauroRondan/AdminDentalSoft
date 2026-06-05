import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { formatMoney } from "../utils/format";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const METODOS = ["Transferencia", "Efectivo", "Tarjeta", "Cheque", "Otro"];

/** Registra el pago manual de una factura del SaaS. `factura` = la factura a pagar. */
export default function RegistrarPagoModal({ open, onClose, onSave, factura = null, saving = false }) {
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [fecpago, setFecpago] = useState(hoyISO());
  const [obs, setObs] = useState("");
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setMetodo(METODOS[0]);
    setFecpago(hoyISO());
    setObs("");
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
            <h2 className="appt-modal__title">Registrar pago</h2>
            <p className="appt-modal__subtitle">
              {factura ? `${factura.licnom || "Clínica"} · ${factura.flcperiodo}` : ""}
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          {factura && (
            <div className="price-summary" style={{ marginTop: 0, marginBottom: "1rem" }}>
              <span className="price-summary__label">Monto a cobrar</span>
              <span className="price-summary__value">{formatMoney(factura.flcmonto)}</span>
            </div>
          )}
          <div className="field-grid">
            <label className="field">
              <span className="field__label">Método</span>
              <select className="field__input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Fecha de pago</span>
              <input
                type="date"
                className="field__input"
                value={fecpago}
                onChange={(e) => setFecpago(e.target.value)}
              />
            </label>
            <label className="field field--full">
              <span className="field__label">Observación</span>
              <textarea
                className="field__input"
                placeholder="Nº de comprobante, banco, etc. (opcional)"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
              />
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
            onClick={() => onSave({ metodo, fecpago, obs: obs.trim() || null })}
            disabled={saving}
          >
            {saving ? "Guardando…" : "Confirmar pago"}
          </button>
        </footer>
      </div>
    </div>
  );
}
