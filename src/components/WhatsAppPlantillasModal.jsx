import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import {
  listWabas,
  listPlantillasWaba,
  crearPlantillaWaba,
  eliminarPlantillaWaba,
} from "../services/whatsappService";

const BADGE = {
  APROBADA: { color: "var(--color-success, #16a34a)", label: "Aprobada" },
  PENDIENTE: { color: "var(--color-warning, #b45309)", label: "Pendiente en Meta" },
  RECHAZADA: { color: "var(--color-error)", label: "Rechazada" },
  PAUSADA: { color: "var(--color-text-secondary)", label: "Pausada" },
};

/** Cuerpo y botones del recordatorio estándar (los mismos que usa el backend). */
const RECORDATORIO = {
  nombre: "recordatorio_turno",
  cuerpo: "Hola {{1}} 👋 Te recordamos tu turno en {{2}} para el {{3}} a las {{4}} hs con el Dr/Dra {{5}}. Seleccioná una opción:",
  ejemplos: ["Jesús", "Odontos", "miércoles 29 de julio", "12:00", "Camila López"],
  botones: ["Confirmar asistencia", "Cancelar asistencia", "Reagendar turno"],
};

const contarVariables = (cuerpo) => {
  let max = 0;
  for (const m of (cuerpo || "").matchAll(/\{\{(\d+)}}/g)) max = Math.max(max, Number(m[1]));
  return max;
};

/**
 * Plantillas de mensajes — Sprint 95.
 * <p>
 * Son de la WABA, NO de cada clínica: todas las que cuelgan de la misma WABA
 * comparten `recordatorio_turno`, así que se crean UNA sola vez por WABA. Se leen
 * directo de Meta (sin espejo local), por eso el estado que se ve es el real.
 */
export default function WhatsAppPlantillasModal({ open, onClose }) {
  const [wabas, setWabas] = useState([]);
  const [wabaSel, setWabaSel] = useState("");
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [form, setForm] = useState({ nombre: "", cuerpo: "", ejemplos: [], botones: "" });
  const [guardando, setGuardando] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [render, setRender] = useState(open);

  const nVars = contarVariables(form.cuerpo);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setNueva(false);
    setPlantillas([]);
    listWabas()
      .then((w) => {
        const arr = Array.isArray(w) ? w : [];
        setWabas(arr);
        if (arr.length && !wabaSel) setWabaSel(arr[0].wabaId);
      })
      .catch((err) => toast.error(err.message || "No se pudieron cargar las WABAs"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cada vez que cambia la WABA se relee su lista real desde Meta.
  useEffect(() => {
    if (!open || !wabaSel) return;
    setLoading(true);
    listPlantillasWaba(wabaSel)
      .then((p) => setPlantillas(Array.isArray(p) ? p : []))
      .catch((err) => toast.error(err.message || "No se pudieron leer las plantillas"))
      .finally(() => setLoading(false));
  }, [open, wabaSel]);

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

  const recargar = () =>
    listPlantillasWaba(wabaSel)
      .then((p) => setPlantillas(Array.isArray(p) ? p : []))
      .catch(() => {});

  /** Precarga el formulario con el recordatorio estándar (3 botones). */
  const usarRecordatorio = () => {
    setForm({
      nombre: RECORDATORIO.nombre,
      cuerpo: RECORDATORIO.cuerpo,
      ejemplos: [...RECORDATORIO.ejemplos],
      botones: RECORDATORIO.botones.join(", "),
    });
    setNueva(true);
  };

  const crear = async () => {
    if (!wabaSel) { toast.error("Elegí la WABA"); return; }
    if (!form.nombre.trim() || !form.cuerpo.trim()) {
      toast.error("Cargá el nombre y el cuerpo");
      return;
    }
    const ejemplos = form.ejemplos.slice(0, nVars);
    if (nVars > 0 && ejemplos.filter((e) => e && e.trim()).length < nVars) {
      toast.error("Cargá un ejemplo por cada variable {{n}} (Meta los exige)");
      return;
    }
    setGuardando(true);
    try {
      const r = await crearPlantillaWaba(wabaSel, {
        nombre: form.nombre.trim(),
        categoria: "UTILITY",
        cuerpo: form.cuerpo.trim(),
        ejemplos: nVars > 0 ? ejemplos.map((e) => e.trim()) : [],
        botones: form.botones.split(",").map((b) => b.trim()).filter(Boolean),
      });
      toast.success(r?.mensaje || "Plantilla enviada a Meta");
      setNueva(false);
      setForm({ nombre: "", cuerpo: "", ejemplos: [], botones: "" });
      await recargar();
    } catch (err) {
      toast.error(err.message || "No se pudo crear la plantilla", { duration: 10000 });
    } finally {
      setGuardando(false);
    }
  };

  const borrar = (p) => {
    setConfirmar({
      titulo: "Eliminar plantilla",
      mensaje: `"${p.nombre}"\n\nSe elimina en Meta para TODAS las clínicas de esta WABA. Ojo: Meta no deja volver a crear el mismo nombre por unas semanas.`,
      accion: async () => {
        await eliminarPlantillaWaba(wabaSel, p.nombre);
        toast.success("Plantilla eliminada");
        await recargar();
      },
    });
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={(e) => { if (e.target === e.currentTarget && !open) setRender(false); }}
    >
      <div className="modal-card modal-card--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">Plantillas de mensajes</h2>
            <p className="appt-modal__subtitle">
              Son de la cuenta (WABA), no de cada clínica: se crean una sola vez y las
              usan todos los números que cuelgan de ella.
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <div className="field-grid">
            <label className="field field--full">
              <span className="field__label">Cuenta (WABA)</span>
              <select className="field__input" value={wabaSel} onChange={(e) => setWabaSel(e.target.value)}>
                {wabas.length === 0 && <option value="">Todavía no cargaste ninguna WABA</option>}
                {wabas.map((w) => (
                  <option key={w.id} value={w.wabaId}>
                    {w.nombre} — {w.disponibles}/20 libres
                  </option>
                ))}
              </select>
            </label>

            {loading ? (
              <p className="field field--full" style={{ color: "var(--color-text-secondary)" }}>
                Leyendo las plantillas de Meta…
              </p>
            ) : (
              plantillas.map((p) => {
                const b = BADGE[p.estado] || { color: "var(--color-text-secondary)", label: p.estado || "—" };
                return (
                  <div className="field field--full" key={p.nombre}
                    style={{ border: "1px solid var(--color-border)", borderRadius: ".7rem", padding: ".6rem .8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{p.nombre}</strong>
                      <span style={{ fontSize: ".75rem", color: b.color, fontWeight: 700 }}>{b.label}</span>
                      <span style={{ flex: 1 }} />
                      <button type="button" className="chip" style={{ color: "var(--color-error)" }}
                        onClick={() => borrar(p)}>
                        Eliminar
                      </button>
                    </div>
                    <p style={{ margin: ".35rem 0 0", fontSize: ".82rem", color: "var(--color-text-secondary)" }}>
                      {p.cuerpo}
                    </p>
                    {p.botones?.length > 0 && (
                      <div style={{ margin: ".4rem 0 0", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: ".72rem", color: "var(--color-text-secondary)" }}>
                          {p.botones.length} {p.botones.length === 1 ? "botón" : "botones"}:
                        </span>
                        {p.botones.map((bt, i) => (
                          <span key={i} style={{ fontSize: ".72rem", fontWeight: 600,
                            background: "var(--color-surface-2, #eef1f4)", borderRadius: ".5rem", padding: ".1rem .45rem" }}>
                            {bt}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.motivo && p.motivo !== "NONE" && (
                      <p style={{ margin: ".3rem 0 0", fontSize: ".76rem", color: "var(--color-error)" }}>
                        Motivo: {p.motivo}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {!loading && plantillas.length === 0 && wabaSel && (
              <p className="field field--full" style={{ color: "var(--color-text-secondary)" }}>
                Esta cuenta todavía no tiene plantillas. Creá el recordatorio de turnos
                para que salgan los avisos automáticos.
              </p>
            )}

            {!nueva ? (
              <div className="field field--full" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="chip"
                  style={{ fontWeight: 700, color: "var(--color-primary)" }}
                  onClick={usarRecordatorio}>
                  Crear recordatorio de turnos (3 botones)
                </button>
                <button type="button" className="chip" onClick={() => setNueva(true)}>
                  + Otra plantilla
                </button>
              </div>
            ) : (
              <>
                <label className="field">
                  <span className="field__label">Nombre (minúsculas y _)</span>
                  <input type="text" className="field__input" placeholder="ej. aviso_presupuesto"
                    value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="field__label">Botones (separados por coma)</span>
                  <input type="text" className="field__input" placeholder="Confirmar, Cancelar"
                    value={form.botones} onChange={(e) => setForm((f) => ({ ...f, botones: e.target.value }))} />
                </label>
                <label className="field field--full">
                  <span className="field__label">Cuerpo — usá {"{{1}}"}, {"{{2}}"}… para variables</span>
                  <textarea className="field__input" rows={3}
                    value={form.cuerpo} onChange={(e) => setForm((f) => ({ ...f, cuerpo: e.target.value }))} />
                </label>
                {Array.from({ length: nVars }, (_, i) => (
                  <label className="field" key={i}>
                    <span className="field__label">{`Ejemplo de {{${i + 1}}}`}</span>
                    <input type="text" className="field__input" value={form.ejemplos[i] || ""}
                      onChange={(e) => setForm((f) => {
                        const ejemplos = [...f.ejemplos];
                        ejemplos[i] = e.target.value;
                        return { ...f, ejemplos };
                      })} />
                  </label>
                ))}
                <div className="field field--full" style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="appt-modal__save" disabled={guardando} onClick={crear}>
                    {guardando ? "Enviando a Meta…" : "Crear plantilla"}
                  </button>
                  <button type="button" className="appt-modal__cancel" onClick={() => setNueva(false)}>
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose}>Cerrar</button>
        </footer>
      </div>

      <ConfirmModal
        open={Boolean(confirmar)}
        titulo={confirmar?.titulo}
        mensaje={confirmar?.mensaje}
        textoOk="Eliminar"
        danger
        onClose={() => setConfirmar(null)}
        onConfirm={async () => {
          try {
            await confirmar?.accion?.();
          } catch (err) {
            toast.error(err.message || "No se pudo eliminar");
          } finally {
            setConfirmar(null);
          }
        }}
      />
    </div>
  );
}
