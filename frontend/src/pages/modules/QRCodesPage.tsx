import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Modules.css";

type QRItem = {
  id: string;
  actif?: boolean | null;
  token?: string | null;
  created_at?: string | null;
  gamme?: string | null;
};

function extract<T>(data: T[] | { results?: T[] }): T[] {
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function QRCodesPage() {
  const [items, setItems] = useState<QRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get("/qr-codes/");
        setItems(extract<QRItem>(response.data));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les QR Codes.");
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
          <h1>QR Codes</h1>
          <p>QR dynamiques associés aux gammes opératoires</p>
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
                <th>Gamme</th>
                <th>Token</th>
                <th>Statut</th>
                <th>Création</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="module-v3-name">{item.gamme || "—"}</td>
                  <td>{item.token || "—"}</td>
                  <td>
                    <span className="module-v3-badge">
                      {item.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>{item.created_at || "—"}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="module-v3-empty">
                    Aucun QR Code.
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
