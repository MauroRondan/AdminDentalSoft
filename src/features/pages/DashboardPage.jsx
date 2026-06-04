import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import { SESSION_KEY } from "../../config/constants";
import { get } from "../../utils/storage";
import { listPlanes } from "../../services/planService";
import { listModulos } from "../../services/moduloService";

const firstName = (fullName = "") => fullName.trim().split(/\s+/)[0] || "";

export default function DashboardPage() {
  const session = get(SESSION_KEY);
  const [stats, setStats] = useState({ planes: null, modulos: null });

  const load = useCallback(async () => {
    try {
      const [planes, modulos] = await Promise.all([
        listPlanes({ page: 1, size: 1 }),
        listModulos({ page: 1, size: 1 }),
      ]);
      setStats({
        planes: planes?.total ?? 0,
        modulos: modulos?.total ?? 0,
      });
    } catch (err) {
      // El backend /admin todavía puede no existir: mostramos guiones, sin romper.
      toast.error(err.message || "No se pudieron cargar las métricas");
      setStats({ planes: "—", modulos: "—" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <section className="welcome-card">
        <h1 className="welcome-card__title">
          Hola{session?.nombre ? `, ${firstName(session.nombre)}` : ""} 👋
        </h1>
        <p className="welcome-card__text">
          Este es el panel de administración de licencias de DentalSoft. Desde acá
          definís los <strong>planes</strong> y sus precios, y el catálogo de
          <strong> módulos</strong> que se venden de forma modular y mensual.
        </p>
      </section>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__icon">
            <Icon name="tag" size={22} />
          </span>
          <div>
            <div className="stat-card__value">{stats.planes ?? "…"}</div>
            <div className="stat-card__label">Planes definidos</div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card__icon">
            <Icon name="layers" size={22} />
          </span>
          <div>
            <div className="stat-card__value">{stats.modulos ?? "…"}</div>
            <div className="stat-card__label">Módulos en el catálogo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
