import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import RowMenu from "../../components/RowMenu";
import Pagination from "../../components/Pagination";
import ModuloModal from "../../components/ModuloModal";
import useFitRows from "../../hooks/useFitRows";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { formatMoney } from "../../utils/format";
import {
  listModulos,
  createModulo,
  updateModulo,
  deleteModulo,
  inicializarModulosDefault,
} from "../../services/moduloService";

export default function ModulosPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);
  const PAGE_SIZE = useFitRows(scrollRef);

  const fetchPage = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listModulos({
        search: search || undefined,
        page,
        size: PAGE_SIZE,
      });
      setRows(data?.data ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      toast.error(err.message || "Error al cargar los módulos");
      setRows([]);
      setTotal(0);
    } finally {
      ocultarLoader();
    }
  }, [search, page, PAGE_SIZE]);

  useEffect(() => {
    const id = setTimeout(fetchPage, 300);
    return () => clearTimeout(id);
  }, [fetchPage]);

  const openNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (modulo) => {
    setEditing(modulo);
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
        await updateModulo(editing.modid, payload);
        toast.success("Módulo actualizado");
      } else {
        await createModulo(payload);
        toast.success("Módulo creado");
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

  const remove = async (modulo) => {
    cargarLoader();
    try {
      await deleteModulo(modulo.modid);
      toast.success(`"${modulo.modnom}" desactivado`);
      await fetchPage();
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const seedDefaults = async () => {
    cargarLoader();
    try {
      await inicializarModulosDefault();
      toast.success("Catálogo base de módulos inicializado");
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
          <h1 className="page__title">Módulos</h1>
          <p className="page__subtitle">
            Catálogo de funcionalidades del ERP que componen los planes
          </p>
        </div>
        <div className="page__head-actions">
          <button className="page__ghost" onClick={seedDefaults}>
            <Icon name="sparkles" size={18} /> Inicializar catálogo
          </button>
          <button className="page__new" onClick={openNew}>
            <Icon name="plus" size={18} /> Nuevo módulo
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
      </div>

      <div className="table-card">
        <div className="table-scroll" ref={scrollRef}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Código</th>
                <th>Precio mensual</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="data-table__empty">
                    No hay módulos cargados todavía. Usá “Inicializar catálogo” o
                    creá uno nuevo.
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.modid}>
                    <td data-label="Módulo">
                      <span className="cell-name">
                        <span className="cell-name__avatar">
                          <Icon name="layers" size={16} />
                        </span>
                        <span>
                          {m.modnom}
                          {m.moddesc && (
                            <small style={{ display: "block", color: "var(--color-text-tertiary)", fontWeight: 400 }}>
                              {m.moddesc}
                            </small>
                          )}
                        </span>
                      </span>
                    </td>
                    <td data-label="Código">
                      <span className="cell-code">{m.modcodigo}</span>
                    </td>
                    <td data-label="Precio mensual" className="cell-money">
                      {formatMoney(m.modprecio)}
                    </td>
                    <td data-label="Tipo">
                      {m.modesencial ? (
                        <span className="badge badge--primary">Esencial</span>
                      ) : (
                        <span className="badge badge--accent">Opcional</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      <span className={`badge badge--${m.modest ? "on" : "off"}`}>
                        {m.modest ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <RowMenu
                        items={[
                          { label: "Editar", icon: "edit", onClick: () => openEdit(m) },
                          { label: "Desactivar", icon: "trash", danger: true, onClick: () => remove(m) },
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

      <ModuloModal
        open={showModal}
        onClose={closeModal}
        onSave={save}
        initial={editing}
        saving={saving}
      />
    </div>
  );
}
