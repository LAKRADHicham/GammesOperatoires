import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

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
    | "brouillon"
    | "en_validation"
    | "validee"
    | "archivee"
    | string;

  date_version?: string | null;

  redacteur?: string | null;
  valideur?: string | null;

  modifications?: string | null;
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
    case "brouillon":
      return numeroVersion === 0
        ? "En cours de création"
        : "En cours de modification";

    case "en_validation":
      return "En cours de validation";

    case "validee":
      return "En cours de modification";

    case "archivee":
      return "Archivé";

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
  if (statut === "brouillon" && numeroVersion === 0) {
    return {
      background: "#FFF4E5",
      color: "#B54708",
      border: "1px solid #FEDF89",
    };
  }

  if (statut === "brouillon") {
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
      background: "#EEF4FF",
      color: "#3538CD",
      border: "1px solid #C7D7FE",
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
  const [versions, setVersions] = useState<Version[]>([]);

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

        ) : versions.length === 0 ? (

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

                </tr>

              </thead>


              {/* ============================================= */}
              {/* BODY */}
              {/* ============================================= */}

              <tbody>

                {versions.map(
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
                          {getGammeCode(
                            version
                          )}
                        </strong>

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