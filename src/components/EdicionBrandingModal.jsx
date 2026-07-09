import { useEffect, useState } from "react";
import { Icon } from "./icons";

const EMPTY = { marca: "", dominio: "", color: "", logo: "" };

/**
 * Edita el branding de una edición: marca (nombre visible), dominio del front (para pintar
 * el login por URL), color de tema y logo (URL). Sprint 47b.
 */
export default function EdicionBrandingModal({ open, onClose, onSave, edicion = null, saving = false }) {
  const [form, setForm] = useState(EMPTY);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setForm(
      edicion
        ? {
            marca: edicion.edimarca ?? "",
            dominio: edicion.edidominio ?? "",
            color: edicion.edicolor ?? "",
            logo: edicion.edilogo ?? "",
          }
        : EMPTY,
    );
  }, [open, edicion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!render) return null;

  const handleAnimationEnd = (e) => { if (e.target === e.currentTarget && !open) setRender(false); };
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    onSave({
      marca: form.marca.trim() || null,
      dominio: form.dominio.trim() || null,
      color: form.color.trim() || null,
      logo: form.logo.trim() || null,
    });
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="modal-card modal-card--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">Marca de la edición</h2>
            <p className="appt-modal__subtitle">
              {edicion ? `${edicion.edinom} (${edicion.edicodigo})` : ""}
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Nombre de marca</span>
              <input
                type="text"
                className="field__input"
                placeholder="Ej. clinica_app"
                value={form.marca}
                onChange={(e) => update("marca", e.target.value)}
                autoFocus
              />
              <span className="field__hint">Lo que ve el usuario en el header/login de esa edición.</span>
            </label>

            <label className="field field--full">
              <span className="field__label">Dominio del front</span>
              <input
                type="text"
                className="field__input"
                placeholder="Ej. app.clinica-app.com.py"
                value={form.dominio}
                onChange={(e) => update("dominio", e.target.value)}
              />
              <span className="field__hint">
                Al entrar por esta URL, el login se pinta con esta marca. Solo el host (sin https://).
              </span>
            </label>

            <label className="field">
              <span className="field__label">Color de tema</span>
              <input
                type="text"
                className="field__input"
                placeholder="#0aa6b7"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Logo (URL)</span>
              <input
                type="text"
                className="field__input"
                placeholder="https://…/logo.png"
                value={form.logo}
                onChange={(e) => update("logo", e.target.value)}
              />
            </label>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar marca"}
          </button>
        </footer>
      </div>
    </div>
  );
}
