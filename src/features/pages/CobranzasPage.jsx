import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import AccionesModal from "../../components/AccionesModal";
import Pagination from "../../components/Pagination";
import RegistrarPagoModal from "../../components/RegistrarPagoModal";
import GenerarFacturacionModal from "../../components/GenerarFacturacionModal";
import ConfigCobranzaModal from "../../components/ConfigCobranzaModal";
import useFitRows from "../../hooks/useFitRows";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { formatMoney } from "../../utils/format";
import {
  listFacturas,
  generarFacturacion,
  registrarPago,
  anularFactura,
  getConfigCobranza,
  updateConfigCobranza,
} from "../../services/facturacionService";

const ESTADO_BADGE = { PENDIENTE: "accent", PAGADA: "on", ANULADA: "off" };

export default function CobranzasPage() {
  const [filters, setFilters] = useState({ estado: "", soloVencidas: false, periodo: "" });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagoModal, setPagoModal] = useState({ open: false, factura: null });
  const [generarOpen, setGenerarOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [accionesFor, setAccionesFor] = useState(null);

  // Solo las facturas pendientes tienen acciones disponibles.
  const accionesDe = (f) => [
    {
      label: "Registrar pago",
      icon: "check",
      onClick: () => setPagoModal({ open: true, factura: f }),
    },
    { label: "Anular", icon: "trash", danger: true, onClick: () => anular(f) },
  ];

  const scrollRef = useRef(null);
  const PAGE_SIZE = useFitRows(scrollRef);

  const fetchPage = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listFacturas({
        estado: filters.estado || undefined,
        soloVencidas: filters.soloVencidas || undefined,
        periodo: filters.periodo || undefined,
        page,
        size: PAGE_SIZE,
      });
      setRows(data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      toast.error(err.message || "Error al cargar la cobranza");
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

  useEffect(() => {
    getConfigCobranza().then(setConfig).catch(() => {});
  }, []);

  const generar = async (periodo) => {
    cargarLoader();
    setSaving(true);
    try {
      const res = await generarFacturacion(periodo);
      toast.success(res?.mensaje || "Facturación generada");
      setGenerarOpen(false);
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const pagar = async (payload) => {
    cargarLoader();
    setSaving(true);
    try {
      await registrarPago(pagoModal.factura.flcid, payload);
      toast.success("Pago registrado");
      setPagoModal({ open: false, factura: null });
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const anular = async (f) => {
    cargarLoader();
    try {
      await anularFactura(f.flcid);
      toast.success("Factura anulada");
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const guardarConfig = async (payload) => {
    cargarLoader();
    setSaving(true);
    try {
      const c = await updateConfigCobranza(payload);
      setConfig(c);
      toast.success("Configuración guardada");
      setConfigOpen(false);
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
          <h1 className="page__title">Cobranzas</h1>
          <p className="page__subtitle">Cuotas mensuales de las clínicas suscriptas</p>
        </div>
        <div className="page__head-actions">
          <button className="page__ghost" onClick={() => setConfigOpen(true)}>
            <Icon name="settings" size={18} /> Configuración
          </button>
          <button className="page__new" onClick={() => setGenerarOpen(true)}>
            <Icon name="plus" size={18} /> Generar facturación
          </button>
        </div>
      </header>

      <div className="page__filters">
        <input
          type="month"
          className="filter filter__control"
          value={filters.periodo}
          onChange={(e) => {
            setFilters((p) => ({ ...p, periodo: e.target.value }));
            setPage(1);
          }}
        />
        <select
          className="filter filter__control"
          value={filters.estado}
          onChange={(e) => {
            setFilters((p) => ({ ...p, estado: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PAGADA">Pagadas</option>
          <option value="ANULADA">Anuladas</option>
        </select>
        <button
          type="button"
          className={`chip${filters.soloVencidas ? " chip--active" : ""}`}
          onClick={() => {
            setFilters((p) => ({ ...p, soloVencidas: !p.soloVencidas }));
            setPage(1);
          }}
        >
          Solo vencidas
        </button>
      </div>

      <div className="table-card">
        <div className="table-scroll" ref={scrollRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Clínica</th>
                <th>Período</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="data-table__empty">
                    No hay facturas. Usá “Generar facturación” para crear las cuotas del mes.
                  </td>
                </tr>
              ) : (
                rows.map((f) => {
                  const accionable = f.flcestado === "PENDIENTE";
                  return (
                  <tr
                    key={f.flcid}
                    className={accionable ? "is-clickable" : undefined}
                    onClick={accionable ? () => setAccionesFor(f) : undefined}
                  >
                    <td data-label="Clínica">
                      <span className="cell-name">
                        <span className="cell-name__avatar">
                          <Icon name="building" size={16} />
                        </span>
                        {f.licnom || `Lic. ${f.flclicid}`}
                      </span>
                    </td>
                    <td data-label="Período">
                      <span className="cell-code">{f.flcperiodo}</span>
                    </td>
                    <td data-label="Monto" className="cell-money">{formatMoney(f.flcmonto)}</td>
                    <td data-label="Vencimiento">{f.flcfecvenc || "—"}</td>
                    <td data-label="Estado">
                      <span className={`badge badge--${ESTADO_BADGE[f.flcestado] || "accent"}`}>
                        {f.flcestado === "PENDIENTE" ? "Pendiente" : f.flcestado === "PAGADA" ? "Pagada" : "Anulada"}
                      </span>
                      {f.vencida && (
                        <span className="badge badge--off" style={{ marginLeft: ".4rem" }}>
                          Vencida
                        </span>
                      )}
                    </td>
                    <td className="data-table__chevron">
                      {accionable && <Icon name="chevronRight" size={18} />}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      <RegistrarPagoModal
        open={pagoModal.open}
        onClose={() => !saving && setPagoModal({ open: false, factura: null })}
        onSave={pagar}
        factura={pagoModal.factura}
        saving={saving}
      />

      <GenerarFacturacionModal
        open={generarOpen}
        onClose={() => !saving && setGenerarOpen(false)}
        onSave={generar}
        saving={saving}
      />

      <ConfigCobranzaModal
        open={configOpen}
        onClose={() => !saving && setConfigOpen(false)}
        onSave={guardarConfig}
        config={config}
        saving={saving}
      />

      <AccionesModal
        open={Boolean(accionesFor)}
        onClose={() => setAccionesFor(null)}
        titulo={accionesFor?.licnom || (accionesFor ? `Lic. ${accionesFor.flclicid}` : "Factura")}
        subtitulo={
          accionesFor
            ? `Período ${accionesFor.flcperiodo} · ${formatMoney(accionesFor.flcmonto)}`
            : undefined
        }
        items={accionesFor ? accionesDe(accionesFor) : []}
      />
    </div>
  );
}
