import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";
type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

type Equipement = {
  id: string;
  code?: string | null;
  nom: string;
  constructeur?: string | null;
  type?: string | null;
  reference?: string | null;
  description?: string | null;
  actif?: boolean | null;
};

/**
 * Accepte une réponse API sous forme de tableau ou de page DRF.
 * Cette fonction évite de casser la page si la pagination évolue.
 */
function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Transforme les erreurs DRF/Axios en message lisible.
 */
function apiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length) return `${field} : ${String(value[0])}`;
    if (typeof value === "string") return `${field} : ${value}`;
  }
  return fallback;
}
import "./Equipements.css";

/**
 * ÉQUIPEMENTS = table dédiée `equipements`.
 * Cette page ne crée aucune liste déroulante pour constructeur, type ou référence.
 */
type EquipmentForm = {
  code: string;
  nom: string;
  constructeur: string;
  type: string;
  reference: string;
  description: string;
};

const emptyForm: EquipmentForm = {
  code: "",
  nom: "",
  constructeur: "",
  type: "",
  reference: "",
  description: "",
};

export default function Equipements() {
  const [items, setItems] = useState<Equipement[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipement | null>(null);
  const [form, setForm] = useState<EquipmentForm>(emptyForm);

  /** Charge la base unique des équipements depuis Supabase. */
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<Equipement[] | PaginatedResponse<Equipement>>(
        "/equipements/",
      );
      setItems(
        extractResults(response.data)
          .filter(Boolean)
          .slice()
          .sort((a, b) => String(a.code ?? a.nom).localeCompare(String(b.code ?? b.nom), "fr")),
      );
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, "Impossible de charger les équipements."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /** Recherche locale sans nouvel appel API. */
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) =>
      [item.code, item.nom, item.constructeur ?? "", item.type ?? "", item.reference ?? ""]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(query)),
    );
  }, [items, search]);

  /** Ouvre un formulaire vide pour créer un équipement. */
  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setOpen(true);
  };

  /** Charge la fiche sélectionnée pour modification. */
  const startEdit = (item: Equipement) => {
    setEditing(item);
    setForm({
      code: item.code ?? "",
      nom: item.nom ?? "",
      constructeur: item.constructeur ?? "",
      type: item.type ?? "",
      reference: item.reference ?? "",
      description: (item as Equipement & { description?: string | null }).description ?? "",
    });
    setError("");
    setMessage("");
    setOpen(true);
  };

  /**
   * Enregistre directement dans la table `equipements`.
   * Constructeur, type et référence restent des champs texte de la fiche équipement.
   */
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim() || !form.nom.trim()) {
      setError("Le code et l’intitulé de l’équipement sont obligatoires.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      nom: form.nom.trim(),
      constructeur: form.constructeur.trim() || null,
      type: form.type.trim() || null,
      reference: form.reference.trim() || null,
      description: form.description.trim() || null,
      actif: true,
    };

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editing) {
        await api.patch(`/equipements/${editing.id}/`, payload);
        setMessage("Équipement modifié avec succès.");
      } else {
        const response = await api.post("/equipements/", payload);
        if (!response?.data?.id) {
          throw new Error("Le backend n’a pas retourné l’identifiant de l’équipement créé.");
        }
        setMessage("Équipement ajouté avec succès.");
      }

      setOpen(false);
      await load();
    } catch (err: any) {
      console.error(err);
      setError(apiErrorMessage(err, "Enregistrement impossible."));
    } finally {
      setSaving(false);
    }
  };

  /** Supprime l’équipement ; le backend peut refuser s’il est déjà utilisé. */
  const remove = async (item: Equipement) => {
    const name = item.code ? `${item.code} — ${item.nom}` : item.nom;
    if (!window.confirm(`Supprimer l'équipement « ${name} » ?`)) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/equipements/${item.id}/`);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setMessage("Équipement supprimé.");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Suppression impossible. L'équipement peut déjà être utilisé par une gamme.",
      );
    }
  };

  /**
   * Actualiser remet la page dans un état propre puis recharge Supabase.
   * On évite un rechargement complet du navigateur pour ne pas perturber la session JWT.
   */
  const handleRefresh = async () => {
    setOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
    setSearch("");
    setError("");
    setMessage("");
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="equipment-loading">
        <LoaderCircle className="spin" size={22} /> Chargement des équipements...
      </div>
    );
  }

  return (
    <div className="equipment-page">
      <header className="equipment-header">
        <div>
          <h1>Équipements</h1>
          <p>Ajoutez, modifiez ou supprimez les équipements utilisés dans le Wizard.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="equipment-cancel"
            onClick={() => void handleRefresh()}
            disabled={refreshing || saving}
          >
            <RefreshCw size={17} className={refreshing ? "spin" : undefined} />
            Actualiser
          </button>
          <button type="button" className="equipment-create" onClick={startCreate}>
            <Plus size={18} /> Nouvel équipement
          </button>
        </div>
      </header>

      {error && <div className="equipment-alert error">{error}</div>}
      {message && <div className="equipment-alert success">{message}</div>}

      <section className="equipment-card">
        <div className="equipment-toolbar">
          <label className="equipment-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un équipement..."
            />
          </label>
          <span>{filtered.length} équipement(s)</span>
        </div>

        <div className="equipment-table-wrap">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Intitulé</th>
                <th>Constructeur</th>
                <th>Type machine</th>
                <th>Référence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="equipment-empty">
                    Aucun équipement.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.code || "—"}</strong></td>
                    <td>{item.nom}</td>
                    <td>{item.constructeur || "—"}</td>
                    <td>{item.type || "—"}</td>
                    <td>{item.reference || "—"}</td>
                    <td>
                      <div className="eq-actions">
                        <button type="button" title="Modifier" onClick={() => startEdit(item)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          title="Supprimer"
                          onClick={() => void remove(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="equipment-modal-backdrop" onMouseDown={() => !saving && setOpen(false)}>
          <form
            className="equipment-modal"
            onSubmit={submit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="equipment-modal-head">
              <div>
                <h2>{editing ? "Modifier l'équipement" : "Ajouter un équipement"}</h2>
                <p>Ces informations seront disponibles dans la création d'une gamme.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="equipment-form-grid">
              <label>
                <span>Code équipement *</span>
                <input
                  required
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Intitulé équipement *</span>
                <input
                  required
                  value={form.nom}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nom: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Constructeur</span>
                <input
                  value={form.constructeur}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, constructeur: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Type machine</span>
                <input
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, type: event.target.value }))
                  }
                />
              </label>
              <label className="equipment-span-2">
                <span>Référence machine</span>
                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, reference: event.target.value }))
                  }
                />
              </label>
              <label className="equipment-span-2">
                <span>Description</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="equipment-modal-actions">
              <button type="button" className="equipment-cancel" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button type="submit" className="equipment-create" disabled={saving}>
                {saving ? <LoaderCircle className="spin" size={17} /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}