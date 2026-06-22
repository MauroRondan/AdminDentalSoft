import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import { API_URL } from "../config/constants";
import { getWhatsApp, saveWhatsApp } from "../services/whatsappService";

const ESTADOS = [
  { id: "ACTIVO", label: "Activo" },
  { id: "PAUSADO", label: "Pausado" },
  { id: "SANDBOX", label: "Sandbox (pruebas)" },
];

const EMPTY = { estado: "ACTIVO", phoneId: "", numero: "", token: "", bienvenida: "" };

/**
 * Configura la conexión de WhatsApp (Meta Cloud API) de una clínica — onboarding
 * gestionado por el SA. Muestra los datos a pegar en Meta (webhook + verify token).
 */
export default function LicenciaWhatsAppModal({ open, onClose, licencia }) {
  const [form, setForm] = useState(EMPTY);
  const [meta, setMeta] = useState({ verifyToken: "", webhookUrl: "", tieneToken: false, configurado: false });
  const [render, setRender] = useState(open);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const licid = licencia?.licid;

  useEffect(() => {
    if (!open || !licid) return;
    setRender(true);
    setForm(EMPTY);
    setLoading(true);
    getWhatsApp(licid)
      .then((d) => {
        setForm({
          estado: d?.estado || "ACTIVO",
          phoneId: d?.phoneId || "",
          numero: d?.numero || "",
          token: "", // nunca se precarga; vacío = conservar el actual
          bienvenida: d?.bienvenida || "",
        });
        const base = (API_URL || "").replace(/\/$/, "");
        setMeta({
          verifyToken: d?.verifyToken || "",
          webhookUrl: base + (d?.webhookPath || "/public/whatsapp/webhook"),
          tieneToken: Boolean(d?.tieneToken),
          configurado: Boolean(d?.configurado),
        });
      })
      .catch((err) => toast.error(err.message || "No se pudo cargar la configuración"))
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
        numero: form.numero.trim() || null,
        token: form.token.trim() || null, // vacío = conservar el actual
        bienvenida: form.bienvenida.trim() || null,
      });
      toast.success("Conexión de WhatsApp guardada");
      onClose?.();
    } catch (err) {
      toast.error(err.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const CopyRow = ({ label, value, hint }) => (
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
      {hint && <span className="field__hint">{hint}</span>}
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
            <h2 className="appt-modal__title">WhatsApp · {licencia?.licnom || "Clínica"}</h2>
            <p className="appt-modal__subtitle">
              Conexión del bot de turnos con la WhatsApp Cloud API de Meta
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
              {/* Datos a pegar en Meta */}
              <div className="field field--full">
                <span className="field__label" style={{ fontWeight: 700 }}>1) Datos para pegar en Meta (webhook)</span>
                <p style={{ margin: "0 0 .5rem", fontSize: ".82rem", color: "var(--color-text-tertiary)" }}>
                  En Meta → WhatsApp → Configuración → Webhooks, pegá estos valores y suscribí el campo <b>messages</b>.
                </p>
              </div>
              <CopyRow label="Callback URL" value={meta.webhookUrl} />
              <CopyRow label="Token de verificación" value={meta.verifyToken} />

              {/* Credenciales de la clínica */}
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
                <input
                  type="text"
                  className="field__input"
                  placeholder="Ej. 1224941110692928"
                  value={form.phoneId}
                  onChange={(e) => update("phoneId", e.target.value)}
                />
                <span className="field__hint">De Meta → WhatsApp → Configuración de la API.</span>
              </label>

              <label className="field">
                <span className="field__label">Número visible</span>
                <input
                  type="text"
                  className="field__input"
                  placeholder="Ej. +595 9xx xxx xxx"
                  value={form.numero}
                  onChange={(e) => update("numero", e.target.value)}
                />
              </label>

              <label className="field field--full">
                <span className="field__label">Token de acceso de Meta</span>
                <input
                  type="password"
                  className="field__input"
                  placeholder={meta.tieneToken ? "•••••• (cargado — dejá vacío para conservarlo)" : "Pegá el token (empieza con EAA…)"}
                  value={form.token}
                  onChange={(e) => update("token", e.target.value)}
                  autoComplete="off"
                />
                <span className="field__hint">
                  {meta.tieneToken ? "Ya hay un token cargado. Completalo solo si querés reemplazarlo." : "Se guarda cifrado. Empieza con EAA…"}
                </span>
              </label>

              <label className="field field--full">
                <span className="field__label">Saludo del bot (opcional)</span>
                <textarea
                  className="field__input"
                  rows={2}
                  placeholder="👋 ¡Hola! Soy el asistente de turnos de la clínica…"
                  value={form.bienvenida}
                  onChange={(e) => update("bienvenida", e.target.value)}
                />
              </label>
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
    </div>
  );
}
