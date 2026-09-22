import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  Building2,
  Eye,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";

import "./Entreprises.css";


/* ============================================================
   TYPES
   ============================================================ */

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};


type Entreprise = {
  id: string;
  nom: string;
  logo_url?: string | null;
  actif: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};


type EntrepriseForm = {
  nom: string;
  logo_url: string;
  actif: boolean;
};


const emptyForm: EntrepriseForm = {
  nom: "",
  logo_url: "",
  actif: true,
};


/* ============================================================
   OUTILS
   ============================================================ */

function extractResults<T>(
  data: T[] | PaginatedResponse<T> | null | undefined,
): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data.results)
    ? data.results
    : [];
}


function apiErrorMessage(
  error: any,
  fallback: string,
): string {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  for (const [field, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0) {
      return `${field} : ${String(value[0])}`;
    }

    if (typeof value === "string") {
      return `${field} : ${value}`;
    }
  }

  return fallback;
}


function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */

export default function Entreprises() {

  /* ==========================================================
     DONNEES
     ========================================================== */

  const [items, setItems] =
    useState<Entreprise[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  /* ==========================================================
     MODALES
     ========================================================== */

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Entreprise | null>(null);

  const [viewing, setViewing] =
    useState<Entreprise | null>(null);


  /* ==========================================================
     FORMULAIRE
     ========================================================== */

  const [form, setForm] =
    useState<EntrepriseForm>({
      ...emptyForm,
    });


  /* ==========================================================
     CHARGEMENT DES ENTREPRISES
     ========================================================== */

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<
          Entreprise[] | PaginatedResponse<Entreprise>
        >(
          "/entreprises/",
        );

      const results =
        extractResults(response.data)
          .filter(Boolean)
          .slice()
          .sort((a, b) =>
            a.nom.localeCompare(
              b.nom,
              "fr",
              {
                sensitivity: "base",
              },
            ),
          );

      setItems(results);

    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Impossible de charger les entreprises.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();

    // Le chargement initial doit être exécuté une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ==========================================================
     CREATION
     ========================================================== */

  const startCreate = () => {
    setEditing(null);

    setForm({
      ...emptyForm,
    });

    setError("");
    setMessage("");

    setOpen(true);
  };


  /* ==========================================================
     MODIFICATION
     ========================================================== */

  const startEdit = (
    item: Entreprise,
  ) => {
    setEditing(item);

    setForm({
      nom: item.nom ?? "",
      logo_url: item.logo_url ?? "",
      actif: item.actif ?? true,
    });

    setError("");
    setMessage("");

    setOpen(true);
  };


  /* ==========================================================
     IMAGE / LOGO
     ========================================================== */

  const handleLogoChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    /* --------------------------------------------------------
       VERIFICATION DU TYPE
       -------------------------------------------------------- */

    if (!file.type.startsWith("image/")) {
      setError(
        "Le fichier sélectionné doit être une image.",
      );

      event.target.value = "";

      return;
    }


    /* --------------------------------------------------------
       VERIFICATION DE LA TAILLE
       -------------------------------------------------------- */

    const maxSize =
      2 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Le logo ne doit pas dépasser 2 Mo.",
      );

      event.target.value = "";

      return;
    }


    /* --------------------------------------------------------
       CONVERSION EN DATA URL
       -------------------------------------------------------- */

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        typeof reader.result === "string"
          ? reader.result
          : "";

      setForm(
        (current) => ({
          ...current,
          logo_url: result,
        }),
      );

      setError("");
    };

    reader.onerror = () => {
      setError(
        "Impossible de lire l'image sélectionnée.",
      );
    };

    reader.readAsDataURL(file);
  };


  const removeLogo = () => {
    setForm(
      (current) => ({
        ...current,
        logo_url: "",
      }),
    );
  };


  /* ==========================================================
     ENREGISTREMENT
     ========================================================== */

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();


    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!form.nom.trim()) {
      setError(
        "Le nom de l'entreprise est obligatoire.",
      );

      return;
    }


    /* --------------------------------------------------------
       PAYLOAD
       -------------------------------------------------------- */

    const payload = {
      nom: form.nom.trim(),
      logo_url:
        form.logo_url || null,
      actif:
        form.actif,
    };


    /* --------------------------------------------------------
       APPEL API
       -------------------------------------------------------- */

    try {
      setSaving(true);

      setError("");
      setMessage("");


      if (editing) {

        await api.patch(
          `/entreprises/${editing.id}/`,
          payload,
        );

        setMessage(
          "Entreprise modifiée avec succès.",
        );

      } else {

        await api.post(
          "/entreprises/",
          payload,
        );

        setMessage(
          "Entreprise ajoutée avec succès.",
        );
      }


      setOpen(false);

      await load();

    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Enregistrement impossible.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };


  /* ==========================================================
     SUPPRESSION
     ========================================================== */

  const remove = async (
    item: Entreprise,
  ) => {
    if (
      !window.confirm(
        `Supprimer l'entreprise « ${item.nom} » ?`,
      )
    ) {
      return;
    }


    try {
      setError("");
      setMessage("");

      await api.delete(
        `/entreprises/${item.id}/`,
      );


      setItems(
        (current) =>
          current.filter(
            (row) =>
              row.id !== item.id,
          ),
      );


      setMessage(
        "Entreprise supprimée.",
      );

    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Suppression impossible.",
        ),
      );
    }
  };


  /* ==========================================================
     ACTUALISATION
     ========================================================== */

  const handleRefresh = async () => {
    setOpen(false);
    setViewing(null);
    setEditing(null);

    setSearch("");

    setError("");
    setMessage("");

    setRefreshing(true);

    await load();

    setRefreshing(false);
  };


  /* ==========================================================
     RECHERCHE LOCALE
     ========================================================== */

  const filteredItems =
    items.filter(
      (item) =>
        item.nom
          .toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase(),
          ),
    );


  /* ==========================================================
     CHARGEMENT
     ========================================================== */

  if (loading) {
    return (
      <div className="entreprise-loading">
        <LoaderCircle
          className="spin"
          size={22}
        />

        Chargement des entreprises...
      </div>
    );
  }


  /* ==========================================================
     AFFICHAGE
     ========================================================== */

  return (
    <div className="entreprise-page">

      {/* =====================================================
          ENTETE
          ===================================================== */}

      <header className="entreprise-header">

        <div>
          <h1>
            Entreprises / Logos
          </h1>

          <p>
            Gérez les entreprises et les logos utilisés
            dans les gammes opératoires.
          </p>
        </div>


        <div className="entreprise-header-actions">

          <button
            type="button"
            className="entreprise-cancel"
            onClick={() =>
              void handleRefresh()
            }
            disabled={
              refreshing ||
              saving
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spin"
                  : undefined
              }
            />

            Actualiser
          </button>


          <button
            type="button"
            className="entreprise-create"
            onClick={startCreate}
          >
            <Plus size={18} />

            Nouvelle entreprise
          </button>

        </div>
      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (
        <div className="entreprise-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="entreprise-alert success">
          {message}
        </div>
      )}


      {/* =====================================================
          TABLEAU
          ===================================================== */}

      <section className="entreprise-card">

        <div className="entreprise-toolbar">

          <label className="entreprise-search">
            <Search size={18} />

            <input
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }
              placeholder="Rechercher une entreprise..."
            />
          </label>


          <span>
            {filteredItems.length} entreprise(s)
          </span>

        </div>


        <div className="entreprise-table-wrap">

          <table className="entreprise-table">

            <thead>
              <tr>
                <th>Logo</th>
                <th>Entreprise</th>
                <th>Date d'ajout</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>


            <tbody>

              {filteredItems.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    className="entreprise-empty"
                  >
                    Aucune entreprise.
                  </td>
                </tr>

              ) : (

                filteredItems.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>
                        <div className="entreprise-logo-cell">

                          {item.logo_url ? (

                            <img
                              src={item.logo_url}
                              alt={`Logo ${item.nom}`}
                            />

                          ) : (

                            <div className="entreprise-logo-empty">
                              <Building2 size={22} />
                            </div>

                          )}

                        </div>
                      </td>


                      <td>
                        <strong>
                          {item.nom}
                        </strong>
                      </td>


                      <td>
                        {formatDate(
                          item.created_at,
                        )}
                      </td>


                      <td>
                        <span
                          className={
                            item.actif
                              ? "entreprise-status active"
                              : "entreprise-status inactive"
                          }
                        >
                          {item.actif
                            ? "Actif"
                            : "Inactif"}
                        </span>
                      </td>


                      <td>
                        <div className="entreprise-actions">

                          <button
                            type="button"
                            title="Voir"
                            onClick={() =>
                              setViewing(item)
                            }
                          >
                            <Eye size={16} />
                          </button>


                          <button
                            type="button"
                            title="Modifier"
                            onClick={() =>
                              startEdit(item)
                            }
                          >
                            <Pencil size={16} />
                          </button>


                          <button
                            type="button"
                            className="danger"
                            title="Supprimer"
                            onClick={() =>
                              void remove(item)
                            }
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ),
                )

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* =====================================================
          MODALE VOIR
          ===================================================== */}

      {viewing && (

        <div
          className="entreprise-modal-backdrop"
          onMouseDown={() =>
            setViewing(null)
          }
        >

          <div
            className="entreprise-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="entreprise-modal-head">

              <div>
                <h2>
                  Détail de l'entreprise
                </h2>

                <p>
                  {viewing.nom}
                </p>
              </div>


              <button
                type="button"
                onClick={() =>
                  setViewing(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            <div className="entreprise-view">

              <div className="entreprise-view-logo">

                {viewing.logo_url ? (

                  <img
                    src={viewing.logo_url}
                    alt={`Logo ${viewing.nom}`}
                  />

                ) : (

                  <div className="entreprise-logo-placeholder">
                    <Building2 size={50} />

                    <span>
                      Aucun logo
                    </span>
                  </div>

                )}

              </div>


              <div className="entreprise-view-info">

                <div>
                  <span>
                    Entreprise
                  </span>

                  <strong>
                    {viewing.nom}
                  </strong>
                </div>


                <div>
                  <span>
                    Statut
                  </span>

                  <strong>
                    {viewing.actif
                      ? "Active"
                      : "Inactive"}
                  </strong>
                </div>


                <div>
                  <span>
                    Date d'ajout
                  </span>

                  <strong>
                    {formatDate(
                      viewing.created_at,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Dernière modification
                  </span>

                  <strong>
                    {formatDate(
                      viewing.updated_at,
                    )}
                  </strong>
                </div>

              </div>

            </div>


            <div className="entreprise-modal-actions">

              <button
                type="button"
                className="entreprise-cancel"
                onClick={() =>
                  setViewing(null)
                }
              >
                Fermer
              </button>


              <button
                type="button"
                className="entreprise-create"
                onClick={() => {
                  const selected =
                    viewing;

                  setViewing(null);

                  startEdit(selected);
                }}
              >
                <Pencil size={16} />

                Modifier
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          MODALE CREATION / MODIFICATION
          ===================================================== */}

      {open && (

        <div
          className="entreprise-modal-backdrop"
          onMouseDown={() => {
            if (!saving) {
              setOpen(false);
            }
          }}
        >

          <form
            className="entreprise-modal"
            onSubmit={submit}
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="entreprise-modal-head">

              <div>

                <h2>
                  {editing
                    ? "Modifier l'entreprise"
                    : "Nouvelle entreprise"}
                </h2>

                <p>
                  Nom, logo et statut de l'entreprise.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                disabled={saving}
              >
                <X size={20} />
              </button>

            </div>


            <div className="entreprise-form">

              {/* NOM */}

              <label>
                <span>
                  Nom de l'entreprise *
                </span>

                <input
                  required
                  value={form.nom}
                  placeholder="Ex. ACTEMIUM"
                  onChange={
                    (event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          nom:
                            event.target.value,
                        }),
                      )
                  }
                />
              </label>


              {/* LOGO */}

              <div className="entreprise-logo-section">

                <span className="entreprise-field-title">
                  Logo
                </span>


                <div className="entreprise-logo-editor">

                  <div className="entreprise-logo-preview">

                    {form.logo_url ? (

                      <img
                        src={form.logo_url}
                        alt="Aperçu du logo"
                      />

                    ) : (

                      <div className="entreprise-logo-placeholder">
                        <ImagePlus size={38} />

                        <span>
                          Aucun logo
                        </span>
                      </div>

                    )}

                  </div>


                  <div className="entreprise-logo-buttons">

                    <label className="entreprise-upload">

                      <ImagePlus size={17} />

                      Choisir une image

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={
                          handleLogoChange
                        }
                      />

                    </label>


                    {form.logo_url && (

                      <button
                        type="button"
                        className="entreprise-remove-logo"
                        onClick={
                          removeLogo
                        }
                      >
                        <Trash2 size={16} />

                        Retirer le logo
                      </button>

                    )}

                  </div>

                </div>


                <small>
                  PNG, JPG, WEBP ou SVG — maximum 2 Mo.
                </small>

              </div>


              {/* ACTIF */}

              <label className="entreprise-checkbox">

                <input
                  type="checkbox"
                  checked={
                    form.actif
                  }
                  onChange={
                    (event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          actif:
                            event.target.checked,
                        }),
                      )
                  }
                />

                <span>
                  Entreprise active
                </span>

              </label>

            </div>


            <div className="entreprise-modal-actions">

              <button
                type="button"
                className="entreprise-cancel"
                onClick={() =>
                  setOpen(false)
                }
                disabled={saving}
              >
                Annuler
              </button>


              <button
                type="submit"
                className="entreprise-create"
                disabled={saving}
              >

                {saving ? (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                ) : (
                  <Building2 size={17} />
                )}


                {editing
                  ? "Enregistrer les modifications"
                  : "Ajouter l'entreprise"}

              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  );
}