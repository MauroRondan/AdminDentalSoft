import { useEffect, useState } from "react";
import { Icon } from "./icons";

/** Edita la config global de cobranza: día de cobro + días de gracia. */
export default function ConfigCobranzaModal({ open, onClose, onSave, config = null, saving = false }) {
  const [diacobro, setDiacobro] = useState(1);
  const [graciadias, setGraciadias] = useState(5);
  const [trialDias, setTrialDias] = useState(30);
  const [ventasWhatsapp, setVentasWhatsapp] = useState("");
  const [ventasWhatsapp2, setVentasWhatsapp2] = useState("");
  const [ventasEmail, setVentasEmail] = useState("");
  const [ventasTel, setVentasTel] = useState("");
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setDiacobro(config?.fcgdiacobro ?? 1);
    setGraciadias(config?.fcggraciadias ?? 5);
    setTrialDias(config?.fcgtrialdias ?? 30);
    setVentasWhatsapp(config?.fcgventaswhatsapp ?? "");
    setVentasWhatsapp2(config?.fcgventaswhatsapp2 ?? "");
    setVentasEmail(config?.fcgventasemail ?? "");
    setVentasTel(config?.fcgventastel ?? "");
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
    const t = Math.max(1, Math.min(365, Number(trialDias) || 30));
    onSave({
      diacobro: d,
      graciadias: g,
      trialDias: t,
      ventasWhatsapp: ventasWhatsapp.trim() || null,
      ventasWhatsapp2: ventasWhatsapp2.trim() || null,
      ventasEmail: ventasEmail.trim() || null,
      ventasTel: ventasTel.trim() || null,
    });
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
            <label className="field">
              <span className="field__label">Días de prueba gratis</span>
              <input
                type="number"
                min="1"
                max="365"
                className="field__input"
                value={trialDias}
                onChange={(e) => setTrialDias(e.target.value)}
              />
              <span className="field__hint">Duración del trial al registrarse por QR.</span>
            </label>
          </div>

          <h3 style={{ margin: "1.25rem 0 0.5rem", fontSize: "0.95rem" }}>Contactos de ventas</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            Se le muestran al cliente cuando su prueba vence, para que pueda suscribirse.
          </p>
          <div className="field-grid">
            <label className="field">
              <span className="field__label">WhatsApp 1</span>
              <input
                type="text"
                className="field__input"
                value={ventasWhatsapp}
                onChange={(e) => setVentasWhatsapp(e.target.value)}
                placeholder="595981123456"
              />
              <span className="field__hint">Con código de país, sin signos.</span>
            </label>
            <label className="field">
              <span className="field__label">WhatsApp 2</span>
              <input
                type="text"
                className="field__input"
                value={ventasWhatsapp2}
                onChange={(e) => setVentasWhatsapp2(e.target.value)}
                placeholder="595982456789"
              />
              <span className="field__hint">Opcional, segundo vendedor.</span>
            </label>
            <label className="field">
              <span className="field__label">Email de ventas</span>
              <input
                type="email"
                className="field__input"
                value={ventasEmail}
                onChange={(e) => setVentasEmail(e.target.value)}
                placeholder="ventas@dentalsoft.com.py"
              />
            </label>
            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                type="text"
                className="field__input"
                value={ventasTel}
                onChange={(e) => setVentasTel(e.target.value)}
                placeholder="021 555 0100"
              />
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
