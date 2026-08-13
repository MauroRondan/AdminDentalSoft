import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import WhatsAppConexionModal from "../../components/WhatsAppConexionModal";
import WhatsAppPlantillasModal from "../../components/WhatsAppPlantillasModal";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { listLicenciasConBot } from "../../services/whatsappService";

const ESTADO_BADGE = {
  ACTIVO: { cls: "badge--on", label: "Activo" },
  PAUSADO: { cls: "badge--off", label: "Pausado" },
  SANDBOX: { cls: "badge--off", label: "Sandbox" },
};

/**
 * Módulo WhatsApp del ADM: las odontologías con el BOT habilitado (módulo WHATSAPP en
 * su plan o add-on). Desde acá se da de alta la conexión (token de Meta) y se asigna
 * el plan de mensajes — la clínica no carga nada, solo ve su consumo en el ERP.
 */
export default function WhatsAppAdminPage() {
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState({ open: false, licencia: null });
  const [pickerOpen, setPickerOpen] = useState(false);
  // Plantillas: son de la WABA (genéricas), no de cada clínica — por eso viven acá.
  const [plantillasOpen, setPlantillasOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listLicenciasConBot();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Error al cargar las clínicas con bot");
      setRows([]);
    } finally {
      ocultarLoader();
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const abrir = (l) => setModal({ open: true, licencia: l });

  const sinConectar = rows.filter((r) => !r.conectada);

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">WhatsApp</h1>
          <p className="page__subtitle">
            Odontologías con el bot habilitado: conexión con Meta, plan de mensajes y plantillas
          </p>
        </div>
        <div className="page__head-actions">
          <button className="page__new page__new--ghost" onClick={() => setPlantillasOpen(true)}>
            <Icon name="fileCheck" size={18} /> Plantillas
          </button>
          <button className="page__new" onClick={() => setPickerOpen(true)}>
            <Icon name="plus" size={18} /> Conectar clínica
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="table-card">
          <p className="data-table__empty">
            Ninguna licencia tiene el módulo WhatsApp/Bot todavía. Asignales un plan con bot
            (o el add-on WhatsApp) desde Licencias y van a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Clínica</th>
                <th>Plan</th>
                <th>Plan de mensajes</th>
                <th>Número</th>
                <th>Conexión</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const est = r.conectada
                  ? ESTADO_BADGE[r.estadoConexion] || ESTADO_BADGE.ACTIVO
                  : { cls: "badge--off", label: "Sin conectar" };
                return (
                  <tr key={r.licid} onClick={() => abrir(r)} style={{ cursor: "pointer" }}>
                    <td style={{ fontWeight: 700 }}>{r.licnom}</td>
                    <td>{r.plan || "—"}</td>
                    <td>
                      {r.planMensaje
                        ? `${r.planMensaje} (${Number(r.planMensajeCupo).toLocaleString("es-PY")})`
                        : "—"}
                    </td>
                    <td>{r.numero || "—"}</td>
                    <td><span className={`badge ${est.cls}`}>{est.label}</span></td>
                    <td style={{ textAlign: "right" }}><Icon name="chevronRight" size={16} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Picker del alta: elegí a cuál clínica conectarle el WhatsApp. */}
      {pickerOpen && (
        <div className="modal-overlay modal-overlay--open" onClick={() => setPickerOpen(false)}>
          <div className="modal-card modal-card--md" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header className="appt-modal__header">
              <div>
                <h2 className="appt-modal__title">Conectar clínica</h2>
                <p className="appt-modal__subtitle">Elegí la odontología a la que le vas a cargar el WhatsApp</p>
              </div>
              <button type="button" className="appt-modal__close" onClick={() => setPickerOpen(false)} aria-label="Cerrar">
                <Icon name="x" size={20} />
              </button>
            </header>
            <div className="appt-modal__body">
              {sinConectar.length === 0 && (
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                  Todas las clínicas con bot ya están conectadas. Tocá una fila de la lista para editarla.
                </p>
              )}
              <div className="module-picker">
                {sinConectar.map((r) => (
                  <button
                    type="button"
                    key={r.licid}
                    className="module-option"
                    onClick={() => {
                      setPickerOpen(false);
                      abrir(r);
                    }}
                  >
                    <span className="module-option__info">
                      <span className="module-option__name">{r.licnom}</span>
                      <span className="module-option__meta">{r.plan || "Sin plan"}</span>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <WhatsAppPlantillasModal open={plantillasOpen} onClose={() => setPlantillasOpen(false)} />

      <WhatsAppConexionModal
        open={modal.open}
        onClose={() => setModal({ open: false, licencia: null })}
        licencia={modal.licencia}
        onSaved={fetchAll}
      />
    </div>
  );
}
