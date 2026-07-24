import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import { getServidor } from "../../services/servidorService";

/** GB legibles a partir de bytes ("3,2 GB"). */
const gb = (bytes) =>
  bytes == null || bytes < 0 ? "—" : `${(bytes / 1024 ** 3).toFixed(1).replace(".", ",")} GB`;

/** MB para valores chicos (bases). */
const tam = (bytes) => {
  if (bytes == null || bytes < 0) return "—";
  if (bytes >= 1024 ** 3) return gb(bytes);
  return `${Math.round(bytes / 1024 ** 2)} MB`;
};

/** "3 días 4 h" a partir de ms. */
const uptime = (ms) => {
  if (!ms) return "—";
  const h = Math.floor(ms / 3_600_000);
  const dias = Math.floor(h / 24);
  return dias > 0 ? `${dias} día${dias === 1 ? "" : "s"} ${h % 24} h` : `${h} h ${Math.floor((ms % 3_600_000) / 60_000)} min`;
};

/** Color del gauge según el nivel de uso: normal / atención / crítico. */
const tono = (pct) => {
  if (pct >= 85) return "var(--color-error)";
  if (pct >= 70) return "var(--color-accent)";
  return "var(--color-primary)";
};

/** Gauge circular SVG (donut) con el % al centro. */
function Gauge({ pct, label, detalle }) {
  const p = Math.max(0, Math.min(100, pct ?? 0));
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div className="srv-gauge">
      <svg viewBox="0 0 130 130" className="srv-gauge__svg" role="img" aria-label={`${label}: ${p}%`}>
        <circle cx="65" cy="65" r={R} fill="none" stroke="var(--color-surface-alt)" strokeWidth="14" />
        <circle
          cx="65" cy="65" r={R} fill="none"
          stroke={tono(p)} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${(p / 100) * C} ${C}`}
          transform="rotate(-90 65 65)"
          className="srv-gauge__arco"
        />
        <text x="65" y="62" textAnchor="middle" className="srv-gauge__pct">{p}%</text>
        <text x="65" y="82" textAnchor="middle" className="srv-gauge__nombre">{label}</text>
      </svg>
      <span className="srv-gauge__detalle">{detalle}</span>
    </div>
  );
}

/** Curva de las últimas 24 h (SVG): CPU, RAM y disco superpuestos. */
function Historia({ historia }) {
  const puntos = historia ?? [];
  if (puntos.length < 2) {
    return (
      <p className="srv-historia__vacio">
        Todavía no hay historial suficiente — se junta una muestra por minuto desde
        que el backend arranca.
      </p>
    );
  }
  const W = 600, H = 160, PAD = 8;
  const x = (i) => PAD + (i * (W - PAD * 2)) / (puntos.length - 1);
  const y = (pct) => H - PAD - ((Math.max(0, Math.min(100, pct)) / 100) * (H - PAD * 2));
  const linea = (campo) => puntos.map((p, i) => `${x(i).toFixed(1)},${y(p[campo]).toFixed(1)}`).join(" ");
  const horaDe = (ts) => new Date(ts).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit", timeZone: "America/Asuncion" });
  const series = [
    { campo: "cpu", color: "var(--color-primary)", label: "CPU" },
    { campo: "ram", color: "var(--color-accent)", label: "RAM" },
    { campo: "disco", color: "var(--color-error)", label: "Disco" },
  ];
  return (
    <div className="srv-historia">
      <svg viewBox={`0 0 ${W} ${H}`} className="srv-historia__svg" preserveAspectRatio="none">
        {[25, 50, 75].map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={y(g)} y2={y(g)} stroke="var(--color-border)" strokeDasharray="4 6" strokeWidth="1" />
        ))}
        {series.map((s) => (
          <polyline key={s.campo} points={linea(s.campo)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
        ))}
      </svg>
      <div className="srv-historia__pie">
        <span>{horaDe(puntos[0].ts)}</span>
        <div className="srv-historia__leyenda">
          {series.map((s) => (
            <span key={s.campo} className="srv-historia__serie">
              <i style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
        <span>{horaDe(puntos[puntos.length - 1].ts)}</span>
      </div>
    </div>
  );
}

/**
 * Menú Servidor: salud del VPS de un vistazo — gauges de CPU/RAM/disco, curva de
 * 24 h, tamaño de las bases y JVM — para saber CUÁNDO ampliar el plan alquilado.
 * Se refresca solo cada 10 s mientras la pantalla está abierta.
 */
export default function ServidorPage() {
  const [d, setD] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async (silencioso = false) => {
    try {
      setD(await getServidor());
    } catch (err) {
      if (!silencioso) toast.error(err.message || "No se pudieron leer las métricas");
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(() => load(true), 10_000);
    return () => clearInterval(timer.current);
  }, [load]);

  // Consejo de capacidad: el pico sostenido define el upgrade, no un pico suelto.
  const consejo = (() => {
    if (!d) return null;
    const avisos = [];
    if (d.disco?.pct >= 85) avisos.push(`el disco está al ${d.disco.pct}% — ampliá el almacenamiento pronto`);
    if (d.ram?.pct >= 85) avisos.push(`la RAM está al ${d.ram.pct}% — considerá subir de plan`);
    if (d.cpu?.pct >= 85) avisos.push(`la CPU está al ${d.cpu.pct}% ahora mismo — mirá la curva: si es constante, hace falta más CPU`);
    if (!avisos.length) return { ok: true, texto: "Todo holgado: el plan actual del servidor alcanza y sobra." };
    return { ok: false, texto: `Atención: ${avisos.join("; ")}.` };
  })();

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Servidor</h1>
          <p className="page__subtitle">
            Salud del VPS en vivo — para saber cuándo ampliar el plan
          </p>
        </div>
      </header>

      {consejo && (
        <section className={`srv-consejo${consejo.ok ? "" : " srv-consejo--alerta"}`}>
          <Icon name={consejo.ok ? "dashboard" : "server"} size={18} />
          <span>{consejo.texto}</span>
        </section>
      )}

      <section className="srv-gauges">
        <Gauge
          pct={d?.cpu?.pct}
          label="CPU"
          detalle={d ? `${d.cpu.nucleos} núcleo${d.cpu.nucleos === 1 ? "" : "s"} · load ${d.cpu.loadAvg}` : "…"}
        />
        <Gauge
          pct={d?.ram?.pct}
          label="RAM"
          detalle={d ? `${gb(d.ram.usada)} de ${gb(d.ram.total)}` : "…"}
        />
        <Gauge
          pct={d?.disco?.pct}
          label="Disco"
          detalle={d ? `${gb(d.disco.usado)} de ${gb(d.disco.total)}` : "…"}
        />
      </section>

      <section className="srv-card">
        <h2 className="srv-card__titulo">Últimas 24 horas</h2>
        <Historia historia={d?.historia} />
      </section>

      <div className="srv-grid">
        <section className="srv-card">
          <h2 className="srv-card__titulo">Bases de datos</h2>
          {(d?.bases ?? []).map((b) => {
            const max = Math.max(...(d?.bases ?? []).map((x) => x.bytes || 0), 1);
            return (
              <div className="srv-base" key={b.nombre}>
                <div className="srv-base__fila">
                  <span className="srv-base__nombre">{b.nombre}</span>
                  <span className="srv-base__tam">{tam(b.bytes)}</span>
                </div>
                <div className="srv-base__barra">
                  <i style={{ width: `${Math.max(4, ((b.bytes || 0) * 100) / max)}%` }} />
                </div>
              </div>
            );
          })}
          {!d && <p className="srv-historia__vacio">…</p>}
        </section>

        <section className="srv-card">
          <h2 className="srv-card__titulo">Backend</h2>
          <dl className="srv-datos">
            <div><dt>Memoria del backend (heap)</dt><dd>{d ? `${gb(d.jvm.heapUsado)} de ${gb(d.jvm.heapMax)}` : "…"}</dd></div>
            <div><dt>Backend encendido hace</dt><dd>{d ? uptime(d.jvm.uptimeMs) : "…"}</dd></div>
            <div><dt>Servidor encendido hace</dt><dd>{d ? uptime(d.sistema.uptimeMs) : "…"}</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
