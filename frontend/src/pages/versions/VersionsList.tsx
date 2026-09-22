import { useEffect, useMemo, useState } from "react";
import { Eye, Filter, RefreshCw, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";


type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};


type Gamme = {
  id: string;
  code: string;
  designation?: string;
};


type Version = {
  id: string;

  gamme: string | Gamme;

  numero_version: number;
  code_version: string;

  statut:
  | "en_cours_creation"
  | "en_cours_modification"
  | "en_validation"
  | "validee"
  | "archivee"
  | string;

  date_version?: string | null;

  redacteur?: string | null;
  valideur?: string | null;

  modifications?: string | null;
  duree_minutes?: number | null;
};


function extractResults<T>(
  data: T[] | PaginatedResponse<T> | null | undefined
): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}


// ============================================================
// LIBELLÉ DU STATUT
// ============================================================

const getVersionStatusLabel = (
  statut?: string,
  numeroVersion?: number
): string => {
  switch (statut) {
    case "en_cours_creation":
      return "En cours de création";

    case "en_cours_modification":
      return "En cours de modification";

    case "en_validation":
      return "En cours de validation";

    case "validee":
      return "Validée";

    case "archivee":
      return "Archivée";

    // Compatibilité avec les anciennes données
    case "brouillon":
      return numeroVersion === 0
        ? "En cours de création"
        : "En cours de modification";

    default:
      return "—";
  }
};


// ============================================================
// COULEUR DU STATUT
// ============================================================

const getStatusStyle = (
  statut?: string,
  numeroVersion?: number
): React.CSSProperties => {
  if (
    statut === "en_cours_creation" ||
    (statut === "brouillon" && numeroVersion === 0)
  ) {
    return {
      background: "#FFF4E5",
      color: "#B54708",
      border: "1px solid #FEDF89",
    };
  }

  if (
    statut === "en_cours_modification" ||
    statut === "brouillon"
  ) {
    return {
      background: "#EEF4FF",
      color: "#3538CD",
      border: "1px solid #C7D7FE",
    };
  }

  if (statut === "en_validation") {
    return {
      background: "#FFF8E7",
      color: "#B54708",
      border: "1px solid #FEC84B",
    };
  }

  if (statut === "validee") {
    return {
      background: "#ECFDF3",
      color: "#027A48",
      border: "1px solid #ABEFC6",
    };
  }

  if (statut === "archivee") {
    return {
      background: "#F2F4F7",
      color: "#667085",
      border: "1px solid #D0D5DD",
    };
  }

  return {
    background: "#F2F4F7",
    color: "#667085",
    border: "1px solid #D0D5DD",
  };
};


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR");
}


// ============================================================
// PAGE
// ============================================================

export default function VersionsList() {
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const [gammesById, setGammesById] =
    useState<Record<string, Gamme>>({});

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ============================================================
  // CHARGEMENT
  // ============================================================

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        versionsResponse,
        gammesResponse,
      ] = await Promise.all([
        api.get<
          Version[] |
          PaginatedResponse<Version>
        >("/versions/"),

        api.get<
          Gamme[] |
          PaginatedResponse<Gamme>
        >("/gammes/"),
      ]);


      const versionsData =
        extractResults<Version>(
          versionsResponse.data
        );


      const gammesData =
        extractResults<Gamme>(
          gammesResponse.data
        );


      // --------------------------------------------------------
      // INDEX GAMMES PAR UUID
      // --------------------------------------------------------

      const gammeMap: Record<string, Gamme> = {};

      gammesData.forEach((gamme) => {
        gammeMap[gamme.id] = gamme;
      });


      // --------------------------------------------------------
      // TRI
      // --------------------------------------------------------

      const sortedVersions = [...versionsData].sort(
        (a, b) => {
          const dateA =
            a.date_version
              ? new Date(
                  a.date_version
                ).getTime()
              : 0;

          const dateB =
            b.date_version
              ? new Date(
                  b.date_version
                ).getTime()
              : 0;

          if (dateB !== dateA) {
            return dateB - dateA;
          }

          return (
            (b.numero_version ?? 0) -
            (a.numero_version ?? 0)
          );
        }
      );


      setGammesById(gammeMap);

      setVersions(sortedVersions);
    } catch (err) {
      console.error(
        "Erreur chargement versions :",
        err
      );

      setError(
        "Impossible de charger les versions."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadData();
  }, []);


  // ============================================================
  // CODE GAMME
  // ============================================================

  const getGammeCode = (
    version: Version
  ): string => {
    /*
     * Cas 1 :
     * l'API renvoie directement un objet gamme.
     */

    if (
      typeof version.gamme === "object" &&
      version.gamme !== null
    ) {
      return version.gamme.code || "—";
    }


    /*
     * Cas 2 :
     * l'API renvoie seulement l'UUID de la gamme.
     */

    const gammeId = version.gamme;

    const gamme =
      gammesById[gammeId];

    if (gamme) {
      return gamme.code;
    }


    /*
     * On n'affiche pas l'UUID au milieu du tableau.
     */

    return "—";
  };


  const getGamme = (version: Version): Gamme | null => {
    if (typeof version.gamme === "object" && version.gamme !== null) {
      return version.gamme;
    }
    return gammesById[version.gamme] ?? null;
  };

  const stats = useMemo(() => ({
  total: versions.length,

  enCours: versions.filter(
    (v) =>
      v.statut === "en_cours_creation" ||
      v.statut === "en_cours_modification" ||
      v.statut === "brouillon"
  ).length,

  validation: versions.filter(
    (v) => v.statut === "en_validation"
  ).length,

  validee: versions.filter(
    (v) => v.statut === "validee"
  ).length,
}), [versions]);

  const filteredVersions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return versions.filter((version) => {
      const gamme = getGamme(version);
      const matchesStatus = statusFilter === "tous" || version.statut === statusFilter;
      const haystack = [
        gamme?.code,
        gamme?.designation,
        version.code_version,
        version.redacteur,
        version.valideur,
        version.modifications,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [versions, gammesById, search, statusFilter]);

  // ============================================================
  // INTERFACE
  // ============================================================

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          gap: "20px",

          marginBottom: "28px",

          flexWrap: "wrap",
        }}
      >

        <div>

          <p
            style={{
              margin: 0,

              color: "#00966D",

              fontWeight: 700,

              fontSize: "13px",

              textTransform:
                "uppercase",

              letterSpacing: "1px",
            }}
          >
            Maintenance industrielle
          </p>


          <h1
            style={{
              margin: "7px 0 4px",

              color: "#172B2A",

              fontSize: "32px",
            }}
          >
            Versions
          </h1>


          <p
            style={{
              margin: 0,

              color: "#6B7D79",
            }}
          >
            Historique et suivi des versions
            des gammes opératoires
          </p>

        </div>


        {/* ACTUALISER */}

        <button
          type="button"

          onClick={() =>
            void loadData()
          }

          disabled={loading}

          style={{
            minHeight: "44px",

            border:
              "1px solid #DDE7E3",

            borderRadius: "10px",

            padding: "0 16px",

            background: "#FFFFFF",

            color: "#172B2A",

            fontWeight: 600,

            cursor:
              loading
                ? "not-allowed"
                : "pointer",

            display: "flex",

            alignItems: "center",

            gap: "8px",

            opacity:
              loading
                ? 0.6
                : 1,
          }}
        >

          <RefreshCw
            size={17}
          />

          Actualiser

        </button>

      </div>


      {/* ===================================================== */}
      {/* ERREUR */}
      {/* ===================================================== */}

      {error && (

        <div
          style={{
            marginBottom: "20px",

            padding: "14px 16px",

            borderRadius: "10px",

            background: "#FFF2F2",

            border:
              "1px solid #F3C5C5",

            color: "#B42318",
          }}
        >
          {error}
        </div>

      )}


      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "14px", marginBottom: "18px"
      }}>
        {[
          ["Total des versions", stats.total],
          ["En cours", stats.enCours],
          ["En validation", stats.validation],
          ["Validées", stats.validee],
        ].map(([label, value]) => (
          <div key={String(label)} style={{
            background: "#FFFFFF", border: "1px solid #DDE7E3", borderRadius: "12px",
            padding: "17px 18px", boxShadow: "0 4px 16px rgba(23,43,42,.04)"
          }}>
            <div style={{ color: "#6B7D79", fontSize: "12px", fontWeight: 600 }}>{label}</div>
            <strong style={{ display: "block", marginTop: "6px", color: "#063D32", fontSize: "24px" }}>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
        marginBottom: "18px", padding: "14px", background: "#FFFFFF",
        border: "1px solid #DDE7E3", borderRadius: "12px"
      }}>
        <div style={{ position: "relative", flex: "1 1 340px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "13px", color: "#80938E" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par gamme, version, rédacteur, valideur..."
            style={{
              width: "100%", minHeight: "42px", boxSizing: "border-box",
              padding: "0 12px 0 38px", border: "1px solid #DDE7E3",
              borderRadius: "9px", outline: "none"
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="#6B7D79" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              minHeight: "42px", padding: "0 34px 0 12px",
              border: "1px solid #DDE7E3", borderRadius: "9px",
              background: "#FFFFFF", color: "#344A46", fontWeight: 600
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_cours_creation">
              En cours de création
            </option>
            <option value="en_cours_modification">
              En cours de modification
            </option>
            <option value="en_validation">En validation</option>
            <option value="validee">Validée</option>
            <option value="archivee">Archivée</option>
          </select>
        </div>
        <strong style={{ color: "#047857", fontSize: "13px" }}>
          {filteredVersions.length} résultat{filteredVersions.length > 1 ? "s" : ""}
        </strong>
      </div>

      {/* ===================================================== */}
      {/* TABLEAU */}
      {/* ===================================================== */}

      <div
        style={{
          background: "#FFFFFF",

          border:
            "1px solid #DDE7E3",

          borderRadius: "16px",

          overflow: "hidden",

          boxShadow:
            "0 8px 30px rgba(23, 43, 42, 0.05)",
        }}
      >

        {loading ? (

          <div
            style={{
              padding: "60px",

              textAlign: "center",

              color: "#6B7D79",
            }}
          >
            Chargement des versions...
          </div>

        ) : filteredVersions.length === 0 ? (

          <div
            style={{
              padding: "60px 30px",

              textAlign: "center",
            }}
          >

            <h3
              style={{
                margin: "0 0 8px",

                color: "#172B2A",
              }}
            >
              Aucune version disponible
            </h3>


            <p
              style={{
                margin: 0,

                color: "#6B7D79",
              }}
            >
              Les versions apparaîtront ici
              après la création des gammes.
            </p>

          </div>

        ) : (

          <div
            style={{
              overflowX: "auto",
            }}
          >

            <table
              style={{
                width: "100%",

                borderCollapse:
                  "collapse",

                minWidth: "900px",
              }}
            >

              {/* ============================================= */}
              {/* HEADER TABLE */}
              {/* ============================================= */}

              <thead>

                <tr
                  style={{
                    background:
                      "#F1FBF7",
                  }}
                >

                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Gamme
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Version
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Statut
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Date
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Rédacteur
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Valideur
                  </th>

                  <th style={headerCellStyle}>Durée</th>
                  <th style={headerCellStyle}>Actions</th>

                </tr>

              </thead>


              {/* ============================================= */}
              {/* BODY */}
              {/* ============================================= */}

              <tbody>

                {filteredVersions.map(
                  (version) => (

                    <tr
                      key={version.id}

                      style={{
                        borderTop:
                          "1px solid #EEF3F1",
                      }}
                    >

                      {/* GAMME */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >

                        <strong
                          style={{
                            color:
                              "#063D32",
                          }}
                        >
                          {getGammeCode(version)}
                        </strong>
                        <div style={{ marginTop: "4px", color: "#6B7D79", fontSize: "12px" }}>
                          {getGamme(version)?.designation || "—"}
                        </div>

                      </td>


                      {/* VERSION */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >

                        <span
                          style={{
                            fontWeight: 700,

                            color:
                              "#172B2A",
                          }}
                        >
                          {version.code_version ||
                            `V${version.numero_version}`}
                        </span>

                      </td>


                      {/* STATUT */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >

                        <span
                          style={{
                            display:
                              "inline-flex",

                            alignItems:
                              "center",

                            padding:
                              "6px 11px",

                            borderRadius:
                              "999px",

                            fontSize:
                              "12px",

                            fontWeight:
                              700,

                            whiteSpace:
                              "nowrap",

                            ...getStatusStyle(
                              version.statut,
                              version.numero_version
                            ),
                          }}
                        >

                          {getVersionStatusLabel(
                            version.statut,
                            version.numero_version
                          )}

                        </span>

                      </td>


                      {/* DATE */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >
                        {formatDate(
                          version.date_version
                        )}
                      </td>


                      {/* REDACTEUR */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >
                        {version.redacteur ||
                          "—"}
                      </td>


                      {/* VALIDEUR */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >
                        {version.valideur ||
                          "—"}
                      </td>

                      <td style={bodyCellStyle}>
                        {version.duree_minutes != null ? `${version.duree_minutes} min` : "—"}
                      </td>

                      <td style={bodyCellStyle}>
                        <button
                          type="button"
                          onClick={() => {
                            const gamme = getGamme(version);
                            if (gamme?.id) navigate(`/gammes/${gamme.id}`);
                          }}
                          disabled={!getGamme(version)?.id}
                          style={{
                            minHeight: "36px", padding: "0 12px", borderRadius: "8px",
                            border: "1px solid #B7E4D5", background: "#ECFDF5",
                            color: "#047857", fontWeight: 700, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          <Eye size={15} /> Consulter
                        </button>
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


// ============================================================
// STYLES
// ============================================================

const headerCellStyle: React.CSSProperties = {
  padding: "15px 18px",

  textAlign: "left",

  color: "#405A55",

  fontSize: "12px",

  fontWeight: 700,

  textTransform: "uppercase",

  letterSpacing: "0.5px",

  whiteSpace: "nowrap",
};


const bodyCellStyle: React.CSSProperties = {
  padding: "17px 18px",

  color: "#344A46",

  fontSize: "14px",

  verticalAlign: "middle",
};