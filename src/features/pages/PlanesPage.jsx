import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import PlanModal from "../../components/PlanModal";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { formatMoney } from "../../utils/format";
import {
  listPlanes,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getRecursosLimite,
} from "../../services/planService";
import { listModulosActivos } from "../../services/moduloService";
import { listPlanesMensaje } from "../../services/planMensajeService";

const periodoLabel = (p) => (p === "ANUAL" ? "/año" : "/mes");

const modIdsOf = (modulos) =>
  (modulos ?? []).map((m) => (typeof m === "object" ? m.modid : m));

export default function PlanesPage() {
  const [planes, setPlanes] = useState([]);
  const [planesMensaje, setPlanesMensaje] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const modulosById = useMemo(() => {
    const map = new Map();
    modulos.forEach((m) => map.set(m.modid, m));
    return map;
  }, [modulos]);

  const recursoLabel = useMemo(() => {
    const map = new Map();
    recursos.forEach((r) => map.set(r.recurso, r.etiqueta));
    return map;
  }, [recursos]);

  const renderCupos = (plan) => {
    const limites = plan.limites ?? {};
    const entries = Object.entries(limites);
    if (!entries.length) {
      return <li className="plan-card__cupo plan-card__cupo--empty">Cupos ilimitados</li>;
    }
    return entries.map(([recurso, valor]) => (
      <li key={recurso} className="plan-card__cupo">
        <Icon name="circleUser" size={14} />
        <span>
          {recursoLabel.get(recurso) ?? recurso}:{" "}
          <strong>{valor == null ? "∞" : valor}</strong>
        </span>
      </li>
    ));
  };

  const fetchAll = useCallback(async () => {
    cargarLoader();
    try {
      const [planesRes, modsRes, recsRes, msjRes] = await Promise.all([
        listPlanes({ page: 1, size: 100 }),
        listModulosActivos(),
        getRecursosLimite().catch(() => []),
        listPlanesMensaje().catch(() => []),
      ]);
      setPlanes(planesRes?.data ?? []);
      setModulos(modsRes ?? []);
      setRecursos(recsRes ?? []);
      setPlanesMensaje(msjRes ?? []);
    } catch (err) {
      toast.error(err.message || "Error al cargar los planes");
      setPlanes([]);
    } finally {
      ocultarLoader();
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = async (plan) => {
    cargarLoader();
    try {
      // Traemos el detalle para asegurar la lista de módulos incluidos.
      const detail = await getPlan(plan.plnid).catch(() => plan);
      setEditing(detail || plan);
      setShowModal(true);
    } finally {
      ocultarLoader();
    }
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
        await updatePlan(editing.plnid, payload);
        toast.success("Plan actualizado");
      } else {
        await createPlan(payload);
        toast.success("Plan creado");
      }
      setShowModal(false);
      setEditing(null);
      await fetchAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      ocultarLoader();
    }
  };

  const remove = async (plan) => {
    cargarLoader();
    try {
      await deletePlan(plan.plnid);
      toast.success(`Plan "${plan.plnnom}" desactivado`);
      await fetchAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      ocultarLoader();
    }
  };

  const renderModulos = (plan) => {
    const ids = modIdsOf(plan.modulos);
    if (!ids.length) {
      return <li className="plan-card__module-empty">Sin módulos asignados</li>;
    }
    return ids.map((id) => {
      const mod = modulosById.get(id);
      const nombre = mod?.modnom || (typeof id === "object" ? id.modnom : `Módulo ${id}`);
      return (
        <li key={id?.modid ?? id} className="plan-card__module">
          <Icon name="check" size={15} />
          <span>{nombre}</span>
        </li>
      );
    });
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Planes</h1>
          <p className="page__subtitle">
            Paquetes de suscripción que ofrecés a las clínicas (modular y mensual)
          </p>
        </div>
        <div className="page__head-actions">
          <button className="page__new" onClick={openNew}>
            <Icon name="plus" size={18} /> Nuevo plan
          </button>
        </div>
      </header>

      {planes.length === 0 ? (
        <div className="table-card">
          <p className="data-table__empty">
            Todavía no definiste planes. Creá tu primer plan (ej. Básico, Pro,
            Premium) y elegí qué módulos incluye.
          </p>
        </div>
      ) : (
        <div className="plan-grid">
          {planes.map((p) => (
            <article
              key={p.plnid}
              className={`plan-card${p.plndestacado ? " plan-card--featured" : ""}${
                p.plnest ? "" : " plan-card--inactive"
              }`}
            >
              {p.plndestacado && (
                <span className="plan-card__ribbon">
                  <Icon name="star" size={13} /> Recomendado
                </span>
              )}

              <div className="plan-card__head">
                <h2 className="plan-card__name">{p.plnnom}</h2>
                <p className="plan-card__desc">{p.plndesc || ""}</p>
              </div>

              <div className="plan-card__price">
                <span className="plan-card__amount">{formatMoney(p.plnprecio)}</span>
                <span className="plan-card__period">{periodoLabel(p.plnperiodo)}</span>
              </div>

              <div className="plan-card__meta">
                <span className="cell-code">{p.plncodigo}</span>
                {!p.plnest && <span className="badge badge--off">Inactivo</span>}
              </div>

              <span className="plan-card__section-label">Cupos de uso</span>
              <ul className="plan-card__cupos">{renderCupos(p)}</ul>

              <span className="plan-card__section-label">Módulos incluidos</span>
              <ul className="plan-card__modules">{renderModulos(p)}</ul>

              <div className="plan-card__actions">
                <button className="plan-card__btn" onClick={() => openEdit(p)}>
                  <Icon name="edit" size={15} /> Editar
                </button>
                <button
                  className="plan-card__btn plan-card__btn--danger"
                  onClick={() => remove(p)}
                >
                  <Icon name="trash" size={15} /> Desactivar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Planes de MENSAJES de WhatsApp (Sprint 85): catálogo con cupo, costo Meta y
          precio final. Se asignan por licencia desde Licencias → "Plan de mensajes",
          solo a planes con el módulo Bot habilitado. */}
      {planesMensaje.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <header className="page__header" style={{ marginBottom: "0.75rem" }}>
            <div>
              <h2 className="page__title" style={{ fontSize: "1.15rem" }}>Planes de mensajes · WhatsApp</h2>
              <p className="page__subtitle">
                Cupos de mensajería del bot por mes. La ganancia entra al ingreso mensual; el costo
                es lo que le pagás a Meta. Se asignan desde Licencias → “Plan de mensajes”.
              </p>
            </div>
          </header>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Agendan con bot</th>
                  <th>Recordatorios</th>
                  <th>Iniciás vos</th>
                  <th>Costo Meta/mes</th>
                  <th>Precio final/mes</th>
                  <th>Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {planesMensaje.map((p) => (
                  <tr key={p.pmsid}>
                    <td style={{ fontWeight: 700 }}>{p.nombre}</td>
                    <td>{Number(p.cupo).toLocaleString("es-PY")}</td>
                    <td>{Number(p.cupo).toLocaleString("es-PY")}</td>
                    <td>{Number(p.cupo).toLocaleString("es-PY")}</td>
                    <td>{formatMoney(p.costo)}</td>
                    <td style={{ fontWeight: 700 }}>{formatMoney(p.precio)}</td>
                    <td style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                      {formatMoney(p.ganancia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PlanModal
        open={showModal}
        onClose={closeModal}
        onSave={save}
        initial={editing}
        modulosDisponibles={modulos}
        recursosDisponibles={recursos}
        saving={saving}
      />
    </div>
  );
}
