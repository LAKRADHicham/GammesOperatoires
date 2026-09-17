import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  LoaderCircle,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../api/axios";
import "./GammeDetail.css";

type Equipment = {
  id?: string;
  code?: string | null;
  nom?: string | null;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
};

type Gamme = {
  id: string;
  code: string;
  designation: string;
  abreviation?: string | null;
  description?: string | null;
  actif?: boolean;
  equipement?: string | Equipment | null;

  // Certaines versions de l'API peuvent renvoyer ces métadonnées.
  corps_metier?: string | null;
  type_redaction?: string | null;
  image_url?: string | null;
};

type Version = {
  id: string;
  numero_version?: number;
  code_version?: string;
  statut?: string;
  type_maintenance?: string | null;
  periodicite?: string | null;
  main_oeuvre?: number | null;
  duree_minutes?: number | null;
  modifications?: string | null;
  type_arret?: string | null;
  redacteur?: string | null;
  valideur?: string | null;
  created_at?: string | null;
};

type PaginatedResponse<T> = {
  results: T[];
};

function extractResults<T>(
  data: T[] | PaginatedResponse<T> | null | undefined,
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function statusLabel(status?: string) {
  switch (status) {
    case "brouillon":
      return "En cours de création";
    case "en_validation":
      return "En cours de validation";
    case "validee":
      return "Validée";
    case "archivee":
      return "Archivée";
    default:
      return display(status);
  }
}

function equipmentFromGamme(gamme: Gamme | null): Equipment | null {
  if (!gamme?.equipement || typeof gamme.equipement === "string") return null;
  return gamme.equipement;
}

export default function GammeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gamme, setGamme] = useState<Gamme | null>(null);
  const [version, setVersion] = useState<Version | null>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadGamme = async () => {
    if (!id) {
      setError("Identifiant de gamme manquant.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const gammeResponse = await api.get<Gamme>(`/gammes/${id}/`);
      setGamme(gammeResponse.data);

      const versionsResponse = await api.get<
        Version[] | PaginatedResponse<Version>
      >(`/gammes/${id}/versions/`);

      const versions = extractResults(versionsResponse.data)
        .slice()
        .sort(
          (a, b) =>
            Number(b.numero_version ?? 0) -
            Number(a.numero_version ?? 0),
        );

      setVersion(versions[0] ?? null);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger cette gamme opératoire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGamme();
  }, [id]);

  const downloadPdf = async () => {
    if (!version) {
      setError("Aucune version disponible pour générer le PDF.");
      return;
    }

    setExporting(true);
    setError("");

    try {
      const response = await api.post(
        `/versions/${version.id}/export_pdf/`,
        {},
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${gamme?.code || "gamme"}_${
        version.code_version || "V0"
      }.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Impossible de générer le PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="gamme-detail-loading">
        <LoaderCircle className="spin" size={28} />
        Chargement de la gamme...
      </div>
    );
  }

  if (!gamme) {
    return (
      <div className="gamme-detail-page">
        <div className="gamme-detail-error">
          {error || "Gamme introuvable."}
        </div>

        <button
          type="button"
          className="gd-secondary"
          onClick={() => navigate("/gammes")}
        >
          <ArrowLeft size={17} />
          Retour aux gammes
        </button>
      </div>
    );
  }

  const equipment = equipmentFromGamme(gamme);

  return (
    <div className="gamme-detail-page">
      <header className="gamme-detail-header">
        <div>
          <button
            type="button"
            className="gd-back"
            onClick={() => navigate("/gammes")}
          >
            <ArrowLeft size={17} />
            Gammes opératoires
          </button>

          <p className="gd-kicker">MAINTENANCE INDUSTRIELLE</p>

          <h1>{gamme.code}</h1>

          <p>{gamme.designation}</p>
        </div>

        <div className="gd-header-actions">
          <button
            type="button"
            className="gd-secondary"
            onClick={() => void loadGamme()}
          >
            <RefreshCw size={17} />
            Actualiser
          </button>

          <button
            type="button"
            className="gd-secondary"
            onClick={() => navigate(`/gammes/${gamme.id}/modifier`)}
          >
            <Pencil size={17} />
            Modifier
          </button>

          <button
            type="button"
            className="gd-primary"
            disabled={!version || exporting}
            onClick={() => void downloadPdf()}
          >
            {exporting ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Download size={17} />
            )}
            Télécharger PDF
          </button>
        </div>
      </header>

      {error && <div className="gamme-detail-error">{error}</div>}

      <div className="gd-summary">
        <div>
          <span>Code</span>
          <strong>{gamme.code}</strong>
        </div>

        <div>
          <span>Abréviation</span>
          <strong>{display(gamme.abreviation)}</strong>
        </div>

        <div>
          <span>Version</span>
          <strong>{version?.code_version || "V0"}</strong>
        </div>

        <div>
          <span>Statut</span>
          <strong>{statusLabel(version?.statut)}</strong>
        </div>
      </div>

      <section className="gd-card">
        <div className="gd-card-heading">
          <div>
            <span>01</span>
            <h2>Informations générales</h2>
          </div>
        </div>

        <div className="gd-grid">
          <Info label="Code gamme" value={gamme.code} />
          <Info label="Intitulé" value={gamme.designation} />
          <Info label="Abréviation" value={gamme.abreviation} />
          <Info label="Corps de métier" value={gamme.corps_metier} />
          <Info label="Type de rédaction" value={gamme.type_redaction} />
          <Info
            label="État"
            value={gamme.actif === false ? "Inactive" : "Active"}
          />
        </div>
      </section>

      <section className="gd-card">
        <div className="gd-card-heading">
          <div>
            <span>02</span>
            <h2>Équipement</h2>
          </div>
        </div>

        {equipment ? (
          <div className="gd-grid">
            <Info label="Nom" value={equipment.nom} />
            <Info label="Code" value={equipment.code} />
            <Info label="Constructeur" value={equipment.constructeur} />
            <Info label="Type machine" value={equipment.type} />
            <Info label="Référence" value={equipment.reference} />
          </div>
        ) : (
          <p className="gd-empty">
            Les informations détaillées de l'équipement ne sont pas présentes
            dans la réponse de cette API.
          </p>
        )}
      </section>

      <section className="gd-card">
        <div className="gd-card-heading">
          <div>
            <span>03</span>
            <h2>Maintenance</h2>
          </div>
        </div>

        {version ? (
          <div className="gd-grid">
            <Info
              label="Type de maintenance"
              value={version.type_maintenance}
            />

            <Info
              label="Périodicité"
              value={version.periodicite}
            />

            <Info
              label="Main-d'œuvre"
              value={version.main_oeuvre}
            />

            <Info
              label="Durée"
              value={
                version.duree_minutes !== null &&
                version.duree_minutes !== undefined
                  ? `${version.duree_minutes} min`
                  : null
              }
            />

            <Info
              label="Type d'arrêt"
              value={version.type_arret}
            />

            <Info
              label="Rédacteur"
              value={version.redacteur}
            />

            <Info
              label="Modifications"
              value={version.modifications}
            />
          </div>
        ) : (
          <p className="gd-empty">
            Aucune version enregistrée.
          </p>
        )}
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="gd-info">
      <span>{label}</span>
      <strong>{display(value)}</strong>
    </div>
  );
}