import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import AccionesModal from "../../components/AccionesModal";
import Pagination from "../../components/Pagination";
import LicenciaPlanModal from "../../components/LicenciaPlanModal";
import LicenciaAddonsModal from "../../components/LicenciaAddonsModal";
import LicenciaLimitesModal from "../../components/LicenciaLimitesModal";
import LicenciaDetalleModal from "../../components/LicenciaDetalleModal";
import LicenciaWhatsAppModal from "../../components/LicenciaWhatsAppModal";
import LicenciaPlanMensajeModal from "../../components/LicenciaPlanMensajeModal";
import NuevaLicenciaModal from "../../components/NuevaLicenciaModal";
import QRTrialModal from "../../components/QRTrialModal";
import useFitRows from "../../hooks/useFitRows";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import {
  listLicencias,
  getLicencia,
  crearLicencia,
  updateLicencia,
  asignarPlan,
  cambiarEstadoLicencia,
  convertirLicencia,
  extenderTrial,
} from "../../services/licenciaService";

// Días que faltan para que venza un trial (negativo = ya venció).
const trialDays = (fin) => {
  if (!fin) return null;
  const hoy = new Date();
  const f = new Date(`${fin}T00:00:00`);
  return Math.ceil((f - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000);
};
import { listPlanes } from "../../services/planService";
import { listModulosActivos } from "../../services/moduloService";

const INITIAL_FILTERS = { search: "", estado: "" };

export default function LicenciasPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [planes, setPlanes] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [planModal, setPlanModal] = useState({ open: false, licencia: null, mode: "assign" });
  const [addonsModal, setAddonsModal] = useState({ open: false, licencia: null });
  const [limitesModal, setLimitesModal] = useState({ open: false, licencia: null });
  const [whatsappModal, setWhatsappModal] = useState({ open: false, licencia: null });
  const [planMsjModal, setPlanMsjModal] = useState({ open: false, licencia: null });
  const [detalle, setDetalle] = useState({ open: false, licencia: null, mode: "view" });
  const [newOpen, setNewOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accionesFor, setAccionesFor] = useState(null);

  const accionesDe = (l) => [
    { label: "Ver detalle", icon: "eye", onClick: () => openVer(l) },
    { label: "Editar datos", icon: "edit", onClick: () => openEditar(l) },
    ...(l.lictrialfin
      ? [
          { label: "Convertir a pago", icon: "check", onClick: () => openConvert(l) },
          { label: "Extender prueba 15 días", icon: "sparkles", onClick: () => extender(l, 15) },
        ]
      : []),
    { label: "Asignar plan", icon: "tag", onClick: () => openPlan(l) },
    { label: "Cupos", icon: "circleUser", onClick: () => setLimitesModal({ open: true, licencia: l }) },
    { label: "Add-ons", icon: "layers", onClick: () => openAddons(l) },
    { label: "WhatsApp", icon: "settings", onClick: () => setWhatsappModal({ open: true, licencia: l }) },
    { label: "Plan de mensajes", icon: "wallet", onClick: () => setPlanMsjModal({ open: true, licencia: l }) },
    {
      label: l.licestado === false ? "Reactivar" : "Suspender",
      icon: "power",
      danger: l.licestado !== false,
      onClick: () => toggleEstado(l),
    },
  ];

  const scrollRef = useRef(null);
  const PAGE_SIZE = useFitRows(scrollRef);

  const fetchPage = useCallback(async () => {
    cargarLoader();
    try {
      const esTrialFilter = filters.estado === "trial";
      const data = await listLicencias({
        search: filters.search || undefined,
        estado: filters.estado === "" || esTrialFilter ? undefined : filters.estado === "true",
        trial: esTrialFilter ? true : undefined,
        page,
        size: PAGE_SIZE,
      });
      setRows(data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      toast.error(err.message || "Error al cargar las licencias");
      setRows([]);
      setTotal(0);
    } finally {
      ocultarLoader();
    }
  }, [filters, page, PAGE_SIZE]);

  useEffect(() => {
    const id = setTimeout(fetchPage, 300);
    return () => clearTimeout(id);
  }, [fetchPage]);

  // Catálogos auxiliares (planes activos + módulos activos) para los modales.
  useEffect(() => {
    Promise.all([listPlanes({ estado: true, page: 1, size: 100 }), listModulosActivos()])
      .then(([pl, mods]) => {
        setPlanes(pl?.data ?? []);
        setModulos(mods ?? []);
      })
      .catch(() => {});
  }, []);

  const openPlan = (lic) => setPlanModal({ open: true, licencia: lic, mode: "assign" });
  const openConvert = (lic) => setPlanModal({ open: true, licencia: lic, mode: "convert" });
  const closePlan = () => !saving && setPlanModal({ open: false, licencia: null, mode: "assign" });

  const savePlan = async (planid) => {
    cargarLoader();
    setSaving(true);
    try {
      if (planModal.mode === "convert") {
        await convertirLicencia(planModal.licencia.licid, planid);
        toast.success("Prueba convertida a suscripción");
      } else {
        await asignarPlan(planModal.licencia.licid, planid);
        toast.success("Plan asignado");
      }
      setPlanModal({ open: false, licencia: null, mode: "assign" });
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const extender = async (lic, dias = 15) => {
    cargarLoader();
    try {
      await extenderTrial(lic.licid, dias);
      toast.success(`Prueba extendida ${dias} días`);
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const openVer = (lic) => setDetalle({ open: true, licencia: lic, mode: "view" });
  const openEditar = (lic) => setDetalle({ open: true, licencia: lic, mode: "edit" });
  const closeDetalle = () => !saving && setDetalle({ open: false, licencia: null, mode: "view" });

  const guardarDatos = async (payload) => {
    cargarLoader();
    setSaving(true);
    try {
      await updateLicencia(detalle.licencia.licid, payload);
      toast.success("Licencia actualizada");
      setDetalle({ open: false, licencia: null, mode: "view" });
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const openAddons = async (lic) => {
    cargarLoader();
    try {
      const detail = await getLicencia(lic.licid);
      setAddonsModal({ open: true, licencia: detail });
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const toggleEstado = async (lic) => {
    cargarLoader();
    try {
      await cambiarEstadoLicencia(lic.licid, !lic.licestado);
      toast.success(lic.licestado ? "Licencia suspendida" : "Licencia reactivada");
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const crear = async (payload) => {
    cargarLoader();
    setSaving(true);
    try {
      await crearLicencia(payload);
      toast.success("Licencia creada");
      setNewOpen(false);
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Licencias</h1>
          <p className="page__subtitle">Clínicas suscriptas al ERP: plan, estado y add-ons</p>
        </div>
        <div className="page__head-actions">
          <button className="page__new page__new--ghost" onClick={() => setQrOpen(true)}>
            <Icon name="sparkles" size={18} /> QR de prueba
          </button>
          <button className="page__new" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={18} /> Nueva licencia
          </button>
        </div>
      </header>

      <div className="page__filters">
        <div className="filter filter--search">
          <Icon name="search" size={16} className="filter__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUC…"
            value={filters.search}
            onChange={(e) => {
              setFilters((p) => ({ ...p, search: e.target.value }));
              setPage(1);
            }}
          />
        </div>
        <select
          className="filter filter__control"
          value={filters.estado}
          onChange={(e) => {
            setFilters((p) => ({ ...p, estado: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Suspendidas</option>
          <option value="trial">En prueba</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-scroll" ref={scrollRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Clínica</th>
                <th>Plan</th>
                <th>Usuarios</th>
                <th>Add-ons</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="data-table__empty">
                    No hay licencias para mostrar.
                  </td>
                </tr>
              ) : (
                rows.map((l) => (
                  <tr
                    key={l.licid}
                    className="is-clickable"
                    onClick={() => setAccionesFor(l)}
                  >
                    <td data-label="Clínica">
                      <span className="cell-name">
                        <span className="cell-name__avatar">
                          <Icon name="building" size={16} />
                        </span>
                        <span>
                          {l.licnom || "—"}
                          {l.licruc && (
                            <small style={{ display: "block", color: "var(--color-text-tertiary)", fontWeight: 400 }}>
                              RUC {l.licruc}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>
                    <td data-label="Plan">
                      {l.plannombre ? (
                        <span className="badge badge--primary">{l.plannombre}</span>
                      ) : (
                        <span className="badge badge--accent">Sin plan</span>
                      )}
                    </td>
                    <td data-label="Usuarios">{l.usuarios}</td>
                    <td data-label="Add-ons">{l.addonsActivos}</td>
                    <td data-label="Estado">
                      <span className={`badge badge--${l.licestado === false ? "off" : "on"}`}>
                        {l.licestado === false ? "Suspendida" : "Activa"}
                      </span>
                      {l.lictrialfin && (() => {
                        const td = trialDays(l.lictrialfin);
                        return (
                          <span
                            className={`badge badge--${td < 0 ? "off" : "accent"}`}
                            style={{ marginLeft: 6 }}
                            title={`Prueba hasta ${l.lictrialfin}`}
                          >
                            {td < 0 ? "Prueba vencida" : td === 0 ? "Prueba: último día" : `Prueba: ${td} día${td === 1 ? "" : "s"}`}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="data-table__chevron">
                      <Icon name="chevronRight" size={18} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      <LicenciaPlanModal
        open={planModal.open}
        onClose={closePlan}
        onSave={savePlan}
        licencia={planModal.licencia}
        planes={planes}
        saving={saving}
      />

      <LicenciaAddonsModal
        open={addonsModal.open}
        onClose={() => setAddonsModal({ open: false, licencia: null })}
        licencia={addonsModal.licencia}
        modulos={modulos}
        onChanged={fetchPage}
      />

      <LicenciaLimitesModal
        open={limitesModal.open}
        onClose={() => setLimitesModal({ open: false, licencia: null })}
        licencia={limitesModal.licencia}
        onChanged={fetchPage}
      />

      <LicenciaDetalleModal
        open={detalle.open}
        mode={detalle.mode}
        licencia={detalle.licencia}
        onClose={closeDetalle}
        onSave={guardarDatos}
        saving={saving}
      />

      <NuevaLicenciaModal
        open={newOpen}
        onClose={() => !saving && setNewOpen(false)}
        onSave={crear}
        planes={planes}
        saving={saving}
      />

      <LicenciaWhatsAppModal
        open={whatsappModal.open}
        onClose={() => setWhatsappModal({ open: false, licencia: null })}
        licencia={whatsappModal.licencia}
      />

      <LicenciaPlanMensajeModal
        open={planMsjModal.open}
        onClose={() => setPlanMsjModal({ open: false, licencia: null })}
        licencia={planMsjModal.licencia}
        onSaved={fetchPage}
      />

      <QRTrialModal open={qrOpen} onClose={() => setQrOpen(false)} />

      <AccionesModal
        open={Boolean(accionesFor)}
        onClose={() => setAccionesFor(null)}
        titulo={accionesFor?.licnom || "Licencia"}
        subtitulo={
          accionesFor?.licruc ? `RUC ${accionesFor.licruc}` : accionesFor?.plannombre
        }
        items={accionesFor ? accionesDe(accionesFor) : []}
      />
    </div>
  );
}
