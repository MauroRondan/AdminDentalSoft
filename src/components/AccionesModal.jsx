import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Modal de acciones de una fila: se abre al hacer click en el `<tr>` completo.
 * Muestra el título del ítem y la lista de acciones; cada acción cierra el
 * modal y ejecuta su callback. Reemplaza al menú de "3 puntitos" (RowMenu),
 * igual que en FrontDentalSoft.
 *
 * Mientras corre la animación de cierre las props ya vienen vacías (la página
 * limpia su estado), por eso se conserva un snapshot del último contenido.
 */
export default function AccionesModal({ open, onClose, titulo, subtitulo, items = [] }) {
  const [render, setRender] = useState(open);
  const snap = useRef({ titulo, subtitulo, items });

  if (open) snap.current = { titulo, subtitulo, items };

  useEffect(() => {
    if (!open) return;
    setRender(true);
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

  const { titulo: tit, subtitulo: sub, items: acciones } = snap.current;

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className="modal-card acciones-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">{tit || "Acciones"}</h2>
            {sub && <p className="appt-modal__subtitle">{sub}</p>}
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="acciones-modal__list">
          {acciones.map((it, i) => (
            <button
              key={i}
              type="button"
              className={`acciones-modal__item${it.danger ? " acciones-modal__item--danger" : ""}`}
              onClick={() => {
                onClose();
                it.onClick?.();
              }}
            >
              <span className="acciones-modal__ico">
                <Icon name={it.icon} size={18} />
              </span>
              <span className="acciones-modal__label">{it.label}</span>
              <Icon name="arrowRight" size={16} className="acciones-modal__arrow" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
