import { useEffect, useState } from "react";
import { Icon } from "./icons";

const EMPTY_FORM = {
  modcodigo: "",
  modnom: "",
  moddesc: "",
  modprecio: "",
  modorden: "",
  modesencial: false,
  modest: true,
};

const isValidMoney = (s) => {
  if (s === "" || s == null) return true;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 0;
};

// Clave técnica en MAYÚSCULAS, sin espacios (ej. TURNOS, CAJA, REPORTES).
const normalizeCodigo = (s) =>
  (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

export default function ModuloModal({ open, onClose, onSave, initial = null, saving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setErrors({});
    if (initial) {
      setForm({
        modcodigo: initial.modcodigo ?? "",
        modnom: initial.modnom ?? "",
        moddesc: initial.moddesc ?? "",
        modprecio: initial.modprecio ?? "",
        modorden: initial.modorden ?? "",
        modesencial: initial.modesencial ?? false,
        modest: initial.modest ?? true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!render) return null;

  const handleAnimationEnd = (event) => {
    if (event.target === event.currentTarget && !open) setRender(false);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.modnom.trim()) e.modnom = "Requerido";
    if (!form.modcodigo.trim()) e.modcodigo = "Requerido";
    if (!isValidMoney(form.modprecio)) e.modprecio = "Debe ser ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const submit = () => {
    if (!validate()) return;
    onSave({
      modcodigo: normalizeCodigo(form.modcodigo),
      modnom: form.modnom.trim(),
      moddesc: form.moddesc.trim() || null,
      modprecio: numOrNull(form.modprecio) ?? 0,
      modorden: numOrNull(form.modorden),
      modesencial: Boolean(form.modesencial),
      modest: Boolean(form.modest),
    });
  };

  const isEdit = Boolean(initial);

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
        onClick={(event) => event.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">{isEdit ? "Editar módulo" : "Nuevo módulo"}</h2>
            <p className="appt-modal__subtitle">
              Funcionalidad del ERP que se incluye en planes o se vende como add-on
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field">
              <span className="field__label">Nombre *</span>
              <input
                type="text"
                className={`field__input${errors.modnom ? " field__input--error" : ""}`}
                placeholder="Ej. Turnos y agenda"
                value={form.modnom}
                onChange={(e) => update("modnom", e.target.value)}
                autoFocus
              />
              {errors.modnom && <span className="field__error">{errors.modnom}</span>}
            </label>

            <label className="field">
              <span className="field__label">Código técnico *</span>
              <input
                type="text"
                className={`field__input${errors.modcodigo ? " field__input--error" : ""}`}
                placeholder="Ej. TURNOS"
                value={form.modcodigo}
                onChange={(e) => update("modcodigo", e.target.value)}
                onBlur={(e) => update("modcodigo", normalizeCodigo(e.target.value))}
              />
              {errors.modcodigo ? (
                <span className="field__error">{errors.modcodigo}</span>
              ) : (
                <span className="field__hint">Clave que el ERP usa para habilitar la función.</span>
              )}
            </label>

            <label className="field field--full">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__input"
                placeholder="Qué incluye este módulo…"
                value={form.moddesc}
                onChange={(e) => update("moddesc", e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Precio mensual (add-on)</span>
              <input
                type="number"
                step="1"
                min="0"
                className={`field__input${errors.modprecio ? " field__input--error" : ""}`}
                placeholder="Ej. 50000"
                value={form.modprecio}
                onChange={(e) => update("modprecio", e.target.value)}
              />
              {errors.modprecio ? (
                <span className="field__error">{errors.modprecio}</span>
              ) : (
                <span className="field__hint">Precio si se contrata suelto, fuera de un plan.</span>
              )}
            </label>

            <label className="field">
              <span className="field__label">Orden</span>
              <input
                type="number"
                step="1"
                className="field__input"
                placeholder="Ej. 10"
                value={form.modorden}
                onChange={(e) => update("modorden", e.target.value)}
              />
            </label>

            <div className="field">
              <span className="field__label">¿Es esencial (core)?</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.modesencial ? " chip--active" : ""}`}
                  onClick={() => update("modesencial", true)}
                >
                  Sí, siempre incluido
                </button>
                <button
                  type="button"
                  className={`chip${!form.modesencial ? " chip--active" : ""}`}
                  onClick={() => update("modesencial", false)}
                >
                  No, opcional
                </button>
              </div>
            </div>

            <div className="field">
              <span className="field__label">Estado</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.modest ? " chip--active" : ""}`}
                  onClick={() => update("modest", true)}
                >
                  Activo
                </button>
                <button
                  type="button"
                  className={`chip${!form.modest ? " chip--active" : ""}`}
                  onClick={() => update("modest", false)}
                >
                  Inactivo
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear módulo"}
          </button>
        </footer>
      </div>
    </div>
  );
}
