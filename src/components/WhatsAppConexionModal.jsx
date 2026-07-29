import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import { API_URL } from "../config/constants";
import { formatMoney } from "../utils/format";
import {
  getWhatsApp,
  saveWhatsApp,
  listPlantillas,
  crearPlantilla,
  marcarRecordatorio,
  crearRecordatorioPlantilla,
  eliminarPlantilla,
} from "../services/whatsappService";
import {
  listPlanesMensaje,
  getPlanMensajeLicencia,
  setPlanMensajeLicencia,
  recargarMensajes,
} from "../services/planMensajeService";

const ESTADOS = [
  { id: "ACTIVO", label: "Activo" },
  { id: "PAUSADO", label: "Pausado" },
  { id: "SANDBOX", label: "Sandbox (pruebas)" },
];

const PLANTILLA_BADGE = {
  APROBADA: { color: "var(--color-success, #16a34a)", label: "Aprobada" },
  PENDIENTE: { color: "var(--color-warning, #b45309)", label: "Pendiente en Meta" },
  RECHAZADA: { color: "var(--color-error)", label: "Rechazada" },
  PAUSADA: { color: "var(--color-text-secondary)", label: "Pausada" },
};

const contarVariables = (cuerpo) => {
  let max = 0;
  for (const m of (cuerpo || "").matchAll(/\{\{(\d+)}}/g)) max = Math.max(max, Number(m[1]));
  return max;
};

const EMPTY = { estado: "ACTIVO", phoneId: "", wabaId: "", numero: "", token: "", bienvenida: "" };

/**
 * Alta/edición COMPLETA de la conexión de WhatsApp de una clínica desde el módulo
 * WhatsApp del ADM: credenciales de Meta + plan de mensajes + plantillas. Es la
 * versión gestionada de la vieja pantalla del ERP (la clínica ya no carga nada).
 */
export default function WhatsAppConexionModal({ open, onClose, licencia, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ verifyToken: "", webhookUrl: "", tieneToken: false, configurado: false });
  const [planes, setPlanes] = useState([]);
  const [planSel, setPlanSel] = useState("");     // pmsid elegido ("" = sin plan)
  const [planInicial, setPlanInicial] = useState("");
  // Consumo del mes + recargas (Sprint 87): el SA ve cuánto le queda de verdad.
  const [uso, setUso] = useState(null);           // { consumo, recargado, cupoMes, recargas }
  const [recargando, setRecargando] = useState(false);
  // Confirmación con modal propio (nada de window.confirm).
  const [confirmar, setConfirmar] = useState(null); // { titulo, mensaje, textoOk, danger, accion }
  // Recarga ELEGIDA pero todavía no aplicada: se ejecuta recién al "Guardar conexión",
  // como cualquier otro campo del formulario. Así el SA puede arrepentirse cerrando.
  const [recargaPend, setRecargaPend] = useState(null); // { pmsid, cupo, precio }
  const [plantillas, setPlantillas] = useState([]);
  const [recNombre, setRecNombre] = useState("");
  const [creandoRec, setCreandoRec] = useState(false);
  const [plNueva, setPlNueva] = useState(false);
  const [plForm, setPlForm] = useState({ nombre: "", cuerpo: "", ejemplos: [], boton: false, recordatorio: false });
  const [plGuardando, setPlGuardando] = useState(false);
  const [render, setRender] = useState(open);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const licid = licencia?.licid;
  const conectada = meta.configurado && meta.tieneToken;

  useEffect(() => {
    if (!open || !licid) return;
    setRender(true);
    setForm(EMPTY);
    setPlantillas([]);
    setPlNueva(false);
    setRecargaPend(null);
    setLoading(true);
    Promise.all([getWhatsApp(licid), listPlanesMensaje(), getPlanMensajeLicencia(licid)])
      .then(([d, cat, mio]) => {
        setForm({
          estado: d?.estado || "ACTIVO",
          phoneId: d?.phoneId || "",
          wabaId: d?.wabaId || "",
          numero: d?.numero || "",
          token: "",
          bienvenida: d?.bienvenida || "",
        });
        const base = (API_URL || "").replace(/\/$/, "");
        setMeta({
          verifyToken: d?.verifyToken || "",
          webhookUrl: base + (d?.webhookPath || "/public/whatsapp/webhook"),
          tieneToken: Boolean(d?.tieneToken),
          configurado: Boolean(d?.configurado),
        });
        setPlanes(cat ?? []);
        const actual = mio?.actual?.pmsid != null ? String(mio.actual.pmsid) : "";
        setPlanSel(actual);
        setPlanInicial(actual);
        setUso(mio);
        if (d?.configurado && d?.tieneToken) {
          listPlantillas(licid).then((pl) => setPlantillas(Array.isArray(pl) ? pl : [])).catch(() => {});
        }
      })
      .catch((err) => toast.error(err.message || "No se pudo cargar la conexión"))
      .finally(() => setLoading(false));
  }, [open, licid]);

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

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const copiar = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast.success("Copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const submit = async () => {
    if (form.estado !== "SANDBOX" && !form.phoneId.trim()) {
      toast.error("El Phone number ID es obligatorio");
      return;
    }
    if (form.estado === "ACTIVO" && !meta.tieneToken && !form.token.trim()) {
      toast.error("Cargá el token de acceso de Meta");
      return;
    }
    setSaving(true);
    try {
      await saveWhatsApp(licid, {
        estado: form.estado,
        phoneId: form.phoneId.trim() || null,
        wabaId: form.wabaId.trim() || null,
        numero: form.numero.trim() || null,
        token: form.token.trim() || null, // vacío = conservar el actual
        bienvenida: form.bienvenida.trim() || null,
      });
      if (planSel !== planInicial) {
        // Asignar el paquete YA carga el saldo inicial (es la venta): por eso la primera
        // vez alcanza con elegirlo y guardar — no hay recarga que aplicar.
        await setPlanMensajeLicencia(licid, planSel === "" ? null : Number(planSel));
      } else if (recargaPend) {
        // Recarga elegida en esta sesión: se aplica ACÁ, al guardar, no antes.
        await recargarMensajes(licid, { pmsid: recargaPend.pmsid });
        toast.success(`Recargado: +${Number(recargaPend.cupo).toLocaleString("es-PY")}`);
      }
      toast.success("Conexión de WhatsApp guardada");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Elegir una recarga: confirma y la deja PENDIENTE. El saldo recién se suma al tocar
   * "Guardar conexión" — igual que el resto del formulario, así el SA puede cerrar sin
   * aplicar nada si se equivocó de clínica o de paquete.
   */
  const recargar = (paquete) => {
    setConfirmar({
      titulo: `Recargar ${Number(paquete.cupo).toLocaleString("es-PY")} mensajes`,
      mensaje:
        `${licencia?.licnom}\n\n` +
        `Se le cobra ${formatMoney(paquete.precio)} una sola vez, en la factura de este mes. ` +
        `El saldo se suma al que le quede.\n\n` +
        `La recarga se aplica cuando toques "Guardar conexión".`,
      textoOk: "Agregar recarga",
      accion: async () => {
        setRecargaPend({ pmsid: paquete.pmsid, cupo: paquete.cupo, precio: paquete.precio });
      },
    });
  };

  /** Ejecuta la acción del confirm y lo cierra (los errores quedan en el toast). */
  const confirmarAccion = async () => {
    if (!confirmar || recargando) return;
    setRecargando(true);
    try {
      await confirmar.accion();
      setConfirmar(null);
    } catch (err) {
      toast.error(err.message || "No se pudo completar la acción");
    } finally {
      setRecargando(false);
    }
  };

  const nVars = contarVariables(plForm.cuerpo);

  const crearNuevaPlantilla = async () => {
    if (!plForm.nombre.trim() || !plForm.cuerpo.trim() || plGuardando) return;
    const ejemplos = plForm.ejemplos.slice(0, nVars);
    if (nVars > 0 && ejemplos.filter((e) => e && e.trim()).length < nVars) {
      toast.error("Cargá un ejemplo por cada variable {{n}} (Meta los exige)");
      return;
    }
    setPlGuardando(true);
    try {
      await crearPlantilla(licid, {
        nombre: plForm.nombre.trim(),
        categoria: "UTILITY",
        cuerpo: plForm.cuerpo.trim(),
        ejemplos: nVars > 0 ? ejemplos.map((e) => e.trim()) : [],
        botones: plForm.boton ? ["Confirmar asistencia"] : [],
        usarComoRecordatorio: plForm.recordatorio,
      });
      toast.success("Plantilla enviada a Meta");
      setPlNueva(false);
      setPlForm({ nombre: "", cuerpo: "", ejemplos: [], boton: false, recordatorio: false });
      listPlantillas(licid).then((pl) => setPlantillas(Array.isArray(pl) ? pl : [])).catch(() => {});
    } catch (err) {
      toast.error(err.message || "No se pudo crear la plantilla");
    } finally {
      setPlGuardando(false);
    }
  };

  const borrarPlantilla = (p) => {
    setConfirmar({
      titulo: "Eliminar plantilla",
      mensaje: `"${p.wplnombre}"\n\nTambién se elimina en Meta y no se puede deshacer.`,
      textoOk: "Eliminar",
      danger: true,
      accion: async () => {
        await eliminarPlantilla(licid, p.wplid);
        toast.success("Plantilla eliminada");
        setPlantillas((prev) => prev.filter((x) => x.wplid !== p.wplid));
      },
    });
  };

  const usarRecordatorio = async (p) => {
    try {
      await marcarRecordatorio(licid, p.wplid);
      toast.success(`"${p.wplnombre}" se usará para los recordatorios`);
      listPlantillas(licid).then((pl) => setPlantillas(Array.isArray(pl) ? pl : [])).catch(() => {});
    } catch (err) {
      toast.error(err.message || "No se pudo marcar");
    }
  };

  const crearRecordatorio = async () => {
    if (creandoRec) return;
    setCreandoRec(true);
    try {
      const r = await crearRecordatorioPlantilla(licid, recNombre.trim());
      const p = r?.data || r;
      toast.success(`Plantilla "${p?.wplnombre || "recordatorio_turno"}" enviada a Meta — queda Pendiente`);
      setRecNombre("");
      const pl = await listPlantillas(licid);
      setPlantillas(Array.isArray(pl) ? pl : []);
    } catch (err) {
      // Muestra el MOTIVO REAL de Meta (nombre en enfriamiento tras borrar, token, etc.).
      toast.error(err.message || "No se pudo crear la plantilla de recordatorio");
    } finally {
      setCreandoRec(false);
    }
  };

  const CopyRow = ({ label, value }) => (
    <label className="field field--full">
      <span className="field__label">{label}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <input type="text" className="field__input" value={value} readOnly onFocus={(e) => e.target.select()} />
        <button
          type="button"
          onClick={() => copiar(value)}
          style={{ flexShrink: 0, padding: "0 .7rem", border: "1px solid var(--color-border)", borderRadius: ".6rem", background: "var(--color-surface)", cursor: "pointer" }}
          aria-label={`Copiar ${label}`}
        >
          <Icon name="copy" size={16} />
        </button>
      </div>
    </label>
  );

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="modal-card modal-card--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">
              {conectada ? "Conexión de WhatsApp" : "Conectar WhatsApp"} · {licencia?.licnom || "Clínica"}
            </h2>
            <p className="appt-modal__subtitle">
              Credenciales de Meta + plan de mensajes. La clínica solo ve su consumo — la conexión la manejás vos.
            </p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          {loading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Cargando…</p>
          ) : (
            <div className="field-grid">
              {/* 1) Webhook para Meta */}
              <div className="field field--full">
                <span className="field__label" style={{ fontWeight: 700 }}>1) Datos para pegar en Meta (webhook)</span>
                <p style={{ margin: "0 0 .5rem", fontSize: ".82rem", color: "var(--color-text-tertiary)" }}>
                  En Meta → WhatsApp → Configuración → Webhooks, pegá estos valores y suscribí el campo <b>messages</b>.
                </p>
              </div>
              <CopyRow label="Callback URL" value={meta.webhookUrl} />
              <CopyRow label="Token de verificación" value={meta.verifyToken} />

              {/* 2) Credenciales */}
              <div className="field field--full" style={{ marginTop: 4 }}>
                <span className="field__label" style={{ fontWeight: 700 }}>2) Credenciales del número de la clínica</span>
              </div>

              <div className="field field--full">
                <span className="field__label">Estado</span>
                <div className="chip-group">
                  {ESTADOS.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className={`chip${form.estado === e.id ? " chip--active" : ""}`}
                      onClick={() => update("estado", e.id)}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="field">
                <span className="field__label">Phone number ID *</span>
                <input type="text" className="field__input" placeholder="Ej. 1224941110692928"
                  value={form.phoneId} onChange={(e) => update("phoneId", e.target.value)} />
              </label>

              <label className="field">
                <span className="field__label">WABA ID</span>
                <input type="text" className="field__input" placeholder="WhatsApp Business Account ID"
                  value={form.wabaId} onChange={(e) => update("wabaId", e.target.value)} />
                <span className="field__hint">Necesario para crear plantillas desde acá.</span>
              </label>

              <label className="field">
                <span className="field__label">Número visible</span>
                <input type="text" className="field__input" placeholder="Ej. +595 9xx xxx xxx"
                  value={form.numero} onChange={(e) => update("numero", e.target.value)} />
              </label>

              <label className="field">
                <span className="field__label">Token de acceso de Meta</span>
                <input type="password" className="field__input" autoComplete="off"
                  placeholder={meta.tieneToken ? "•••••• (cargado — vacío para conservarlo)" : "Pegá el token (EAA…)"}
                  value={form.token} onChange={(e) => update("token", e.target.value)} />
              </label>

              <label className="field field--full">
                <span className="field__label">Saludo del bot (opcional)</span>
                <textarea className="field__input" rows={2}
                  placeholder="👋 ¡Hola! Soy el asistente de turnos de la clínica…"
                  value={form.bienvenida} onChange={(e) => update("bienvenida", e.target.value)} />
              </label>

              {/* 3) Plan de mensajes */}
              <div className="field field--full" style={{ marginTop: 4 }}>
                <span className="field__label" style={{ fontWeight: 700 }}>3) Plan de mensajes</span>
              </div>
              <div className="field field--full">
                <div className="module-picker">
                  <button
                    type="button"
                    className={`module-option${planSel === "" ? " module-option--selected" : ""}`}
                    onClick={() => setPlanSel("")}
                  >
                    <span className="module-option__check">
                      {planSel === "" && <Icon name="check" size={14} />}
                    </span>
                    <span className="module-option__info">
                      <span className="module-option__name">Sin plan de mensajes</span>
                      <span className="module-option__meta">La clínica queda sin cupo de mensajería</span>
                    </span>
                  </button>
                  {planes.map((p) => {
                    const checked = planSel === String(p.pmsid);
                    return (
                      <button
                        type="button"
                        key={p.pmsid}
                        className={`module-option${checked ? " module-option--selected" : ""}`}
                        onClick={() => setPlanSel(String(p.pmsid))}
                      >
                        <span className="module-option__check">
                          {checked && <Icon name="check" size={14} />}
                        </span>
                        <span className="module-option__info">
                          <span className="module-option__name">{p.nombre}</span>
                          <span className="module-option__meta">
                            {Number(p.cupo).toLocaleString("es-PY")} recordatorios/mes — ganás {formatMoney(p.ganancia)}
                          </span>
                        </span>
                        <span className="module-option__price">{formatMoney(p.precio)}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="field__hint">
                  Lo que paga la clínica por mes. La ganancia entra sola al ingreso del dashboard.
                </span>
              </div>

              {/* Consumo + RECARGA (Sprint 87). El plan no se agranda: si se le acaba el
                  cupo se recarga, y esa recarga se cobra solo en la factura de este mes. */}
              {planInicial !== "" && uso?.consumo && (
                <div className="field field--full" style={{ marginTop: 4 }}>
                  <span className="field__label" style={{ fontWeight: 700 }}>
                    Saldo · comprado {Number(uso.comprado ?? 0).toLocaleString("es-PY")}
                  </span>
                  <p style={{ margin: "0 0 .6rem", fontSize: ".85rem", color: "var(--color-text-secondary)" }}>
                    Recordatorios usados <b>{uso.consumo.recordatorios ?? 0}</b>
                    {uso.restante && (
                      <> — <b style={{ color: "var(--color-primary)" }}>
                        quedan {Number(uso.restante.recordatorios ?? 0).toLocaleString("es-PY")}
                      </b></>
                    )}
                  </p>
                  <span className="field__label">Recargar (se cobra en la factura de este mes)</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {planes.map((p) => (
                      <button
                        key={p.pmsid}
                        type="button"
                        className="chip"
                        disabled={recargando}
                        onClick={() => recargar(p)}
                        title={`+${p.cupo} mensajes por ${formatMoney(p.precio)} (una vez)`}
                      >
                        +{Number(p.cupo).toLocaleString("es-PY")} · {formatMoney(p.precio)}
                      </button>
                    ))}
                  </div>
                  {recargaPend && (
                    <p style={{
                      margin: ".6rem 0 0", padding: ".5rem .7rem", borderRadius: ".6rem",
                      fontSize: ".82rem", fontWeight: 600,
                      background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      color: "var(--color-primary)",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Icon name="check" size={14} />
                      <span>
                        Recarga de +{Number(recargaPend.cupo).toLocaleString("es-PY")}{" "}
                        ({formatMoney(recargaPend.precio)}) — se aplica al guardar.
                      </span>
                      <button type="button" className="chip" style={{ marginLeft: "auto" }}
                        onClick={() => setRecargaPend(null)}>
                        Quitar
                      </button>
                    </p>
                  )}
                  {Array.isArray(uso.recargas) && uso.recargas.length > 0 && (
                    <p style={{ margin: ".6rem 0 0", fontSize: ".78rem", color: "var(--color-text-tertiary)" }}>
                      Últimas recargas:{" "}
                      {uso.recargas.slice(0, 4).map((r) => (
                        `${r.periodo} +${r.cantidad} (${formatMoney(r.precio)})`
                      )).join(" · ")}
                    </p>
                  )}
                </div>
              )}

              {/* 4) Plantillas (solo con conexión activa) */}
              {conectada && (
                <>
                  <div className="field field--full" style={{ marginTop: 4 }}>
                    <span className="field__label" style={{ fontWeight: 700 }}>4) Plantillas de mensajes</span>
                  </div>
                  {plantillas.map((p) => {
                    const b = PLANTILLA_BADGE[p.wplestado] || { color: "var(--color-text-secondary)", label: p.wplestado || "—" };
                    let botones = [];
                    try { const x = JSON.parse(p.wplbotones || "[]"); botones = Array.isArray(x) ? x : []; } catch { botones = []; }
                    return (
                      <div className="field field--full" key={p.wplid}
                        style={{ border: "1px solid var(--color-border)", borderRadius: ".7rem", padding: ".6rem .8rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <strong>{p.wplnombre}</strong>
                          <span style={{ fontSize: ".75rem", color: b.color, fontWeight: 700 }}>{b.label}</span>
                          {p.wpluso === "RECORDATORIO" && (
                            <span style={{ fontSize: ".75rem", color: "var(--color-primary)", fontWeight: 700 }}>
                              Recordatorio de turnos
                            </span>
                          )}
                          <span style={{ flex: 1 }} />
                          {p.wplestado === "APROBADA" && p.wpluso !== "RECORDATORIO" && (
                            <button type="button" className="chip" onClick={() => usarRecordatorio(p)}>
                              Usar para recordatorios
                            </button>
                          )}
                          <button type="button" className="chip" style={{ color: "var(--color-error)" }}
                            onClick={() => borrarPlantilla(p)}>
                            Eliminar
                          </button>
                        </div>
                        <p style={{ margin: ".35rem 0 0", fontSize: ".82rem", color: "var(--color-text-secondary)" }}>
                          {p.wplcuerpo}
                        </p>
                        {botones.length > 0 && (
                          <div style={{ margin: ".4rem 0 0", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: ".72rem", color: "var(--color-text-secondary)" }}>
                              {botones.length} {botones.length === 1 ? "botón" : "botones"}:
                            </span>
                            {botones.map((bt, i) => (
                              <span key={i} style={{ fontSize: ".72rem", fontWeight: 600,
                                background: "var(--color-surface-2, #eef1f4)", borderRadius: ".5rem", padding: ".1rem .45rem" }}>
                                {bt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!plNueva ? (
                    <>
                      <div className="field field--full" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <input type="text" className="field__input" style={{ flex: "1 1 180px", minWidth: 0 }}
                          placeholder="recordatorio_turno (nombre)"
                          value={recNombre} onChange={(e) => setRecNombre(e.target.value)} />
                        <button type="button" className="chip" disabled={creandoRec}
                          style={{ fontWeight: 700, color: "var(--color-primary)" }}
                          onClick={crearRecordatorio}>
                          {creandoRec ? "Enviando a Meta…" : "Crear recordatorio (3 botones)"}
                        </button>
                      </div>
                      <div className="field field--full">
                        <button type="button" className="chip" onClick={() => setPlNueva(true)}>
                          + Nueva plantilla
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="field">
                        <span className="field__label">Nombre (minúsculas y _)</span>
                        <input type="text" className="field__input" placeholder="ej. aviso_presupuesto"
                          value={plForm.nombre} onChange={(e) => setPlForm((f) => ({ ...f, nombre: e.target.value }))} />
                      </label>
                      <label className="field field--full">
                        <span className="field__label">Cuerpo — usá {"{{1}}"}, {"{{2}}"}… para variables</span>
                        <textarea className="field__input" rows={3}
                          value={plForm.cuerpo} onChange={(e) => setPlForm((f) => ({ ...f, cuerpo: e.target.value }))} />
                      </label>
                      {Array.from({ length: nVars }, (_, i) => (
                        <label className="field" key={i}>
                          <span className="field__label">{`Ejemplo de {{${i + 1}}}`}</span>
                          <input type="text" className="field__input" value={plForm.ejemplos[i] || ""}
                            onChange={(e) => setPlForm((f) => {
                              const ejemplos = [...f.ejemplos];
                              ejemplos[i] = e.target.value;
                              return { ...f, ejemplos };
                            })} />
                        </label>
                      ))}
                      <label className="field field--full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={plForm.boton}
                          onChange={(e) => setPlForm((f) => ({ ...f, boton: e.target.checked }))} />
                        <span>Botón ✅ "Confirmar asistencia" (el turno pasa a Confirmado)</span>
                      </label>
                      <label className="field field--full" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={plForm.recordatorio}
                          onChange={(e) => setPlForm((f) => ({ ...f, recordatorio: e.target.checked }))} />
                        <span>Usar para los recordatorios de turnos</span>
                      </label>
                      <div className="field field--full" style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                        <button type="button" className="appt-modal__save" disabled={plGuardando}
                          onClick={crearNuevaPlantilla}>
                          {plGuardando ? "Enviando a Meta…" : "Crear plantilla"}
                        </button>
                        <button type="button" className="appt-modal__cancel" onClick={() => setPlNueva(false)}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="appt-modal__save" onClick={submit} disabled={saving || loading}>
            {saving ? "Guardando…" : "Guardar conexión"}
          </button>
        </footer>
      </div>

      <ConfirmModal
        open={Boolean(confirmar)}
        titulo={confirmar?.titulo}
        mensaje={confirmar?.mensaje}
        textoOk={confirmar?.textoOk}
        danger={confirmar?.danger}
        saving={recargando}
        onConfirm={confirmarAccion}
        onClose={() => !recargando && setConfirmar(null)}
      />
    </div>
  );
}
