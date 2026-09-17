import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Modules.css";

type ExportItem = {
  id: string;
  type_fichier?: string | null;
  fichier_url?: string | null;
  nom_fichier?: string | null;
  created_at?: string | null;
  version?: string | null;
};

function extract<T>(data: T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function ExportsPage() {
  const [items, setItems] = useState<ExportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/fichiers/");
        setItems(extract<ExportItem>(response.data));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger l'historique des exports.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="module-page-v3">
      <header className="module-v3-header">
        <div>
          <h1>Exports</h1>
          <p>Historique des documents PDF et Word générés</p>
        </div>
      </header>

      {error && <div className="module-v3-error">{error}</div>}

      <section className="module-v3-card">
        {loading ? (
          <div className="module-v3-loading">Chargement...</div>
        ) : (
          <table className="module-v3-table">
            <thead>
              <tr>
                <th>Nom du fichier</th>
                <th>Type</th>
                <th>Version</th>
                <th>Date</th>
                <th>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="module-v3-name">{item.nom_fichier || "—"}</td>
                  <td>
                    <span className="module-v3-badge">{item.type_fichier || "—"}</span>
                  </td>
                  <td>{item.version || "—"}</td>
                  <td>{item.created_at || "—"}</td>
                  <td>
                    {item.fichier_url ? (
                      <a href={item.fichier_url} target="_blank" rel="noreferrer">
                        Télécharger
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="module-v3-empty">
                    Aucun export généré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
