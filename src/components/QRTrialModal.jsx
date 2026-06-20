import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Icon } from "./icons";
import { TRIAL_SIGNUP_URL, APP_NAME } from "../config/constants";

// Slug seguro para el nombre del archivo de descarga.
const fileSlug = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Muestra el QR del enlace público de la prueba gratis para descargar y poner en
 * las publicidades (trípticos, redes). El QR apunta a TRIAL_SIGNUP_URL.
 *
 * Si recibe `origen` (un vendedor/red del catálogo), el QR lleva ?ref=<código> para
 * atribuir las pruebas que entren por él. Sin `origen`, es el QR genérico (sin atribución).
 */
export default function QRTrialModal({ open, onClose, origen = null }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [render, setRender] = useState(open);

  const ref = origen?.vorcodigo || "";
  const url = ref ? `${TRIAL_SIGNUP_URL}?ref=${encodeURIComponent(ref)}` : TRIAL_SIGNUP_URL;

  useEffect(() => {
    if (!open) return;
    setRender(true);
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: "M" })
      .then(setDataUrl)
      .catch(() => toast.error("No se pudo generar el QR"));
  }, [open, url]);

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
      await navigator.clipboard.writeText(url);
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
            <h2 className="appt-modal__title">
              {origen ? `QR · ${origen.vornombre}` : "QR de prueba gratis"}
            </h2>
            <p className="appt-modal__subtitle">
              {origen
                ? "Las pruebas que entren por este QR se atribuyen a este origen"
                : "Genérico (sin atribución de venta)"}
            </p>
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
            {url}
          </p>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={copiar}>
            <Icon name="tag" size={16} /> Copiar enlace
          </button>
          {dataUrl && (
            <a
              className="appt-modal__save"
              href={dataUrl}
              download={`${APP_NAME}-prueba-${origen ? fileSlug(origen.vornombre) : "generico"}-qr.png`}
            >
              Descargar PNG
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}
