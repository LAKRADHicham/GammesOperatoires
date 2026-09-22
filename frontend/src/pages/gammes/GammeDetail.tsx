import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CopyPlus,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
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
  date_version?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PaginatedResponse<T> = { results: T[] };

function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
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

    // Compatibilité avec les anciennes versions
    case "brouillon":
      return "En cours de création";

    default:
      return display(status);
  }
}

function equipmentFromGamme(gamme: Gamme | null): Equipment | null {
  if (!gamme?.equipement || typeof gamme.equipement === "string") return null;
  return gamme.equipement;
}

function fileNameFromDisposition(disposition: string | undefined, fallback: string) {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

export default function GammeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [gamme, setGamme] = useState<Gamme | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedVersion = useMemo(
    () => versions.find((item) => item.id === selectedVersionId) ?? versions[0] ?? null,
    [versions, selectedVersionId],
  );

  const loadGamme = async (keepSelection = true) => {
    if (!id) {
      setError("Identifiant de gamme manquant.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [gammeResponse, versionsResponse] = await Promise.all([
        api.get<Gamme>(`/gammes/${id}/`),
        api.get<Version[] | PaginatedResponse<Version>>(`/gammes/${id}/versions/`),
      ]);

      const loadedVersions = extractResults(versionsResponse.data)
        .slice()
        .sort((a, b) => Number(b.numero_version ?? 0) - Number(a.numero_version ?? 0));

      setGamme(gammeResponse.data);
      setVersions(loadedVersions);

      const stillExists = keepSelection && loadedVersions.some((v) => v.id === selectedVersionId);
      if (!stillExists) setSelectedVersionId(loadedVersions[0]?.id ?? "");
    } catch (err) {
      console.error(err);
      setError("Impossible de charger cette gamme opératoire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadGamme(false); }, [id]);

  const download = async (kind: "pdf" | "word") => {
    if (!selectedVersion || !gamme) return;
    setBusy(kind);
    setError("");
    setMessage("");

    try {
      const endpoint = kind === "pdf" ? "export_pdf" : "export_word";
      const extension = kind === "pdf" ? "pdf" : "docx";
      const response = await api.post(
        `/versions/${selectedVersion.id}/${endpoint}/`,
        {},
        { responseType: "blob" },
      );

      const fallback = `${gamme.code}_${selectedVersion.code_version || "V0"}.${extension}`;
      const filename = fileNameFromDisposition(response.headers?.["content-disposition"], fallback);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(`Impossible de générer le fichier ${kind === "pdf" ? "PDF" : "Word"}.`);
    } finally {
      setBusy("");
    }
  };

  const runVersionAction = async (action: "clone" | "submit" | "validate_version") => {
    if (!selectedVersion) return;
    setBusy(action);
    setError("");
    setMessage("");

    try {
      await api.post(`/versions/${selectedVersion.id}/${action}/`, {});
      setMessage(
        action === "clone"
          ? "Nouvelle version créée."
          : action === "submit"
            ? "Version envoyée en validation."
            : "Version validée.",
      );
      await loadGamme(false);
    } catch (err) {
      console.error(err);
      setError("L'action sur la version a échoué.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <div className="gamme-detail-loading"><LoaderCircle className="spin" size={28} />Chargement...</div>;
  }

  if (!gamme) {
    return (
      <div className="gamme-detail-page">
        <div className="gamme-detail-error">{error || "Gamme introuvable."}</div>
        <button type="button" className="gd-secondary" onClick={() => navigate("/gammes")}>
          <ArrowLeft size={17} /> Retour aux gammes
        </button>
      </div>
    );
  }

  const equipment = equipmentFromGamme(gamme);

  return (
    <div className="gamme-detail-page">
      <header className="gamme-detail-header">
        <div>
          <button type="button" className="gd-back" onClick={() => navigate("/gammes")}>
            <ArrowLeft size={17} /> Gammes opératoires
          </button>
          <p className="gd-kicker">MAINTENANCE INDUSTRIELLE</p>
          <h1>{gamme.code}</h1>
          <p>{gamme.designation}</p>
        </div>

        <div className="gd-header-actions">
          <button type="button" className="gd-secondary" onClick={() => void loadGamme()}>
            <RefreshCw size={17} /> Actualiser
          </button>
          <button type="button" className="gd-secondary" onClick={() => navigate(`/gammes/${gamme.id}/modifier`)}>
            <Pencil size={17} /> Modifier
          </button>
          <button type="button" className="gd-secondary" disabled={!selectedVersion || Boolean(busy)} onClick={() => void download("word")}>
            {busy === "word" ? <LoaderCircle className="spin" size={17} /> : <FileText size={17} />} Word
          </button>
          <button type="button" className="gd-primary" disabled={!selectedVersion || Boolean(busy)} onClick={() => void download("pdf")}>
            {busy === "pdf" ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />} PDF
          </button>
        </div>
      </header>

      {error && <div className="gamme-detail-error">{error}</div>}
      {message && <div className="gd-card"><strong>{message}</strong></div>}

      <div className="gd-summary">
        <div><span>Code</span><strong>{gamme.code}</strong></div>
        <div><span>Abréviation</span><strong>{display(gamme.abreviation)}</strong></div>
        <div><span>Version affichée</span><strong>{selectedVersion?.code_version || "—"}</strong></div>
        <div><span>Statut</span><strong>{statusLabel(selectedVersion?.statut)}</strong></div>
      </div>

      <section className="gd-card">
        <div className="gd-card-heading"><div><span>01</span><div><h2>Version sélectionnée</h2><p>Consultez son état et utilisez uniquement les actions disponibles pour son statut.</p></div></div></div>
        <div className="gd-grid">
          <div className="gd-info">
            <span>Version à consulter</span>
            <select value={selectedVersion?.id ?? ""} onChange={(e) => setSelectedVersionId(e.target.value)}>
              {versions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code_version || `V${item.numero_version ?? 0}`} — {statusLabel(item.statut)}
                </option>
              ))}
            </select>
          </div>
          <Info label="Date" value={selectedVersion?.date_version || selectedVersion?.created_at} />
          <Info label="Rédacteur" value={selectedVersion?.redacteur} />
          <Info label="Valideur" value={selectedVersion?.valideur} />
          <Info label="Modifications" value={selectedVersion?.modifications} />
          <Info label="Durée" value={selectedVersion?.duree_minutes != null ? `${selectedVersion.duree_minutes} min` : null} />
        </div>

        <div className="gd-header-actions">
          {(
            selectedVersion?.statut === "en_cours_creation" ||
            selectedVersion?.statut === "en_cours_modification" ||
            selectedVersion?.statut === "brouillon"
          ) && (
            <button type="button" className="gd-primary" disabled={Boolean(busy)} onClick={() => void runVersionAction("submit")}>
              <Send size={17} /> Envoyer en validation
            </button>
          )}
          {selectedVersion?.statut === "en_validation" && (
            <button type="button" className="gd-primary" disabled={Boolean(busy)} onClick={() => void runVersionAction("validate_version")}>
              <ShieldCheck size={17} /> Valider la version
            </button>
          )}
          {selectedVersion?.statut === "validee" && (
            <button type="button" className="gd-primary" disabled={Boolean(busy)} onClick={() => void runVersionAction("clone")}>
              <CopyPlus size={17} /> Créer la version suivante
            </button>
          )}
        </div>
      </section>

      <section className="gd-card">
        <div className="gd-card-heading"><div><span>02</span><div><h2>Historique des versions</h2><p>La version la plus récente apparaît en premier.</p></div></div></div>
        <div className="gd-grid">
          {versions.map((item) => (
            <button key={item.id} type="button" className={`gd-info gd-version-history-item ${item.id === selectedVersion?.id ? "is-selected" : ""}`} onClick={() => setSelectedVersionId(item.id)}>
              <span>{item.code_version || `V${item.numero_version ?? 0}`}</span>
              <strong>{statusLabel(item.statut)}</strong>
              <small>{display(item.modifications)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="gd-card">
        <div className="gd-card-heading"><div><span>03</span><div><h2>Informations générales</h2><p>Données principales de la gamme opératoire.</p></div></div></div>
        <div className="gd-grid">
          <Info label="Code gamme" value={gamme.code} />
          <Info label="Intitulé" value={gamme.designation} />
          <Info label="Abréviation" value={gamme.abreviation} />
          <Info label="Corps de métier" value={gamme.corps_metier} />
          <Info label="Type de rédaction" value={gamme.type_redaction} />
          <Info label="État" value={gamme.actif === false ? "Inactive" : "Active"} />
        </div>
      </section>

      <section className="gd-card">
        <div className="gd-card-heading"><div><span>04</span><div><h2>Équipement</h2><p>Équipement associé à la gamme.</p></div></div></div>
        {equipment ? (
          <div className="gd-grid">
            <Info label="Nom" value={equipment.nom} />
            <Info label="Code" value={equipment.code} />
            <Info label="Constructeur" value={equipment.constructeur} />
            <Info label="Type machine" value={equipment.type} />
            <Info label="Référence" value={equipment.reference} />
          </div>
        ) : <p className="gd-empty">Aucun équipement détaillé disponible.</p>}
      </section>

      <section className="gd-card">
        <div className="gd-card-heading"><div><span>05</span><div><h2>Maintenance de la version</h2><p>Paramètres techniques de la version sélectionnée.</p></div></div></div>
        {selectedVersion ? (
          <div className="gd-grid">
            <Info label="Type de maintenance" value={selectedVersion.type_maintenance} />
            <Info label="Périodicité" value={selectedVersion.periodicite} />
            <Info label="Main-d'œuvre" value={selectedVersion.main_oeuvre} />
            <Info label="Durée" value={selectedVersion.duree_minutes != null ? `${selectedVersion.duree_minutes} min` : null} />
            <Info label="Type d'arrêt" value={selectedVersion.type_arret} />
            <Info label="Modifications" value={selectedVersion.modifications} />
          </div>
        ) : <p className="gd-empty">Aucune version enregistrée.</p>}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="gd-info"><span>{label}</span><strong>{display(value)}</strong></div>;
}
