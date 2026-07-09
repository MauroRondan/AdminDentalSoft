import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../../components/icons";
import EdicionBrandingModal from "../../components/EdicionBrandingModal";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import { listEdiciones, updateEdicionBranding } from "../../services/licenciaService";

// Ediciones comerciales del SaaS: cada una define su marca/dominio/logo/color (branding
// data-driven). Acá el SA edita ese branding sin tocar SQL. Sprint 47b.
export default function EdicionesPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    cargarLoader();
    try {
      const data = await listEdiciones();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || "Error al cargar las ediciones");
      setRows([]);
    } finally {
      ocultarLoader();
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (payload) => {
    if (!editing) return;
    cargarLoader();
    setSaving(true);
    try {
      await updateEdicionBranding(editing.ediid, payload);
      toast.success("Marca actualizada");
      setEditing(null);
      await fetch();
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
          <h1 className="page__title">Ediciones</h1>
          <p className="page__subtitle">
            Cada edición es un producto (odontología, clínica general…) con su propia marca y dominio.
          </p>
        </div>
      </header>

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Edición</th>
                <th>Código</th>
                <th>Marca</th>
                <th>Dominio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="data-table__empty">No hay ediciones cargadas.</td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.ediid}>
                    <td data-label="Edición">{e.edinom}</td>
                    <td data-label="Código"><span className="cell-code">{e.edicodigo}</span></td>
                    <td data-label="Marca">{e.edimarca || "—"}</td>
                    <td data-label="Dominio">{e.edidominio || <span style={{ color: "#94a3b8" }}>sin dominio</span>}</td>
                    <td>
                      <button className="page__new" onClick={() => setEditing(e)}>
                        <Icon name="edit" size={16} /> Marca
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EdicionBrandingModal
        open={Boolean(editing)}
        edicion={editing}
        onClose={() => (saving ? null : setEditing(null))}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}
