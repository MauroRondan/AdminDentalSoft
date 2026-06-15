import { useEffect, useState } from "react";
import { Icon } from "./icons";

const EMPTY = { licnom: "", licmail: "", lictel: "", licterminales: "" };

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// Las fechas llegan como ISO ("2026-06-15"); las mostramos DD/MM/AAAA.
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : String(iso);
};

/**
 * Detalle de una licencia (clínica) en dos modos:
 *  - "view": todos los datos en solo lectura (se pueden leer/copiar, no editar).
 *  - "edit": permite editar los datos de contacto/comerciales (nombre, email,
 *    teléfono, máx. terminales).
 *
 * El RUC queda fijo (los usuarios se vinculan al inquilino por `licruc`); el plan,
 * el estado y el trial se gestionan con sus acciones propias del menú. La
 * contraseña es privada: se muestra cifrada (enmascarada) y nunca es legible.
 */
export default function LicenciaDetalleModal({
  open,
  onClose,
  onSave,
  licencia = null,
  mode = "view",
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [render, setRender] = useState(open);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setErrors({});
    setForm({
      licnom: licencia?.licnom ?? "",
      licmail: licencia?.licmail ?? "",
      lictel: licencia?.lictel ?? "",
      licterminales: licencia?.licterminales ?? "",
    });
  }, [open, licencia]);

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
    if (form.licmail.trim() && !isValidEmail(form.licmail.trim())) e.licmail = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const submit = () => {
    if (!isEdit || !validate()) return;
    onSave({
      licnom: form.licnom.trim(),
      licmail: form.licmail.trim() || null,
      lictel: form.lictel.trim() || null,
      licterminales: numOrNull(form.licterminales),
    });
  };

  // Clase de los inputs que solo se editan en modo edición.
  const roClass = isEdit ? "" : " field__input--ro";
  const suspendida = licencia?.licestado === false;
  const esTrial = Boolean(licencia?.lictrialfin);

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
            <h2 className="appt-modal__title">
              {isEdit ? "Editar licencia" : "Detalle de la licencia"}
            </h2>
            <p className="appt-modal__subtitle">
              {licencia?.licnom || "Licencia"}
              {isEdit ? " · editá los datos de la clínica" : " · todos los datos (solo lectura)"}
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <h3 className="appt-modal__section-title">Clínica</h3>
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Nombre de la clínica{isEdit ? " *" : ""}</span>
              <input
                type="text"
                className={`field__input${roClass}${errors.licnom ? " field__input--error" : ""}`}
                value={form.licnom}
                onChange={(e) => update("licnom", e.target.value)}
                readOnly={!isEdit}
              />
              {errors.licnom && <span className="field__error">{errors.licnom}</span>}
            </label>

            <label className="field">
              <span className="field__label">RUC / CI</span>
              <input
                type="text"
                className="field__input field__input--ro"
                value={licencia?.licruc || "—"}
                readOnly
              />
              {isEdit && <span className="field__hint">No editable: identifica al inquilino.</span>}
            </label>

            <label className="field">
              <span className="field__label">Teléfono</span>
              <input
                type="tel"
                className={`field__input${roClass}`}
                value={form.lictel}
                onChange={(e) => update("lictel", e.target.value)}
                readOnly={!isEdit}
              />
            </label>

            <label className="field">
              <span className="field__label">Email de la clínica</span>
              <input
                type="email"
                className={`field__input${roClass}${errors.licmail ? " field__input--error" : ""}`}
                value={form.licmail}
                onChange={(e) => update("licmail", e.target.value)}
                readOnly={!isEdit}
              />
              {errors.licmail && <span className="field__error">{errors.licmail}</span>}
            </label>

            <label className="field">
              <span className="field__label">Máx. usuarios / terminales</span>
              <input
                type="number"
                step="1"
                min="0"
                className={`field__input${roClass}`}
                placeholder={isEdit ? "Vacío = sin límite" : undefined}
                value={form.licterminales}
                onChange={(e) => update("licterminales", e.target.value)}
                readOnly={!isEdit}
              />
            </label>
          </div>

          <h3 className="appt-modal__section-title" style={{ marginTop: "1.25rem" }}>
            Suscripción
          </h3>
          <div className="field-grid">
            <div className="field">
              <span className="field__label">Plan</span>
              <div className="field__static">
                {licencia?.plannombre ? (
                  <span className="badge badge--primary">{licencia.plannombre}</span>
                ) : (
                  <span className="badge badge--accent">Sin plan</span>
                )}
              </div>
            </div>

            <div className="field">
              <span className="field__label">Estado</span>
              <div className="field__static">
                <span className={`badge badge--${suspendida ? "off" : "on"}`}>
                  {suspendida ? "Suspendida" : "Activa"}
                </span>
                {esTrial && (
                  <span className="badge badge--accent" style={{ marginLeft: 6 }}>
                    Prueba hasta {fmtDate(licencia.lictrialfin)}
                  </span>
                )}
              </div>
            </div>

            <div className="field">
              <span className="field__label">Origen del alta</span>
              <div className="field__static">
                {licencia?.licorigen === "QR" ? "Auto-registro (QR)" : "Alta manual"}
              </div>
            </div>

            <div className="field">
              <span className="field__label">Fecha de ingreso</span>
              <div className="field__static">{fmtDate(licencia?.licfecing)}</div>
            </div>

            <div className="field">
              <span className="field__label">Usuarios</span>
              <div className="field__static">{licencia?.usuarios ?? 0}</div>
            </div>

            <div className="field">
              <span className="field__label">Add-ons activos</span>
              <div className="field__static">{licencia?.addonsActivos ?? 0}</div>
            </div>
          </div>

          <h3 className="appt-modal__section-title" style={{ marginTop: "1.25rem" }}>
            Seguridad
          </h3>
          <div className="field-grid">
            <label className="field field--full">
              <span
                className="field__label"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <Icon name="lock" size={13} /> Contraseña
              </span>
              <div className="field__locked">
                <input
                  type="password"
                  className="field__input field__input--ro"
                  value="privada-cifrada"
                  readOnly
                  disabled
                  aria-label="Contraseña privada y cifrada"
                />
                <Icon name="lock" size={16} className="field__locked-icon" />
              </div>
              <span className="field__hint">
                Privada y cifrada — no se muestra por seguridad.
              </span>
            </label>
          </div>
        </div>

        <footer className="appt-modal__footer">
          {isEdit ? (
            <>
              <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </>
          ) : (
            <button type="button" className="appt-modal__save" onClick={onClose}>
              Cerrar
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
