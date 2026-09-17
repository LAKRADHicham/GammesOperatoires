import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";
import "./Modules.css";

type Version = {
  id: string;
  code_version?: string | null;
  statut?: string | null;
  periodicite?: string | null;
  type_maintenance?: string | null;
  duree_minutes?: number | null;
  gamme_detail?: {
    code?: string | null;
    designation?: string | null;
  } | null;
};

function extract<T>(data: T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function PlansMaintenancePage() {
  const [items, setItems] = useState<Version[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/versions/");
        setItems(
          extract<Version>(response.data).filter(
            (item) => item.statut === "validee",
          ),
        );
      } catch (err) {
        console.error(err);
        setError("Impossible de charger le plan de maintenance.");
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
          <h1>Plans de maintenance</h1>
          <p>Gammes validées et périodicités de maintenance préventive</p>
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
              placeholder="Rechercher dans le plan..."
            />
          </div>
        </div>

        {loading ? (
          <div className="module-v3-loading">Chargement...</div>
        ) : (
          <table className="module-v3-table">
            <thead>
              <tr>
                <th>Gamme</th>
                <th>Version</th>
                <th>Type</th>
                <th>Périodicité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="module-v3-name">
                    {item.gamme_detail?.code ||
                      item.gamme_detail?.designation ||
                      "—"}
                  </td>
                  <td>{item.code_version || "—"}</td>
                  <td>{item.type_maintenance || "—"}</td>
                  <td>{item.periodicite || "—"}</td>
                  <td>{item.duree_minutes ?? 0} min</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="module-v3-empty">
                    Aucune gamme validée.
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
