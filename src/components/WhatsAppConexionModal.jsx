import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import ConfirmModal from "./ConfirmModal";
import { formatMoney } from "../utils/format";
import {
  getWhatsApp,
  saveWhatsApp,
  listWabas,
  crearWaba,
  onboardingAgregarNumero,
  onboardingVerificarNumero,
  onboardingRegistrarNumero,
  eliminarNumeroClinica,
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

const EMPTY = { estado: "ACTIVO", phoneId: "", wabaId: "", numero: "", token: "", bienvenida: "" };

/**
 * Alta/edición COMPLETA de la conexión de WhatsApp de una clínica desde el módulo
 * WhatsApp del ADM: credenciales de Meta + plan de mensajes. Es la
 * versión gestionada de la vieja pantalla del ERP (la clínica ya no carga nada).
 */
export default function WhatsAppConexionModal({ open, onClose, licencia, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ tieneToken: false, configurado: false });
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
  // Onboarding sin Facebook (Sprint 92): WABA madre + número + código SMS. La conexión
  // (phone id, WABA, token, número visible) la arma sola el backend al verificar.
  const [wabas, setWabas] = useState([]);            // [{id, nombre, wabaId, usados, disponibles}]
  const [wabaSel, setWabaSel] = useState("");        // wabaId (Meta) elegido
  const [wabaNuevo, setWabaNuevo] = useState(null);  // { nombre, wabaId } → mini-form "+ WABA"
  const [act, setAct] = useState({ cc: "595", phone: "", verifiedName: "", codeMethod: "SMS" });
  const [actFase, setActFase] = useState("inicio");  // inicio | codigo
  const [actPhoneId, setActPhoneId] = useState("");
  const [actCode, setActCode] = useState("");
  const [actBusy, setActBusy] = useState(false);
  const [render, setRender] = useState(open);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const licid = licencia?.licid;
  const conectada = meta.configurado && meta.tieneToken;

  useEffect(() => {
    if (!open || !licid) return;
    setRender(true);
    setForm(EMPTY);
    setRecargaPend(null);
    setWabaSel("");
    setWabaNuevo(null);
    setAct({ cc: "595", phone: "", verifiedName: licencia?.licnom || "", codeMethod: "SMS" });
    setActFase("inicio");
    setActPhoneId("");
    setActCode("");
    listWabas().then((w) => setWabas(Array.isArray(w) ? w : [])).catch(() => {});
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
        setMeta({
          tieneToken: Boolean(d?.tieneToken),
          configurado: Boolean(d?.configurado),
        });
        setPlanes(cat ?? []);
        const actual = mio?.actual?.pmsid != null ? String(mio.actual.pmsid) : "";
        setPlanSel(actual);
        setPlanInicial(actual);
        setUso(mio);
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


  /* ── Onboarding sin Facebook ─────────────────────────────────────────────── */

  const guardarWabaNueva = async () => {
    if (!wabaNuevo?.nombre?.trim() || !wabaNuevo?.wabaId?.trim()) {
      toast.error("Faltan el nombre o el ID de la WABA");
      return;
    }
    try {
      await crearWaba(wabaNuevo.nombre.trim(), wabaNuevo.wabaId.trim());
      toast.success("WABA guardada");
      setWabaSel(wabaNuevo.wabaId.trim().replace(/\D/g, ""));
      setWabaNuevo(null);
      const w = await listWabas();
      setWabas(Array.isArray(w) ? w : []);
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la WABA");
    }
  };

  /** Paso 1: alta del número en la WABA madre + Meta le manda el código al cliente. */
  const enviarCodigo = async () => {
    if (!wabaSel) { toast.error("Elegí la WABA donde colgar el número"); return; }
    if (!act.phone.trim()) { toast.error("Cargá el número del cliente (sin el código de país)"); return; }
    if (!act.verifiedName.trim()) { toast.error("Cargá el nombre visible del negocio"); return; }
    setActBusy(true);
    try {
      const r = await onboardingAgregarNumero(licid, {
        wabaId: wabaSel, cc: act.cc.trim(), phone: act.phone.trim(),
        verifiedName: act.verifiedName.trim(), codeMethod: act.codeMethod,
      });
      setActPhoneId(r?.phoneNumberId || "");
      if (r?.yaVerificado) {
        // Número ya verificado de un alta anterior: se activa directo, sin código.
        await activarNumero(r?.phoneNumberId, "");
      } else {
        setActFase("codigo");
        toast.success(`Código enviado por ${act.codeMethod === "VOICE" ? "llamada" : "SMS"} al número del cliente`);
      }
    } catch (err) {
      toast.error(err.message || "No se pudo agregar el número");
    } finally {
      setActBusy(false);
    }
  };

  /**
   * Reintento del /register en Meta. Sin registro el número figura "No registrado" y
   * el bot no recibe ni envía nada — es el paso que hay que repetir si Meta lo rechazó
   * justo después del verify (suele tardar unos segundos en habilitarlo).
   */
  const registrarNumero = async () => {
    if (actBusy) return;
    setActBusy(true);
    try {
      const r = await onboardingRegistrarNumero(licid, {
        phoneNumberId: form.phoneId.trim() || null,
      });
      toast.success(r?.mensaje || "Número registrado en Cloud API");
    } catch (err) {
      toast.error(err.message || "No se pudo registrar el número", { duration: 10000 });
    } finally {
      setActBusy(false);
    }
  };

  /** Baja del número: se borra en Meta y la clínica queda desconectada. */
  const eliminarNumero = async () => {
    const r = await eliminarNumeroClinica(licid);
    toast.success(r?.mensaje || "Número eliminado");
    setMeta((m) => ({ ...m, configurado: false, tieneToken: false }));
    setForm(EMPTY);
    onSaved?.();
    onClose?.();
  };

  /** Paso 2: verifica el código — el backend arma la conexión completa solo. */
  const activarNumero = async (phoneId = actPhoneId, code = actCode) => {
    if (!phoneId) { toast.error("Repetí el envío del código"); return; }
    setActBusy(true);
    try {
      const r = await onboardingVerificarNumero(licid, {
        wabaId: wabaSel,
        phoneNumberId: phoneId,
        code: (code || "").trim() || null,
        bienvenida: form.bienvenida.trim() || null,
      });
      // Si Meta no completó el /register, el número queda MUDO: hay que reintentar.
      if (r?.registrado === false) toast.error(r?.mensaje, { duration: 12000 });
      else toast.success(r?.mensaje || "Número activado: la clínica quedó conectada");
      setMeta((m) => ({ ...m, configurado: true, tieneToken: true }));
      setForm((f) => ({
        ...f,
        estado: r?.estado || "ACTIVO",
        phoneId: r?.phoneId || phoneId,
        wabaId: r?.wabaId || wabaSel,
        numero: r?.numero || f.numero,
        token: "",
      }));
      setActFase("inicio");
      setActCode("");
      onSaved?.();
    } catch (err) {
      toast.error(err.message || "No se pudo activar el número");
    } finally {
      setActBusy(false);
    }
  };

  const submit = async () => {
    if (form.estado !== "SANDBOX" && !form.phoneId.trim()) {
      toast.error("Primero activá el número: enviá el código al cliente y verificalo arriba");
      return;
    }
    if (form.estado === "ACTIVO" && !meta.tieneToken && !form.token.trim()) {
      toast.error("La conexión no tiene token — activá el número con el flujo de arriba");
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
              {/* El webhook es global de la app (se configura UNA vez en Meta) y el
                  phone id / WABA / token los resuelve el alta sola: no hay nada que
                  copiar ni pegar acá. Solo el número, el plan y su saldo. */}
              <div className="field field--full">
                <span className="field__label" style={{ fontWeight: 700 }}>1) Número de la clínica</span>
              </div>

              {/* Activar por número (sin Facebook) — la conexión se arma sola al verificar */}
              {!conectada && (
                <div className="field field--full" style={{ border: "1px solid var(--color-primary)",
                  borderRadius: ".7rem", padding: ".8rem", background: "var(--color-surface-2, #f4faf8)" }}>
                  <span className="field__label" style={{ fontWeight: 700 }}>
                    Activar por número (sin Facebook)
                  </span>
                  <p style={{ margin: "0 0 .6rem", fontSize: ".82rem", color: "var(--color-text-secondary)" }}>
                    Cargá el número del cliente y el nombre del negocio. Le llega un código, lo
                    verificás y queda activo — sin tokens ni IDs a mano.
                  </p>

                  <span className="field__label">Cuenta (WABA)</span>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select className="field__input" style={{ flex: 1, minWidth: 0 }}
                      value={wabaSel} onChange={(e) => setWabaSel(e.target.value)}>
                      <option value="">Elegí la WABA madre…</option>
                      {wabas.map((w) => (
                        <option key={w.id} value={w.wabaId}>
                          {w.nombre} — {w.disponibles}/20 libres
                        </option>
                      ))}
                    </select>
                    <button type="button" className="chip" onClick={() => setWabaNuevo({ nombre: "", wabaId: "" })}>
                      + WABA
                    </button>
                  </div>

                  {wabaNuevo && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8,
                      padding: ".6rem", border: "1px dashed var(--color-border)", borderRadius: ".6rem" }}>
                      <input type="text" className="field__input" style={{ flex: "1 1 160px" }}
                        placeholder="Nombre (ej. Clientes 1 al 20)"
                        value={wabaNuevo.nombre}
                        onChange={(e) => setWabaNuevo((p) => ({ ...p, nombre: e.target.value }))} />
                      <input type="text" className="field__input" style={{ flex: "1 1 160px" }}
                        placeholder="ID de la WABA (Meta)"
                        value={wabaNuevo.wabaId}
                        onChange={(e) => setWabaNuevo((p) => ({ ...p, wabaId: e.target.value }))} />
                      <button type="button" className="chip" style={{ fontWeight: 700, color: "var(--color-primary)" }}
                        onClick={guardarWabaNueva}>Guardar</button>
                      <button type="button" className="chip" onClick={() => setWabaNuevo(null)}>Cancelar</button>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <label className="field" style={{ flex: "0 0 90px" }}>
                      <span className="field__label">País</span>
                      <input type="text" className="field__input" value={act.cc}
                        onChange={(e) => setAct((p) => ({ ...p, cc: e.target.value }))} />
                    </label>
                    <label className="field" style={{ flex: "1 1 160px" }}>
                      <span className="field__label">Número (sin país)</span>
                      <input type="text" className="field__input" placeholder="9xxxxxxxx"
                        value={act.phone}
                        onChange={(e) => setAct((p) => ({ ...p, phone: e.target.value }))} />
                    </label>
                  </div>
                  <label className="field field--full" style={{ marginBottom: 8 }}>
                    <span className="field__label">Nombre del negocio (lo ve el destinatario)</span>
                    <input type="text" className="field__input"
                      value={act.verifiedName}
                      onChange={(e) => setAct((p) => ({ ...p, verifiedName: e.target.value }))} />
                  </label>

                  {actFase === "inicio" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <select className="field__input" style={{ flex: 1, minWidth: 0 }}
                        value={act.codeMethod}
                        onChange={(e) => setAct((p) => ({ ...p, codeMethod: e.target.value }))}>
                        <option value="SMS">Código por SMS</option>
                        <option value="VOICE">Código por llamada</option>
                      </select>
                      <button type="button" className="appt-modal__save" disabled={actBusy} onClick={enviarCodigo}>
                        {actBusy ? "Enviando…" : "Enviar código"}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input type="text" className="field__input" style={{ flex: "1 1 140px" }}
                        placeholder="Código recibido" value={actCode}
                        onChange={(e) => setActCode(e.target.value)} />
                      <button type="button" className="appt-modal__save" disabled={actBusy}
                        onClick={() => activarNumero()}>
                        {actBusy ? "Activando…" : "Verificar y activar"}
                      </button>
                      <button type="button" className="chip" disabled={actBusy} onClick={enviarCodigo}>
                        Reenviar código
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Los datos de la conexión solo se muestran cuando la clínica YA está
                  conectada (modo edición: pausar, ver ids). El alta es SIEMPRE por el
                  flujo de arriba — la carga manual se eliminó. */}
              {conectada && (
                <>
                  {/* Sin el /register de Meta el número queda "No registrado" y el bot
                      no recibe ni envía. Este botón lo reintenta cuando hace falta. */}
                  <div className="field field--full" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="button" className="chip" disabled={actBusy}
                      style={{ fontWeight: 700, color: "var(--color-primary)" }}
                      onClick={registrarNumero}>
                      {actBusy ? "Registrando…" : "Registrar número en Meta"}
                    </button>
                    <span style={{ fontSize: ".78rem", color: "var(--color-text-tertiary)" }}>
                      Si el bot no responde y en Meta figura “No registrado”, tocá acá.
                    </span>
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

                  {/* Baja: borra el número en Meta (libera el cupo de la WABA) y
                      desconecta la clínica. El historial de mensajes no se toca. */}
                  <div className="field field--full">
                    <button type="button" className="chip" disabled={actBusy}
                      style={{ color: "var(--color-error)", fontWeight: 700 }}
                      onClick={() => setConfirmar({
                        titulo: "Eliminar el número de la clínica",
                        mensaje: `${form.numero || "El número"}\n\nSe borra de Meta (se libera el cupo de la WABA) y la clínica queda desconectada. El historial de mensajes se conserva.`,
                        textoOk: "Eliminar número",
                        danger: true,
                        accion: eliminarNumero,
                      })}>
                      Eliminar número
                    </button>
                  </div>
                </>
              )}

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

              {/* Las plantillas son de la WABA (genéricas para todas las clínicas que
                  cuelgan de ella): se administran desde el botón "Plantillas" de la
                  pantalla, no acá. */}
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
