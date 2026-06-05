import { useEffect, useState } from "react";
import { Icon } from "./icons";

const EMPTY_FORM = {
  licnom: "",
  licruc: "",
  licmail: "",
  lictel: "",
  adminNombre: "",
  adminEmail: "",
  password: "",
  planid: "",
  licterminales: "",
};

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/**
 * Alta de una clínica nueva (licencia + usuario administrador). `planes` =
 * planes activos para asignarle uno opcionalmente al crearla.
 */
export default function NuevaLicenciaModal({ open, onClose, onSave, planes = [], saving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setErrors({});
    setForm(EMPTY_FORM);
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

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.licnom.trim()) e.licnom = "Requerido";
    if (!form.licruc.trim()) e.licruc = "Requerido";
    if (!form.adminNombre.trim()) e.adminNombre = "Requerido";
    if (!form.adminEmail.trim()) e.adminEmail = "Requerido";
    else if (!isValidEmail(form.adminEmail.trim())) e.adminEmail = "Email inválido";
    if (form.licmail.trim() && !isValidEmail(form.licmail.trim())) e.licmail = "Email inválido";
    if (!form.password || form.password.length < 4) e.password = "Mínimo 4 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const submit = () => {
    if (!validate()) return;
    onSave({
      licnom: form.licnom.trim(),
      licruc: form.licruc.trim(),
      licmail: form.licmail.trim() || null,
      lictel: form.lictel.trim() || null,
      adminNombre: form.adminNombre.trim(),
      adminEmail: form.adminEmail.trim(),
      password: form.password,
      planid: form.planid === "" ? null : Number(form.planid),
      licterminales: numOrNull(form.licterminales),
    });
  };

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
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">Nueva licencia</h2>
            <p className="appt-modal__subtitle">Alta de una clínica y su usuario administrador</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <h3 className="appt-modal__section-title">Clínica</h3>
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Nombre de la clínica *</span>
              <input
                type="text"
                className={`field__input${errors.licnom ? " field__input--error" : ""}`}
                placeholder="Ej. Clínica Sonríe"
                value={form.licnom}
                onChange={(e) => update("licnom", e.target.value)}
                autoFocus
              />
              {errors.licnom && <span className="field__error">{errors.licnom}</span>}
            </label>

            <label className="field">
              <span className="field__label">RUC / CI *</span>
              <input
                type="text"
                className={`field__input${errors.licruc ? " field__input--error" : ""}`}
                placeholder="80012345-6"
                value={form.licruc}
                onChange={(e) => update("licruc", e.target.value)}
              />
              {errors.licruc && <span className="field__error">{errors.licruc}</span>}
            </label>

            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                type="tel"
                className="field__input"
                placeholder="0981 123 456"
                value={form.lictel}
                onChange={(e) => update("lictel", e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Email de la clínica</span>
              <input
                type="email"
                className={`field__input${errors.licmail ? " field__input--error" : ""}`}
                placeholder="contacto@clinica.com"
                value={form.licmail}
                onChange={(e) => update("licmail", e.target.value)}
              />
              {errors.licmail && <span className="field__error">{errors.licmail}</span>}
            </label>

            <label className="field">
              <span className="field__label">Plan</span>
              <select
                className="field__input"
                value={form.planid}
                onChange={(e) => update("planid", e.target.value)}
              >
                <option value="">— Sin plan —</option>
                {planes.map((p) => (
                  <option key={p.plnid} value={p.plnid}>
                    {p.plnnom}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Máx. usuarios / terminales</span>
              <input
                type="number"
                step="1"
                min="0"
                className="field__input"
                placeholder="Vacío = sin límite"
                value={form.licterminales}
                onChange={(e) => update("licterminales", e.target.value)}
              />
            </label>
          </div>

          <h3 className="appt-modal__section-title" style={{ marginTop: "1.25rem" }}>
            Usuario administrador
          </h3>
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Nombre y apellido *</span>
              <input
                type="text"
                className={`field__input${errors.adminNombre ? " field__input--error" : ""}`}
                placeholder="Ej. Dra. María Romero"
                value={form.adminNombre}
                onChange={(e) => update("adminNombre", e.target.value)}
              />
              {errors.adminNombre && <span className="field__error">{errors.adminNombre}</span>}
            </label>

            <label className="field">
              <span className="field__label">Email (usuario) *</span>
              <input
                type="email"
                className={`field__input${errors.adminEmail ? " field__input--error" : ""}`}
                placeholder="admin@clinica.com"
                value={form.adminEmail}
                onChange={(e) => update("adminEmail", e.target.value)}
              />
              {errors.adminEmail && <span className="field__error">{errors.adminEmail}</span>}
            </label>

            <label className="field">
              <span className="field__label">Contraseña inicial *</span>
              <input
                type="text"
                className={`field__input${errors.password ? " field__input--error" : ""}`}
                placeholder="Mínimo 4 caracteres"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              {errors.password ? (
                <span className="field__error">{errors.password}</span>
              ) : (
                <span className="field__hint">El admin podrá cambiarla luego.</span>
              )}
            </label>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Creando…" : "Crear licencia"}
          </button>
        </footer>
      </div>
    </div>
  );
}
