import { useEffect, useMemo, useState } from "react";
import { Icon } from "./icons";
import { formatMoney } from "../utils/format";

const EMPTY_FORM = {
  plncodigo: "",
  plnnom: "",
  plndesc: "",
  plnprecio: "",
  plnperiodo: "MENSUAL",
  plnmaxterminales: "",
  plndestacado: false,
  plnest: true,
};

const isValidMoney = (s) => {
  if (s === "" || s == null) return true;
  const n = Number(s);
  return !Number.isNaN(n) && n >= 0;
};

const normalizeCodigo = (s) =>
  (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

const modIdsOf = (modulos) =>
  (modulos ?? []).map((m) => (typeof m === "object" ? m.modid : m));

/**
 * Modal para crear/editar un plan (tier). Compone el plan eligiendo qué módulos
 * incluye y a qué precio mensual. Los módulos esenciales quedan siempre incluidos.
 *
 * Props:
 *  - modulosDisponibles: módulos activos del catálogo [{modid, modnom, modcodigo, modprecio, modesencial}]
 *  - initial: plan a editar (puede traer `modulos`)
 */
export default function PlanModal({
  open,
  onClose,
  onSave,
  initial = null,
  modulosDisponibles = [],
  saving = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(() => new Set());
  const [errors, setErrors] = useState({});
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setErrors({});
    const esenciales = modulosDisponibles.filter((m) => m.modesencial).map((m) => m.modid);
    if (initial) {
      setForm({
        plncodigo: initial.plncodigo ?? "",
        plnnom: initial.plnnom ?? "",
        plndesc: initial.plndesc ?? "",
        plnprecio: initial.plnprecio ?? "",
        plnperiodo: initial.plnperiodo ?? "MENSUAL",
        plnmaxterminales: initial.plnmaxterminales ?? "",
        plndestacado: initial.plndestacado ?? false,
        plnest: initial.plnest ?? true,
      });
      setSelected(new Set([...modIdsOf(initial.modulos), ...esenciales]));
    } else {
      setForm(EMPTY_FORM);
      setSelected(new Set(esenciales));
    }
  }, [open, initial, modulosDisponibles]);

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

  // Precio de referencia: suma de los add-ons de los módulos incluidos.
  const valorModulos = useMemo(
    () =>
      modulosDisponibles
        .filter((m) => selected.has(m.modid))
        .reduce((acc, m) => acc + (Number(m.modprecio) || 0), 0),
    [modulosDisponibles, selected],
  );

  if (!render) return null;

  const handleAnimationEnd = (event) => {
    if (event.target === event.currentTarget && !open) setRender(false);
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleModulo = (modulo) => {
    if (modulo.modesencial) return; // esencial: siempre incluido
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(modulo.modid)) next.delete(modulo.modid);
      else next.add(modulo.modid);
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.plnnom.trim()) e.plnnom = "Requerido";
    if (!form.plncodigo.trim()) e.plncodigo = "Requerido";
    if (form.plnprecio === "" || !isValidMoney(form.plnprecio)) e.plnprecio = "Precio inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const numOrNull = (v) => (v === "" || v == null ? null : Number(v));

  const submit = () => {
    if (!validate()) return;
    onSave({
      plncodigo: normalizeCodigo(form.plncodigo),
      plnnom: form.plnnom.trim(),
      plndesc: form.plndesc.trim() || null,
      plnprecio: Number(form.plnprecio),
      plnperiodo: form.plnperiodo,
      plnmaxterminales: numOrNull(form.plnmaxterminales),
      plndestacado: Boolean(form.plndestacado),
      plnest: Boolean(form.plnest),
      modulos: [...selected],
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
        className="modal-card modal-card--lg"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">{isEdit ? "Editar plan" : "Nuevo plan"}</h2>
            <p className="appt-modal__subtitle">
              Definí el precio mensual y qué módulos incluye este plan
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field">
              <span className="field__label">Nombre del plan *</span>
              <input
                type="text"
                className={`field__input${errors.plnnom ? " field__input--error" : ""}`}
                placeholder="Ej. Profesional"
                value={form.plnnom}
                onChange={(e) => update("plnnom", e.target.value)}
                autoFocus
              />
              {errors.plnnom && <span className="field__error">{errors.plnnom}</span>}
            </label>

            <label className="field">
              <span className="field__label">Código *</span>
              <input
                type="text"
                className={`field__input${errors.plncodigo ? " field__input--error" : ""}`}
                placeholder="Ej. PRO"
                value={form.plncodigo}
                onChange={(e) => update("plncodigo", e.target.value)}
                onBlur={(e) => update("plncodigo", normalizeCodigo(e.target.value))}
              />
              {errors.plncodigo && <span className="field__error">{errors.plncodigo}</span>}
            </label>

            <label className="field field--full">
              <span className="field__label">Descripción</span>
              <textarea
                className="field__input"
                placeholder="Para quién es este plan y qué resuelve…"
                value={form.plndesc}
                onChange={(e) => update("plndesc", e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">Precio *</span>
              <input
                type="number"
                step="1"
                min="0"
                className={`field__input${errors.plnprecio ? " field__input--error" : ""}`}
                placeholder="Ej. 250000"
                value={form.plnprecio}
                onChange={(e) => update("plnprecio", e.target.value)}
              />
              {errors.plnprecio && <span className="field__error">{errors.plnprecio}</span>}
            </label>

            <div className="field">
              <span className="field__label">Período de facturación</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.plnperiodo === "MENSUAL" ? " chip--active" : ""}`}
                  onClick={() => update("plnperiodo", "MENSUAL")}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  className={`chip${form.plnperiodo === "ANUAL" ? " chip--active" : ""}`}
                  onClick={() => update("plnperiodo", "ANUAL")}
                >
                  Anual
                </button>
              </div>
            </div>

            <label className="field">
              <span className="field__label">Máx. de usuarios / terminales</span>
              <input
                type="number"
                step="1"
                min="0"
                className="field__input"
                placeholder="Vacío = sin límite"
                value={form.plnmaxterminales}
                onChange={(e) => update("plnmaxterminales", e.target.value)}
              />
            </label>

            <div className="field">
              <span className="field__label">¿Destacar como recomendado?</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.plndestacado ? " chip--active" : ""}`}
                  onClick={() => update("plndestacado", true)}
                >
                  Sí
                </button>
                <button
                  type="button"
                  className={`chip${!form.plndestacado ? " chip--active" : ""}`}
                  onClick={() => update("plndestacado", false)}
                >
                  No
                </button>
              </div>
            </div>

            <div className="field">
              <span className="field__label">Estado</span>
              <div className="chip-group">
                <button
                  type="button"
                  className={`chip${form.plnest ? " chip--active" : ""}`}
                  onClick={() => update("plnest", true)}
                >
                  Activo
                </button>
                <button
                  type="button"
                  className={`chip${!form.plnest ? " chip--active" : ""}`}
                  onClick={() => update("plnest", false)}
                >
                  Inactivo
                </button>
              </div>
            </div>

            <div className="field field--full">
              <span className="field__label">
                Módulos incluidos ({selected.size})
              </span>
              {modulosDisponibles.length === 0 ? (
                <p className="field__hint">
                  No hay módulos activos en el catálogo. Creá módulos primero en la
                  sección “Módulos”.
                </p>
              ) : (
                <div className="module-picker">
                  {modulosDisponibles.map((m) => {
                    const checked = selected.has(m.modid);
                    return (
                      <button
                        type="button"
                        key={m.modid}
                        className={`module-option${checked ? " module-option--selected" : ""}`}
                        onClick={() => toggleModulo(m)}
                        title={m.modesencial ? "Módulo esencial: siempre incluido" : undefined}
                      >
                        <span className="module-option__check">
                          {checked && <Icon name="check" size={14} />}
                        </span>
                        <span className="module-option__info">
                          <span className="module-option__name">{m.modnom}</span>
                          <span className="module-option__meta">
                            {m.modcodigo}
                            {m.modesencial ? " · esencial" : ""}
                          </span>
                        </span>
                        <span className="module-option__price">{formatMoney(m.modprecio)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="price-summary">
                <span className="price-summary__label">
                  Valor de los módulos por separado (referencia)
                </span>
                <span className="price-summary__value">{formatMoney(valorModulos)}</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear plan"}
          </button>
        </footer>
      </div>
    </div>
  );
}
