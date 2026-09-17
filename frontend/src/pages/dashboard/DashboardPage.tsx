import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  FileText,
  Layers3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";

import api from "../../api/axios";

import "./DashboardPage.css";

type DistributionItem = {
  total: number;
  statut?: string | null;
  type_maintenance?: string | null;
  constructeur?: string | null;
};

type DashboardData = {
  gammes_total: number;
  equipements_total: number;
  versions_total: number;
  par_statut: DistributionItem[];
  par_type_maintenance: DistributionItem[];
  par_constructeur: DistributionItem[];
};

const EMPTY_DASHBOARD: DashboardData = {
  gammes_total: 0,
  equipements_total: 0,
  versions_total: 0,
  par_statut: [],
  par_type_maintenance: [],
  par_constructeur: [],
};

function labelStatus(
  value?: string | null,
) {
  switch (value) {
    case "brouillon":
      return "Brouillon";

    case "en_validation":
      return "En validation";

    case "validee":
      return "Validée";

    case "archivee":
      return "Archivée";

    default:
      return value || "Non renseigné";
  }
}

function labelMaintenance(
  value?: string | null,
) {
  switch (value) {
    case "preventif":
      return "Préventive";

    case "correctif":
      return "Corrective";

    case "amelioratif":
      return "Améliorative";

    case "conditionnel":
      return "Conditionnelle";

    case "predictif":
      return "Prédictive";

    default:
      return value || "Non renseigné";
  }
}

function extractCount(
  data: unknown,
): number {
  if (
    data &&
    typeof data === "object" &&
    "count" in data
  ) {
    const count =
      (
        data as {
          count?: unknown;
        }
      ).count;

    if (
      typeof count === "number"
    ) {
      return count;
    }
  }

  if (
    Array.isArray(data)
  ) {
    return data.length;
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data
  ) {
    const results =
      (
        data as {
          results?: unknown;
        }
      ).results;

    if (
      Array.isArray(results)
    ) {
      return results.length;
    }
  }

  return 0;
}

function statusClassName(
  status?: string | null,
) {
  switch (status) {
    case "validee":
      return "is-validated";

    case "en_validation":
      return "is-review";

    case "archivee":
      return "is-archived";

    default:
      return "is-draft";
  }
}

export default function DashboardPage() {
  const [
    data,
    setData,
  ] = useState<DashboardData>(
    EMPTY_DASHBOARD,
  );

  const [
    episTotal,
    setEpisTotal,
  ] = useState(0);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
    async (
      manual = false,
    ) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get<DashboardData>(
            "/dashboard/",
          );

        const responseData =
          response.data;

        setData({
          gammes_total:
            Number(
              responseData
                ?.gammes_total ?? 0,
            ),

          equipements_total:
            Number(
              responseData
                ?.equipements_total ?? 0,
            ),

          versions_total:
            Number(
              responseData
                ?.versions_total ?? 0,
            ),

          par_statut:
            Array.isArray(
              responseData?.par_statut,
            )
              ? responseData.par_statut
              : [],

          par_type_maintenance:
            Array.isArray(
              responseData
                ?.par_type_maintenance,
            )
              ? responseData
                  .par_type_maintenance
              : [],

          par_constructeur:
            Array.isArray(
              responseData
                ?.par_constructeur,
            )
              ? responseData
                  .par_constructeur
              : [],
        });

        try {
          const epiResponse =
            await api.get(
              "/epis/",
            );

          setEpisTotal(
            extractCount(
              epiResponse.data,
            ),
          );
        } catch {
          setEpisTotal(0);
        }
      } catch (
        err: any
      ) {
        const status =
          err?.response?.status;

        const backendMessage =
          err?.response
            ?.data?.detail;

        if (
          status === 401
        ) {
          setError(
            "Session expirée. Reconnectez-vous.",
          );
        } else if (
          status === 403
        ) {
          setError(
            "Vous n'avez pas l'autorisation d'accéder au tableau de bord.",
          );
        } else if (
          status === 500
        ) {
          setError(
            "Erreur interne du backend sur /api/dashboard/.",
          );
        } else if (
          backendMessage
        ) {
          setError(
            String(
              backendMessage,
            ),
          );
        } else {
          setError(
            "Impossible de charger le tableau de bord.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const totalStatuses =
    useMemo(
      () =>
        data.par_statut.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            Number(
              item.total || 0,
            ),
          0,
        ),
      [data.par_statut],
    );

  const validatedTotal =
    useMemo(
      () =>
        data.par_statut
          .filter(
            (item) =>
              item.statut ===
              "validee",
          )
          .reduce(
            (
              sum,
              item,
            ) =>
              sum +
              Number(
                item.total || 0,
              ),
            0,
          ),
      [data.par_statut],
    );

  const validatedPercent =
    totalStatuses > 0
      ? Math.round(
          (
            validatedTotal /
            totalStatuses
          ) *
            100,
        )
      : 0;

  if (loading) {
    return (
      <div className="dash-loading">
        <RefreshCw
          size={23}
          className="spin"
        />

        Chargement du tableau de bord...
      </div>
    );
  }

  return (
    <div className="dash-page">
      <header className="dash-title-row">
        <div>
          <div className="dash-eyebrow">
            PILOTAGE MAINTENANCE
          </div>

          <h1>
            Dashboard
          </h1>

          <p>
            Vue synthétique de l&apos;activité maintenance et de la documentation technique.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          disabled={refreshing}
          onClick={() =>
            void loadDashboard(true)
          }
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          Actualiser
        </button>
      </header>

      {error && (
        <div className="dash-error">
          <strong>
            Erreur :
          </strong>

          {" "}

          {error}
        </div>
      )}

      <section className="dash-kpi-grid">
        <article className="dash-kpi-card">
          <div className="dash-kpi-icon">
            <PackageCheck size={23} />
          </div>

          <div className="dash-kpi-content">
            <small>
              PARC INDUSTRIEL
            </small>

            <strong>
              {data.equipements_total}
            </strong>

            <span>
              Équipements
            </span>
          </div>
        </article>

        <article className="dash-kpi-card">
          <div className="dash-kpi-icon">
            <FileText size={23} />
          </div>

          <div className="dash-kpi-content">
            <small>
              DOCUMENTATION
            </small>

            <strong>
              {data.gammes_total}
            </strong>

            <span>
              Gammes opératoires
            </span>
          </div>
        </article>

        <article className="dash-kpi-card">
          <div className="dash-kpi-icon">
            <Layers3 size={23} />
          </div>

          <div className="dash-kpi-content">
            <small>
              VERSIONING
            </small>

            <strong>
              {data.versions_total}
            </strong>

            <span>
              Versions
            </span>
          </div>
        </article>

        <article className="dash-kpi-card">
          <div className="dash-kpi-icon">
            <ShieldCheck size={23} />
          </div>

          <div className="dash-kpi-content">
            <small>
              SÉCURITÉ
            </small>

            <strong>
              {episTotal}
            </strong>

            <span>
              EPI référencés
            </span>
          </div>
        </article>
      </section>

      <section className="dash-summary-strip">
        <div>
          <TrendingUp size={18} />

          <span>
            Taux de versions validées
          </span>
        </div>

        <strong>
          {validatedPercent} %
        </strong>

        <div className="dash-progress">
          <span
            style={{
              width:
                `${validatedPercent}%`,
            }}
          />
        </div>
      </section>

      <section className="dash-analytics-grid">
        <article className="dash-panel">
          <div className="dash-panel-title">
            <div>
              <span>
                VERSIONING
              </span>

              <h2>
                Versions par statut
              </h2>
            </div>

            <CheckCircle2 size={19} />
          </div>

          <div className="dash-donut-area">
            <div className="dash-donut">
              <div className="dash-donut-center">
                <strong>
                  {totalStatuses}
                </strong>

                <span>
                  total
                </span>
              </div>
            </div>

            <div className="dash-legend">
              {data.par_statut.length === 0 ? (
                <div className="empty-state">
                  Aucune donnée
                </div>
              ) : (
                data.par_statut.map(
                  (item) => (
                    <div
                      className="dash-legend-row"
                      key={
                        item.statut ||
                        "statut"
                      }
                    >
                      <span
                        className={
                          `dash-status-dot ${
                            statusClassName(
                              item.statut,
                            )
                          }`
                        }
                      />

                      <span>
                        {labelStatus(
                          item.statut,
                        )}
                      </span>

                      <strong>
                        {item.total}
                      </strong>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </article>

        <article className="dash-panel">
          <div className="dash-panel-title">
            <div>
              <span>
                ACTIVITÉ
              </span>

              <h2>
                Type de maintenance
              </h2>
            </div>

            <Wrench size={19} />
          </div>

          <div className="dash-horizontal-list">
            {data.par_type_maintenance.length === 0 ? (
              <div className="empty-state">
                Aucune donnée
              </div>
            ) : (
              data.par_type_maintenance.map(
                (item) => {
                  const max =
                    Math.max(
                      ...data
                        .par_type_maintenance
                        .map(
                          (x) =>
                            Number(
                              x.total || 0,
                            ),
                        ),
                      1,
                    );

                  const width =
                    Math.max(
                      8,
                      (
                        Number(
                          item.total || 0,
                        ) /
                        max
                      ) *
                        100,
                    );

                  return (
                    <div
                      className="dash-horizontal-item"
                      key={
                        item.type_maintenance ||
                        "maintenance"
                      }
                    >
                      <div className="dash-horizontal-meta">
                        <span>
                          {labelMaintenance(
                            item.type_maintenance,
                          )}
                        </span>

                        <strong>
                          {item.total}
                        </strong>
                      </div>

                      <div className="dash-horizontal-track">
                        <span
                          style={{
                            width:
                              `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>
        </article>

        <article className="dash-panel">
          <div className="dash-panel-title">
            <div>
              <span>
                PARC INDUSTRIEL
              </span>

              <h2>
                Équipements par constructeur
              </h2>
            </div>

            <PackageCheck size={19} />
          </div>

          <div className="dash-horizontal-list">
            {data.par_constructeur.length === 0 ? (
              <div className="empty-state">
                Aucune donnée
              </div>
            ) : (
              data.par_constructeur
                .slice(0, 5)
                .map(
                  (item) => {
                    const max =
                      Math.max(
                        ...data
                          .par_constructeur
                          .map(
                            (x) =>
                              Number(
                                x.total || 0,
                              ),
                          ),
                        1,
                      );

                    const width =
                      Math.max(
                        8,
                        (
                          Number(
                            item.total || 0,
                          ) /
                          max
                        ) *
                          100,
                      );

                    return (
                      <div
                        className="dash-horizontal-item"
                        key={
                          item.constructeur ||
                          "constructeur"
                        }
                      >
                        <div className="dash-horizontal-meta">
                          <span>
                            {item.constructeur ||
                              "Non renseigné"}
                          </span>

                          <strong>
                            {item.total}
                          </strong>
                        </div>

                        <div className="dash-horizontal-track">
                          <span
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
