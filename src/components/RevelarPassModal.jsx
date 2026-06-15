import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "./icons";
import { revelarPass } from "../services/usuarioService";

const nivelLabel = (n) => {
  switch (String(n)) {
    case "SA":
      return "Superadmin";
    case "1":
      return "Admin clínica";
    default:
      return n ? `Nivel ${n}` : "—";
  }
};

/**
 * Función oculta (atajo F6): recuperación de contraseña. El SA ingresa un email
 * y el backend descifra la contraseña (3DES) de los usuarios que coincidan. Es
 * SOLO de lectura — pensada para "me olvidé la clave". No modifica nada.
 */
export default function RevelarPassModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null); // null = sin buscar aún
  const [hidden, setHidden] = useState(() => new Set()); // ids con la pass oculta
  const [render, setRender] = useState(open);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRender(true);
    setEmail("");
    setResults(null);
    setHidden(new Set());
    // Foco al input al abrir.
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
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

  const buscar = async () => {
    const mail = email.trim();
    if (!mail) {
      toast.error("Ingresá un email / usuario");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const data = await revelarPass(mail);
      const list = Array.isArray(data) ? data : [];
      setResults(list);
      // Por defecto, mostramos las contraseñas (es el propósito de la función).
      setHidden(new Set());
      if (list.length === 0) toast.message("Sin coincidencias para ese email");
    } catch (err) {
      toast.error(err.message || "No se pudo recuperar la contraseña");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    buscar();
  };

  const toggleHide = (id) => {
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const copiar = async (pass) => {
    try {
      await navigator.clipboard.writeText(pass);
      toast.success("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div
      className={`modal-overlay ${open ? "modal-overlay--open" : "modal-overlay--closing"}`}
      onClick={onClose}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className="modal-card modal-card--sm"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="appt-modal__header">
          <div>
            <h2 className="appt-modal__title">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                <Icon name="lock" size={18} /> Recuperar contraseña
              </span>
            </h2>
            <p className="appt-modal__subtitle">Función interna (F6) · solo lectura</p>
          </div>
          <button type="button" className="appt-modal__close" onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={20} />
          </button>
        </header>

        <div className="appt-modal__body">
          <form className="reveal-pass__form" onSubmit={onSubmit}>
            <label className="field field--full">
              <span className="field__label">Email / usuario</span>
              <div className="reveal-pass__search">
                <input
                  ref={inputRef}
                  type="text"
                  className="field__input"
                  placeholder="usuario@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className="appt-modal__save" disabled={loading}>
                  {loading ? "Buscando…" : "Revelar"}
                </button>
              </div>
              <span className="field__hint">
                Descifra la clave guardada por si el usuario la olvidó.
              </span>
            </label>
          </form>

          {results !== null && (
            <div className="reveal-pass__results">
              {results.length === 0 ? (
                <p className="reveal-pass__empty">
                  No se encontró ningún usuario con ese email.
                </p>
              ) : (
                results.map((r) => {
                  const oculto = hidden.has(r.usuid);
                  return (
                    <div key={r.usuid} className="reveal-pass__result">
                      <div className="reveal-pass__user">
                        <span className="reveal-pass__name">{r.usunom || "—"}</span>
                        <span className={`badge badge--${r.usunivel === "SA" ? "primary" : "accent"}`}>
                          {nivelLabel(r.usunivel)}
                        </span>
                        {r.usuest === false && <span className="badge badge--off">Inactivo</span>}
                      </div>
                      <div className="reveal-pass__sub">
                        {r.usumail}
                        {(r.licnom || r.licencia) && <span> · {r.licnom || r.licencia}</span>}
                      </div>

                      {r.descifrada ? (
                        <div className="reveal-pass__passrow">
                          <code className="reveal-pass__pass">
                            {oculto ? "•".repeat(Math.max(8, (r.password || "").length)) : r.password}
                          </code>
                          <button
                            type="button"
                            className="reveal-pass__icon-btn"
                            onClick={() => toggleHide(r.usuid)}
                            title={oculto ? "Mostrar" : "Ocultar"}
                            aria-label={oculto ? "Mostrar contraseña" : "Ocultar contraseña"}
                          >
                            <Icon name={oculto ? "eye" : "lock"} size={16} />
                          </button>
                          <button
                            type="button"
                            className="reveal-pass__icon-btn"
                            onClick={() => copiar(r.password)}
                            title="Copiar"
                            aria-label="Copiar contraseña"
                          >
                            <Icon name="copy" size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="reveal-pass__passrow reveal-pass__passrow--error">
                          <Icon name="alertCircle" size={15} />
                          <span>No se pudo descifrar (formato no compatible).</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <footer className="appt-modal__footer">
          <button type="button" className="appt-modal__cancel" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
