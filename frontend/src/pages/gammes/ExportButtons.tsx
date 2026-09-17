import { useState } from "react";
import api from "../../api/axios";

interface ExportButtonsProps {
  versionId: string;
  codeGamme?: string;
}

/**
 * Affiche les boutons de génération documentaire d'une version.
 *
 * Les documents sont demandés directement au backend Django.
 * Axios est utilisé afin de conserver l'authentification JWT.
 * Les réponses sont récupérées sous forme de Blob puis téléchargées
 * localement par le navigateur.
 */
export default function ExportButtons({
  versionId,
  codeGamme = "gamme",
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<"pdf" | "word" | null>(null);
  const [error, setError] = useState("");

  /**
   * Télécharge un Blob reçu depuis Django.
   *
   * @param blob contenu binaire du fichier
   * @param filename nom proposé au navigateur
   */
  function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  }

  /**
   * Génère puis télécharge le PDF de la version.
   *
   * Endpoint :
   * POST /api/versions/{versionId}/export_pdf/
   *
   * En cas d'erreur, aucun changement de page n'est effectué.
   */
  async function handlePdf(): Promise<void> {
    try {
      setLoading("pdf");
      setError("");

      const response = await api.post(
        `/versions/${versionId}/export_pdf/`,
        {},
        {
          responseType: "blob",
        }
      );

      downloadBlob(
        response.data,
        `${codeGamme}_${versionId}.pdf`
      );
    } catch (err) {
      console.error("Erreur génération PDF :", err);
      setError("Impossible de générer le PDF.");
    } finally {
      setLoading(null);
    }
  }

  /**
   * Génère puis télécharge le document Word de la version.
   *
   * Endpoint :
   * POST /api/versions/{versionId}/export_word/
   */
  async function handleWord(): Promise<void> {
    try {
      setLoading("word");
      setError("");

      const response = await api.post(
        `/versions/${versionId}/export_word/`,
        {},
        {
          responseType: "blob",
        }
      );

      downloadBlob(
        response.data,
        `${codeGamme}_${versionId}.docx`
      );
    } catch (err) {
      console.error("Erreur génération Word :", err);
      setError("Impossible de générer le document Word.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePdf}
        disabled={loading !== null}
      >
        {loading === "pdf" ? "Génération..." : "Télécharger PDF"}
      </button>

      <button
        type="button"
        onClick={handleWord}
        disabled={loading !== null}
      >
        {loading === "word" ? "Génération..." : "Télécharger Word"}
      </button>

      {error && <p>{error}</p>}
    </div>
  );
}
