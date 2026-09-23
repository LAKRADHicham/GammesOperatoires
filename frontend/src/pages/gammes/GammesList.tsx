import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
  designation: string;
  abreviation?: string | null;
  actif?: boolean;
  equipement?: string | null;
};


type GammeVersion = {
  id: string;
  numero_version?: number;
  code_version?: string;
  statut?: string;
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


function getFilenameFromDisposition(
  disposition?: string
): string | null {
  if (!disposition) {
    return null;
  }

  const utf8Match = disposition.match(
    /filename\*=UTF-8''([^;]+)/
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const filenameMatch = disposition.match(
    /filename="?([^";]+)"?/
  );

  return filenameMatch?.[1] ?? null;
}


export default function GammesList() {
  const navigate = useNavigate();

  const [gammes, setGammes] = useState<Gamme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);
  const [deletingId, setDeletingId] =
    useState<string | null>(null);


  // ============================================================
  // CHARGEMENT DES GAMMES
  // ============================================================

  const loadGammes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<
        Gamme[] | PaginatedResponse<Gamme>
      >("/gammes/");

      const data = extractResults<Gamme>(
        response.data
      );

      setGammes(data);
    } catch (err) {
      console.error(
        "Erreur chargement gammes :",
        err
      );

      setError(
        "Impossible de charger les gammes opératoires."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadGammes();
  }, []);


  // ============================================================
  // RÉCUPÉRER LA DERNIÈRE VERSION
  // ============================================================

  const getLatestVersion = async (
    gammeId: string
  ): Promise<GammeVersion | null> => {
    const response = await api.get<
      GammeVersion[] |
      PaginatedResponse<GammeVersion>
    >(
      `/gammes/${gammeId}/versions/`
    );

    const versions =
      extractResults<GammeVersion>(
        response.data
      );

    if (versions.length === 0) {
      return null;
    }

    const sortedVersions = [...versions].sort(
      (a, b) =>
        (b.numero_version ?? 0) -
        (a.numero_version ?? 0)
    );

    return sortedVersions[0];
  };


  // ============================================================
  // VOIR
  // ============================================================

  const handleView = (
    gamme: Gamme
  ) => {
    navigate(
      `/gammes/${gamme.id}`
    );
  };


  // ============================================================
  // MODIFIER
  // ============================================================

  const handleEdit = (
    gamme: Gamme
  ) => {
    navigate(
      `/gammes/${gamme.id}/modifier`
    );
  };


  // ============================================================
  // TÉLÉCHARGER PDF
  // ============================================================

  const handleDownloadPdf = async (
    gamme: Gamme
  ) => {
    setError("");
    setDownloadingId(gamme.id);

    try {
      const version =
        await getLatestVersion(
          gamme.id
        );

      if (!version) {
        setError(
          `Aucune version disponible pour la gamme ${gamme.code}.`
        );

        return;
      }

      const response = await api.post(
        `/versions/${version.id}/export_pdf/`,
        {},
        {
          responseType: "blob",
        }
      );


      const contentType =
        response.headers[
          "content-type"
        ] || "application/pdf";


      const blob = new Blob(
        [response.data],
        {
          type: String(contentType),
        }
      );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const disposition =
        response.headers[
          "content-disposition"
        ];


      const filename =
        getFilenameFromDisposition(
          disposition
        ) ||
        `${gamme.code}_${
          version.code_version || "V0"
        }.pdf`;


      const link =
        document.createElement("a");

      link.href = url;

      link.download = filename;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );


      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      console.error(
        "Erreur génération PDF :",
        err
      );

      setError(
        "Impossible de générer ou télécharger le PDF."
      );
    } finally {
      setDownloadingId(null);
    }
  };


  // ============================================================
  // SUPPRIMER UNE GAMME
  // ============================================================

  const handleDelete = async (gamme: Gamme) => {
    if (deletingId !== null || downloadingId !== null) return;

    if (!window.confirm(
      `Supprimer définitivement la gamme « ${gamme.code} » ? Cette action est irréversible.`
    )) return;

    setDeletingId(gamme.id);
    setError("");

    try {
      await api.delete(`/gammes/${encodeURIComponent(gamme.id)}/`);
      setGammes((current) => current.filter((item) => item.id !== gamme.id));
    } catch (err: any) {
      console.error("Erreur suppression gamme :", err);
      const data = err?.response?.data;
      const reason = typeof data === "string"
        ? data
        : typeof data?.detail === "string"
          ? data.detail
          : "Vérifiez que l'API autorise la suppression.";
      setError(`Impossible de supprimer la gamme ${gamme.code}. ${reason}`);
    } finally {
      setDeletingId(null);
    }
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
            Gammes opératoires
          </h1>


          <p
            style={{
              margin: 0,
              color: "#6B7D79",
            }}
          >
            Gestion des gammes de
            maintenance
          </p>

        </div>


        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          {/* ACTUALISER */}

          <button
            type="button"
            onClick={() =>
              void loadGammes()
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


          {/* NOUVELLE GAMME */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/gammes/nouvelle"
              )
            }
            style={{
              minHeight: "44px",
              border: "none",
              borderRadius: "10px",
              padding: "0 18px",
              background: "#00966D",
              color: "#FFFFFF",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus
              size={18}
            />

            Nouvelle gamme
          </button>

        </div>

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

        {/* CHARGEMENT */}

        {loading ? (

          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "#6B7D79",
            }}
          >
            Chargement des gammes...
          </div>

        ) : gammes.length === 0 ? (

          /* AUCUNE GAMME */

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
              Aucune gamme disponible
            </h3>


            <p
              style={{
                margin: "0 0 22px",
                color: "#6B7D79",
              }}
            >
              Commencez par créer une
              nouvelle gamme opératoire.
            </p>


            <button
              type="button"
              onClick={() =>
                navigate(
                  "/gammes/nouvelle"
                )
              }
              style={{
                minHeight: "44px",
                border: "none",
                borderRadius: "10px",
                padding: "0 18px",
                background: "#00966D",
                color: "#FFFFFF",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Créer une gamme
            </button>

          </div>

        ) : (

          /* TABLE */

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
                minWidth: "950px",
              }}
            >

              {/* EN-TÊTE */}

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
                    Code
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Intitulé de l'opération
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Abréviation
                  </th>


                  <th
                    style={
                      headerCellStyle
                    }
                  >
                    Statut
                  </th>


                  <th
                    style={{
                      ...headerCellStyle,
                      textAlign:
                        "center",
                    }}
                  >
                    Actions
                  </th>

                </tr>

              </thead>


              {/* CORPS */}

              <tbody>

                {gammes.map(
                  (gamme) => (

                    <tr
                      key={gamme.id}
                      style={{
                        borderTop:
                          "1px solid #EEF3F1",
                      }}
                    >

                      {/* CODE */}

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
                          {gamme.code ||
                            "—"}
                        </strong>

                      </td>


                      {/* DESIGNATION */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >
                        {gamme.designation ||
                          "—"}
                      </td>


                      {/* ABREVIATION */}

                      <td
                        style={
                          bodyCellStyle
                        }
                      >
                        {gamme.abreviation ||
                          "—"}
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

                            padding:
                              "5px 10px",

                            borderRadius:
                              "999px",

                            background:
                              gamme.actif ===
                              false
                                ? "#F4F4F4"
                                : "#DDF7EE",

                            color:
                              gamme.actif ===
                              false
                                ? "#667085"
                                : "#007F5F",

                            fontSize:
                              "12px",

                            fontWeight:
                              700,
                          }}
                        >

                          {gamme.actif ===
                          false
                            ? "Inactive"
                            : "Disponible"}

                        </span>

                      </td>


                      {/* ===================================== */}
                      {/* ACTIONS */}
                      {/* ===================================== */}

                      <td
                        style={{
                          ...bodyCellStyle,
                          textAlign:
                            "center",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            gap: "8px",
                          }}
                        >

                          {/* VOIR */}

                          <button
                            type="button"
                            title="Voir la gamme"
                            aria-label="Voir la gamme"
                            onClick={() =>
                              handleView(
                                gamme
                              )
                            }
                            style={
                              actionButtonStyle
                            }
                          >

                            <Eye
                              size={17}
                            />

                          </button>


                          {/* MODIFIER */}

                          <button
                            type="button"
                            title="Modifier la gamme"
                            aria-label="Modifier la gamme"
                            onClick={() =>
                              handleEdit(
                                gamme
                              )
                            }
                            style={
                              actionButtonStyle
                            }
                          >

                            <Pencil
                              size={16}
                            />

                          </button>


                          {/* TELECHARGER PDF */}

                          <button
                            type="button"
                            title="Télécharger le PDF"
                            aria-label="Télécharger le PDF"
                            disabled={
                              downloadingId ===
                              gamme.id
                            }
                            onClick={() =>
                              void handleDownloadPdf(
                                gamme
                              )
                            }
                            style={{
                              ...actionButtonStyle,

                              color:
                                "#007F5F",

                              background:
                                "#F1FBF7",

                              opacity:
                                downloadingId ===
                                gamme.id
                                  ? 0.5
                                  : 1,

                              cursor:
                                downloadingId ===
                                gamme.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >

                            {downloadingId ===
                            gamme.id ? (

                              <RefreshCw
                                size={16}
                              />

                            ) : (

                              <Download
                                size={17}
                              />

                            )}

                          </button>


                          {/* SUPPRIMER */}
                          <button
                            type="button"
                            title="Supprimer la gamme"
                            aria-label={`Supprimer la gamme ${gamme.code}`}
                            disabled={deletingId !== null || downloadingId !== null}
                            onClick={() => void handleDelete(gamme)}
                            style={{
                              ...actionButtonStyle,
                              color: "#B42318",
                              background: "#FFF5F5",
                              opacity: deletingId !== null ? 0.5 : 1,
                              cursor: deletingId !== null ? "not-allowed" : "pointer",
                            }}
                          >
                            {deletingId === gamme.id ? (
                              <RefreshCw size={16} />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>

                        </div>

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
// STYLES TABLEAU
// ============================================================

const headerCellStyle: React.CSSProperties = {
  padding: "15px 18px",
  textAlign: "left",
  color: "#405A55",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};


const bodyCellStyle: React.CSSProperties = {
  padding: "17px 18px",
  color: "#344A46",
  fontSize: "14px",
  verticalAlign: "middle",
};


// ============================================================
// STYLE BOUTONS ACTION
// ============================================================

const actionButtonStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",

  border:
    "1px solid #DDE7E3",

  borderRadius: "8px",

  background:
    "#FFFFFF",

  color:
    "#405A55",

  cursor:
    "pointer",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  transition:
    "all 0.2s ease",
};