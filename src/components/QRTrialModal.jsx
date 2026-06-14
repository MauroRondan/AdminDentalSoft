import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Icon } from "./icons";
import { TRIAL_SIGNUP_URL, APP_NAME } from "../config/constants";

/**
 * Muestra el QR del enlace público de la prueba gratis para descargar y poner en
 * las publicidades (trípticos, redes). El QR apunta a TRIAL_SIGNUP_URL.
 */
export default function QRTrialModal({ open, onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    QRCode.toDataURL(TRIAL_SIGNUP_URL, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch(() => toast.error("No se pudo generar el QR"));
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

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(TRIAL_SIGNUP_URL);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="modal-card modal-card--sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">QR de prueba gratis</h2>
            <p className="appt-modal__subtitle">Para tus trípticos, redes y publicidades</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body" style={{ textAlign: "center" }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR de la prueba gratis"
              style={{ width: 240, height: 240, maxWidth: "100%", borderRadius: 12, border: "1px solid var(--color-border)" }}
            />
          ) : (
            <p style={{ color: "var(--color-text-secondary)" }}>Generando QR…</p>
          )}
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--color-text-secondary)", wordBreak: "break-all" }}>
            {TRIAL_SIGNUP_URL}
          </p>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={copiar}>
            <Icon name="tag" size={16} /> Copiar enlace
          </button>
          {dataUrl && (
            <a className="appt-modal__save" href={dataUrl} download={`${APP_NAME}-prueba-gratis-qr.png`}>
              Descargar PNG
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
