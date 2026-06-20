import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import RowMenu from "../../components/RowMenu";
import Pagination from "../../components/Pagination";
import VentaOrigenModal from "../../components/VentaOrigenModal";
import QRTrialModal from "../../components/QRTrialModal";
import useFitRows from "../../hooks/useFitRows";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import {
  listVentaOrigenes,
  createVentaOrigen,
  updateVentaOrigen,
  deleteVentaOrigen,
} from "../../services/ventaOrigenService";

const canalLabel = (c) => (c === "REDES" ? "Red social" : "Vendedor");

export default function VentaOrigenPage() {
  const [search, setSearch] = useState("");
  const [canal, setCanal] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [qrOrigen, setQrOrigen] = useState(null); // origen para el modal de QR

  const scrollRef = useRef(null);
  const PAGE_SIZE = useFitRows(scrollRef);

  const fetchPage = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listVentaOrigenes({
        search: search || undefined,
        canal: canal || undefined,
        page,
        size: PAGE_SIZE,
      });
      setRows(data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      toast.error(err.message || "Error al cargar los orígenes de venta");
      setRows([]);
      setTotal(0);
    } finally {
      ocultarLoader();
    }
  }, [search, canal, page, PAGE_SIZE]);

  useEffect(() => {
    const id = setTimeout(fetchPage, 300);
    return () => clearTimeout(id);
  }, [fetchPage]);

  const openNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (origen) => {
    setEditing(origen);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
  };

  const save = async (payload) => {
    cargarLoader();
    setSaving(true);
    try {
      if (editing) {
        await updateVentaOrigen(editing.vorid, payload);
        toast.success("Origen actualizado");
      } else {
        await createVentaOrigen(payload);
        toast.success("Origen creado");
      }
      setShowModal(false);
      setEditing(null);
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const remove = async (origen) => {
    cargarLoader();
    try {
      await deleteVentaOrigen(origen.vorid);
      toast.success(`"${origen.vornombre}" desactivado`);
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
          <h1 className="page__title">Orígenes de venta</h1>
          <p className="page__subtitle">
            Vendedores y redes para atribuir las pruebas que entran por QR
          </p>
        </div>
        <div className="page__head-actions">
          <button className="page__new" onClick={openNew}>
            <Icon name="plus" size={18} /> Nuevo origen
          </button>
        </div>
      </header>

      <div className="page__filters">
        <div className="filter filter--search">
          <Icon name="search" size={16} className="filter__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="filter filter__control"
          value={canal}
          onChange={(e) => {
            setCanal(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todos los canales</option>
          <option value="VENDEDOR">Vendedores</option>
          <option value="REDES">Redes sociales</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-scroll" ref={scrollRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Origen</th>
                <th>Canal</th>
                <th>Código (QR)</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="data-table__empty">
                    No hay orígenes cargados todavía. Creá tu primer vendedor o red
                    social para empezar a medir las ventas del QR.
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.vorid}>
                    <td data-label="Origen">
                      <span className="cell-name">
                        <span className="cell-name__avatar">
                          <Icon name={o.vorcanal === "REDES" ? "sparkles" : "circleUser"} size={16} />
                        </span>
                        <span>{o.vornombre}</span>
                      </span>
                    </td>
                    <td data-label="Canal">
                      <span className={`badge badge--${o.vorcanal === "REDES" ? "accent" : "primary"}`}>
                        {canalLabel(o.vorcanal)}
                      </span>
                    </td>
                    <td data-label="Código (QR)">
                      <span className="cell-code">{o.vorcodigo}</span>
                    </td>
                    <td data-label="Estado">
                      <span className={`badge badge--${o.vorest ? "on" : "off"}`}>
                        {o.vorest ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <RowMenu
                        items={[
                          { label: "Ver / descargar QR", icon: "eye", onClick: () => setQrOrigen(o) },
                          { label: "Editar", icon: "edit", onClick: () => openEdit(o) },
                          { label: "Desactivar", icon: "trash", danger: true, onClick: () => remove(o) },
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

      <VentaOrigenModal
        open={showModal}
        onClose={closeModal}
        onSave={save}
        initial={editing}
        saving={saving}
      />

      <QRTrialModal open={Boolean(qrOrigen)} origen={qrOrigen} onClose={() => setQrOrigen(null)} />
    </div>
  );
}
