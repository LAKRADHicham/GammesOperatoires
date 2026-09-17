import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";
import "./Modules.css";

type DocumentItem = {
  id: string;
  titre?: string | null;
  reference?: string | null;
  description?: string | null;
  fichier_url?: string | null;
};

function extract<T>(data: T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function DocumentsPage() {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/documents/");
        setItems(extract<DocumentItem>(response.data));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les documents.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div className="module-page-v3">
      <header className="module-v3-header">
        <div>
          <h1>Documents techniques</h1>
          <p>Notices constructeurs, plans, procédures et documents liés aux gammes</p>
        </div>
      </header>

      {error && <div className="module-v3-error">{error}</div>}

      <section className="module-v3-card">
        <div className="module-v3-toolbar">
          <div className="module-v3-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un document..."
            />
          </div>
        </div>

        {loading ? (
          <div className="module-v3-loading">Chargement...</div>
        ) : (
          <table className="module-v3-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Référence</th>
                <th>Description</th>
                <th>Fichier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="module-v3-name">{item.titre || "—"}</td>
                  <td>{item.reference || "—"}</td>
                  <td>{item.description || "—"}</td>
                  <td>
                    {item.fichier_url ? (
                      <a href={item.fichier_url} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="module-v3-empty">
                    Aucun document.
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
