import { useEffect, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../api/axios";
import "./GammeEdit.css";

type Gamme = {
  id: string;
  code: string;
  designation: string;
  abreviation?: string | null;
  description?: string | null;
  actif?: boolean;
  corps_metier?: string | null;
  type_redaction?: string | null;
};

type RefValue = {
  id?: string;
  code: string;
  libelle: string;
  actif?: boolean;
  ordre?: number;
};

type PaginatedResponse<T> = {
  results: T[];
};

type FormState = {
  code: string;
  designation: string;
  abreviation: string;
  description: string;
  corps_metier: string;
  type_redaction: string;
  actif: boolean;
};

function extractResults<T>(
  data: T[] | PaginatedResponse<T> | null | undefined,
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

const initialForm: FormState = {
  code: "",
  designation: "",
  abreviation: "",
  description: "",
  corps_metier: "",
  type_redaction: "",
  actif: true,
};

export default function GammeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialForm);

  const [corpsMetiers, setCorpsMetiers] = useState<RefValue[]>([]);
  const [typesRedaction, setTypesRedaction] = useState<RefValue[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("Identifiant de gamme manquant.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          gammeResponse,
          corpsResponse,
          redactionResponse,
        ] = await Promise.all([
          api.get<Gamme>(`/gammes/${id}/`),

          api.get<RefValue[] | PaginatedResponse<RefValue>>(
            "/v2/referentiels/?categorie=corps_metier",
          ),

          api.get<RefValue[] | PaginatedResponse<RefValue>>(
            "/v2/referentiels/?categorie=type_redaction",
          ),
        ]);

        const gamme = gammeResponse.data;

        setForm({
          code: gamme.code || "",
          designation: gamme.designation || "",
          abreviation: gamme.abreviation || "",
          description: gamme.description || "",
          corps_metier: gamme.corps_metier || "",
          type_redaction: gamme.type_redaction || "",
          actif: gamme.actif !== false,
        });

        setCorpsMetiers(
          extractResults(corpsResponse.data)
            .filter((item) => item.actif !== false)
            .sort(
              (a, b) =>
                Number(a.ordre ?? 0) -
                Number(b.ordre ?? 0),
            ),
        );

        setTypesRedaction(
          extractResults(redactionResponse.data)
            .filter((item) => item.actif !== false)
            .sort(
              (a, b) =>
                Number(a.ordre ?? 0) -
                Number(b.ordre ?? 0),
            ),
        );
      } catch (err) {
        console.error(err);
        setError("Impossible de charger cette gamme.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = async () => {
    if (!id) return;

    if (!form.code.trim() || !form.designation.trim()) {
      setError("Le code et l'intitulé sont obligatoires.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      /*
       * Données appartenant directement à gammes_operatoires.
       */
      await api.patch(`/gammes/${id}/`, {
        code: form.code.trim().toUpperCase(),
        designation: form.designation.trim(),
        abreviation: form.abreviation.trim() || null,
        description: form.description.trim() || null,
        actif: form.actif,
      });

      /*
       * Métadonnées V2 de la gamme.
       * On ne touche pas ici à l'image existante.
       */
      await api.patch(`/v2/gammes/${id}/metadata/`, {
        corps_metier: form.corps_metier || null,
        type_redaction: form.type_redaction || null,
      });

      navigate(`/gammes/${id}`);
    } catch (err: any) {
      console.error(err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.code ||
        err?.message;

      setError(
        typeof detail === "string"
          ? detail
          : "Impossible d'enregistrer les modifications.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="gamme-edit-loading">
        <LoaderCircle className="spin" size={28} />
        Chargement...
      </div>
    );
  }

  return (
    <div className="gamme-edit-page">
      <header className="ge-header">
        <div>
          <button
            type="button"
            className="ge-back"
            onClick={() => navigate(`/gammes/${id}`)}
          >
            <ArrowLeft size={17} />
            Retour à la gamme
          </button>

          <p>MAINTENANCE INDUSTRIELLE</p>
          <h1>Modifier la gamme</h1>
        </div>

        <button
          type="button"
          className="ge-primary"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Save size={17} />
          )}

          Enregistrer
        </button>
      </header>

      {error && <div className="ge-error">{error}</div>}

      <section className="ge-card">
        <div className="ge-title">
          <span>01</span>
          <div>
            <h2>Informations générales</h2>
            <p>Modifiez les informations principales de la gamme.</p>
          </div>
        </div>

        <div className="ge-grid">
          <label>
            <span>Code de la gamme *</span>

            <input
              value={form.code}
              onChange={(event) =>
                update("code", event.target.value.toUpperCase())
              }
            />
          </label>

          <label>
            <span>Abréviation</span>

            <input
              value={form.abreviation}
              onChange={(event) =>
                update(
                  "abreviation",
                  event.target.value.toUpperCase(),
                )
              }
            />
          </label>

          <label className="ge-span-2">
            <span>Intitulé de l'opération *</span>

            <input
              value={form.designation}
              onChange={(event) =>
                update("designation", event.target.value)
              }
            />
          </label>

          <label>
            <span>Corps de métier</span>

            <select
              value={form.corps_metier}
              onChange={(event) =>
                update("corps_metier", event.target.value)
              }
            >
              <option value="">Sélectionner</option>

              {corpsMetiers.map((item) => (
                <option
                  key={item.id ?? item.code}
                  value={item.code}
                >
                  {item.libelle}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type de rédaction</span>

            <select
              value={form.type_redaction}
              onChange={(event) =>
                update("type_redaction", event.target.value)
              }
            >
              <option value="">Sélectionner</option>

              {typesRedaction.map((item) => (
                <option
                  key={item.id ?? item.code}
                  value={item.code}
                >
                  {item.libelle}
                </option>
              ))}
            </select>
          </label>

          <label className="ge-span-2">
            <span>Description</span>

            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                update("description", event.target.value)
              }
            />
          </label>

          <label className="ge-checkbox">
            <input
              type="checkbox"
              checked={form.actif}
              onChange={(event) =>
                update("actif", event.target.checked)
              }
            />

            <span>Gamme active</span>
          </label>
        </div>
      </section>

      <div className="ge-actions">
        <button
          type="button"
          className="ge-secondary"
          disabled={saving}
          onClick={() => navigate(`/gammes/${id}`)}
        >
          Annuler
        </button>

        <button
          type="button"
          className="ge-primary"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Save size={17} />
          )}

          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}