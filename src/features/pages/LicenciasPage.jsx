import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import RowMenu from "../../components/RowMenu";
import Pagination from "../../components/Pagination";
import LicenciaPlanModal from "../../components/LicenciaPlanModal";
import LicenciaAddonsModal from "../../components/LicenciaAddonsModal";
import useFitRows from "../../hooks/useFitRows";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import {
  listLicencias,
  getLicencia,
  asignarPlan,
  cambiarEstadoLicencia,
} from "../../services/licenciaService";
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
  const [planModal, setPlanModal] = useState({ open: false, licencia: null });
  const [addonsModal, setAddonsModal] = useState({ open: false, licencia: null });
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);
  const PAGE_SIZE = useFitRows(scrollRef);

  const fetchPage = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listLicencias({
        search: filters.search || undefined,
        estado: filters.estado === "" ? undefined : filters.estado === "true",
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

  const openPlan = (lic) => setPlanModal({ open: true, licencia: lic });
  const closePlan = () => !saving && setPlanModal({ open: false, licencia: null });

  const savePlan = async (planid) => {
    cargarLoader();
    setSaving(true);
    try {
      await asignarPlan(planModal.licencia.licid, planid);
      toast.success("Plan asignado");
      setPlanModal({ open: false, licencia: null });
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

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Licencias</h1>
          <p className="page__subtitle">Clínicas suscriptas al ERP: plan, estado y add-ons</p>
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
                  <tr key={l.licid}>
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
                    </td>
                    <td>
                      <RowMenu
                        items={[
                          { label: "Asignar plan", icon: "tag", onClick: () => openPlan(l) },
                          { label: "Add-ons", icon: "layers", onClick: () => openAddons(l) },
                          {
                            label: l.licestado === false ? "Reactivar" : "Suspender",
                            icon: "power",
                            danger: l.licestado !== false,
                            onClick: () => toggleEstado(l),
                          },
                        ]}
                      />
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
    </div>
  );
}
