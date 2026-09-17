import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api from "../../api/axios";
import "./Modules.css";

type Version = {
  id: string;
  code_version?: string | null;
  numero_version?: number | null;
  statut?: string | null;
  date_version?: string | null;
  redacteur?: string | null;
  valideur?: string | null;
  duree_minutes?: number | null;
  gamme?: string | null;

  gamme_detail?: {
    code?: string | null;
    designation?: string | null;
  } | null;
};

function results<T>(
  data: T[] | { results?: T[] },
): T[] {
  return Array.isArray(data)
    ? data
    : data.results ?? [];
}


// ============================================================
// STATUT
// ============================================================

function statusLabel(
  value?: string | null,
  numeroVersion?: number | null,
): string {
  switch (value) {
    // --------------------------------------------------------
    // BROUILLON
    // --------------------------------------------------------

    case "brouillon":
      return numeroVersion === 0
        ? "En cours de création"
        : "En cours de modification";

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    case "en_validation":
      return "En cours de validation";

    // --------------------------------------------------------
    // ANCIEN STATUT TECHNIQUE "VALIDEE"
    //
    // On ne l'affiche plus comme "Validée"
    // afin de respecter les 4 statuts de l'application.
    // --------------------------------------------------------

    case "validee":
      return "En cours de modification";

    // --------------------------------------------------------
    // ARCHIVE
    // --------------------------------------------------------

    case "archivee":
      return "Archivé";

    default:
      return "—";
  }
}


// ============================================================
// PAGE VERSIONS
// ============================================================

export default function VersionsPage() {
  const [items, setItems] =
    useState<Version[]>([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ==========================================================
  // CHARGEMENT DES VERSIONS
  // ==========================================================

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get("/versions/");

        setItems(
          results<Version>(
            response.data,
          ),
        );
      } catch (err) {
        console.error(
          "Erreur chargement versions :",
          err,
        );

        setError(
          "Impossible de charger les versions.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);


  // ==========================================================
  // RECHERCHE
  // ==========================================================

  const filtered = useMemo(() => {
    const needle =
      query.trim().toLowerCase();

    if (!needle) {
      return items;
    }

    return items.filter((item) => {
      // Permet également de rechercher avec
      // le libellé du statut affiché.

      const displayedStatus =
        statusLabel(
          item.statut,
          item.numero_version,
        );

      const searchableData = {
        ...item,

        statut_affiche:
          displayedStatus,
      };

      return JSON.stringify(
        searchableData,
      )
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query]);


  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <div className="module-page-v3">

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <header className="module-v3-header">
        <div>
          <h1>Versions</h1>

          <p>
            Historique et statut des versions
            de gammes opératoires
          </p>
        </div>
      </header>


      {/* ==================================================== */}
      {/* ERREUR */}
      {/* ==================================================== */}

      {error && (
        <div className="module-v3-error">
          {error}
        </div>
      )}


      {/* ==================================================== */}
      {/* TABLEAU */}
      {/* ==================================================== */}

      <section className="module-v3-card">

        {/* ================================================== */}
        {/* BARRE DE RECHERCHE */}
        {/* ================================================== */}

        <div className="module-v3-toolbar">

          <div className="module-v3-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value,
                )
              }
              placeholder="Rechercher une version..."
            />
          </div>

        </div>


        {/* ================================================== */}
        {/* CHARGEMENT */}
        {/* ================================================== */}

        {loading ? (

          <div className="module-v3-loading">
            Chargement...
          </div>

        ) : (

          <table className="module-v3-table">

            {/* ============================================== */}
            {/* EN-TÊTE */}
            {/* ============================================== */}

            <thead>
              <tr>
                <th>Gamme</th>
                <th>Version</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Rédacteur</th>
                <th>Valideur</th>
                <th>Durée</th>
              </tr>
            </thead>


            {/* ============================================== */}
            {/* CONTENU */}
            {/* ============================================== */}

            <tbody>

              {filtered.map((item) => (

                <tr key={item.id}>

                  {/* GAMME */}

                  <td className="module-v3-name">
                    {item.gamme_detail?.code ||
                      item.gamme ||
                      "—"}
                  </td>


                  {/* VERSION */}

                  <td>
                    {item.code_version ||
                      `V${
                        item.numero_version ??
                        "—"
                      }`}
                  </td>


                  {/* STATUT */}

                  <td>
                    <span className="module-v3-badge">
                      {statusLabel(
                        item.statut,
                        item.numero_version,
                      )}
                    </span>
                  </td>


                  {/* DATE */}

                  <td>
                    {item.date_version ||
                      "—"}
                  </td>


                  {/* REDACTEUR */}

                  <td>
                    {item.redacteur ||
                      "—"}
                  </td>


                  {/* VALIDEUR */}

                  <td>
                    {item.valideur ||
                      "—"}
                  </td>


                  {/* DUREE */}

                  <td>
                    {item.duree_minutes ??
                      0}{" "}
                    min
                  </td>

                </tr>

              ))}


              {/* ============================================ */}
              {/* AUCUNE VERSION */}
              {/* ============================================ */}

              {filtered.length === 0 && (

                <tr>
                  <td
                    colSpan={7}
                    className="module-v3-empty"
                  >
                    Aucune version.
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