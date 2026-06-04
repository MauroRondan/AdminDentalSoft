import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import { formatMoney } from "../utils/format";
import { agregarAddon, quitarAddon } from "../services/licenciaService";

const addonModIds = (lic) =>
  new Set((lic?.addons ?? []).map((a) => a.modid));

/**
 * Gestiona los add-ons (módulos extra, fuera del plan) de una licencia.
 * Cada toggle hace la llamada al backend en el momento. Al cerrar, avisa al
 * padre (onChanged) para refrescar el listado.
 */
export default function LicenciaAddonsModal({
  open,
  onClose,
  licencia = null,
  modulos = [],
  onChanged,
}) {
  const [activos, setActivos] = useState(() => new Set());
  const [busy, setBusy] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [render, setRender] = useState(open);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setDirty(false);
    setActivos(addonModIds(licencia));
  }, [open, licencia]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && handleClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const total = useMemo(
    () =>
      modulos
        .filter((m) => activos.has(m.modid))
        .reduce((acc, m) => acc + (Number(m.modprecio) || 0), 0),
    [modulos, activos],
  );

  if (!render) return null;

  const handleClose = () => {
    if (dirty) onChanged?.();
    onClose?.();
  };

  const handleAnimationEnd = (e) => {
    if (e.target === e.currentTarget && !open) setRender(false);
  };

  const toggle = async (m) => {
    if (busy) return;
    setBusy(m.modid);
    const isOn = activos.has(m.modid);
    try {
      if (isOn) {
        await quitarAddon(licencia.licid, m.modid);
        setActivos((prev) => {
          const n = new Set(prev);
          n.delete(m.modid);
          return n;
        });
        toast.success(`"${m.modnom}" quitado de los add-ons`);
      } else {
        await agregarAddon(licencia.licid, m.modid, m.modprecio);
        setActivos((prev) => new Set(prev).add(m.modid));
        toast.success(`"${m.modnom}" agregado como add-on`);
      }
      setDirty(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={handleClose}
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
            <h2 className="appt-modal__title">Add-ons de la licencia</h2>
            <p className="appt-modal__subtitle">
              {licencia?.licnom || "Licencia"} · módulos extra fuera del plan
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={handleClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          {modulos.length === 0 ? (
            <p className="field__hint">No hay módulos activos en el catálogo.</p>
          ) : (
            <div className="module-picker">
              {modulos.map((m) => {
                const on = activos.has(m.modid);
                return (
                  <button
                    type="button"
                    key={m.modid}
                    className={`module-option${on ? " module-option--selected" : ""}`}
                    onClick={() => toggle(m)}
                    disabled={busy === m.modid}
                  >
                    <span className="module-option__check">
                      {on && <Icon name="check" size={14} />}
                    </span>
                    <span className="module-option__info">
                      <span className="module-option__name">{m.modnom}</span>
                      <span className="module-option__meta">{m.modcodigo}</span>
                    </span>
                    <span className="module-option__price">{formatMoney(m.modprecio)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="price-summary">
            <span className="price-summary__label">Total mensual en add-ons</span>
            <span className="price-summary__value">{formatMoney(total)}</span>
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__save" onClick={handleClose}>
            Listo
          </button>
        </footer>
      </div>
    </div>
  );
}
