import { useEffect, useState } from "react";
import { Icon } from "./icons";

const EMPTY_FORM = {
  vornombre: "",
  vorcanal: "VENDEDOR",
  vorcodigo: "",
  vorest: true,
};

// Previsualiza el slug que viajará en el QR (?ref=). El backend lo recalcula igual.
const slugify = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function VentaOrigenModal({ open, onClose, onSave, initial = null, saving = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [render, setRender] = useState(open);
  // Si el usuario tocó el código a mano, dejamos de autogenerarlo del nombre.
  const [codigoTocado, setCodigoTocado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setErrors({});
    setCodigoTocado(Boolean(initial?.vorcodigo));
    if (initial) {
      setForm({
        vornombre: initial.vornombre ?? "",
        vorcanal: initial.vorcanal ?? "VENDEDOR",
        vorcodigo: initial.vorcodigo ?? "",
        vorest: initial.vorest ?? true,
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

  // Código autogenerado del nombre mientras no lo editen a mano.
  const codigoPreview = codigoTocado ? slugify(form.vorcodigo) : slugify(form.vornombre);

  const validate = () => {
    const e = {};
    if (!form.vornombre.trim()) e.vornombre = "Requerido";
    if (!codigoPreview) e.vorcodigo = "No se pudo generar un código";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      vornombre: form.vornombre.trim(),
      vorcanal: form.vorcanal,
      vorcodigo: codigoPreview,
      vorest: Boolean(form.vorest),
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
            <h2 className="appt-modal__title">{isEdit ? "Editar origen" : "Nuevo origen de venta"}</h2>
            <p className="appt-modal__subtitle">
              Un vendedor o una red social. Cada uno tendrá su propio QR de prueba.
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <div className="field field--full">
              <span className="field__label">Canal *</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.vorcanal === "VENDEDOR" ? " chip--active" : ""}`}
                  onClick={() => update("vorcanal", "VENDEDOR")}
                >
                  Vendedor (dpto. de ventas)
                </button>
                <button
                  type="button"
                  className={`chip${form.vorcanal === "REDES" ? " chip--active" : ""}`}
                  onClick={() => update("vorcanal", "REDES")}
                >
                  Red social
                </button>
              </div>
            </div>

            <label className="field field--full">
              <span className="field__label">Nombre *</span>
              <input
                type="text"
                className={`field__input${errors.vornombre ? " field__input--error" : ""}`}
                placeholder={form.vorcanal === "REDES" ? "Ej. Instagram" : "Ej. Juan Pérez"}
                value={form.vornombre}
                onChange={(e) => update("vornombre", e.target.value)}
                autoFocus
              />
              {errors.vornombre && <span className="field__error">{errors.vornombre}</span>}
            </label>

            <label className="field field--full">
              <span className="field__label">Código del QR</span>
              <input
                type="text"
                className={`field__input${errors.vorcodigo ? " field__input--error" : ""}`}
                placeholder="se genera del nombre"
                value={codigoPreview}
                onChange={(e) => {
                  setCodigoTocado(true);
                  update("vorcodigo", e.target.value);
                }}
                onBlur={(e) => update("vorcodigo", slugify(e.target.value))}
              />
              {errors.vorcodigo ? (
                <span className="field__error">{errors.vorcodigo}</span>
              ) : (
                <span className="field__hint">Viaja en la URL del QR (?ref=). Único entre activos.</span>
              )}
            </label>

            {isEdit && (
              <div className="field field--full">
                <span className="field__label">Estado</span>
                <div className="chip-group">
                  <button
                    type="button"
                    className={`chip${form.vorest ? " chip--active" : ""}`}
                    onClick={() => update("vorest", true)}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    className={`chip${!form.vorest ? " chip--active" : ""}`}
                    onClick={() => update("vorest", false)}
                  >
                    Inactivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear origen"}
          </button>
        </footer>
      </div>
    </div>
  );
}
