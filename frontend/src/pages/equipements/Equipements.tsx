import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Factory,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import api from "../../api/axios";

import "./Equipements.css";


/* ============================================================
   TYPES GENERIQUES API
   ============================================================ */

/**
 * Structure utilisée lorsque Django REST Framework
 * retourne une réponse paginée.
 *
 * La fonction extractResults() située plus bas permet
 * également de supporter une API qui retournerait
 * directement un tableau.
 */
type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};


/**
 * Structure retournée par :
 *
 * GET /equipements/options/
 *
 * Exemple :
 *
 * {
 *   "field": "constructeur",
 *   "query": "sch",
 *   "count": 2,
 *   "results": [
 *      "Schneider",
 *      "Schneider Electric"
 *   ]
 * }
 */
type EquipmentOptionsResponse = {
  field: string;
  query?: string;
  count?: number;
  results: string[];
};


/**
 * Structure retournée par :
 *
 * GET /equipements/next-code/
 *
 * Exemple :
 *
 * {
 *   "code": "EQP-035562",
 *   "number": 35562
 * }
 */
type NextCodeResponse = {
  code: string;
  number?: number;
};


/* ============================================================
   TYPE EQUIPEMENT
   ============================================================ */

/**
 * Représentation frontend de la table PostgreSQL :
 *
 *     equipements
 *
 * Les champs correspondent maintenant aux nouvelles
 * colonnes issues du fichier Excel des équipements.
 */
type Equipement = {
  id: string;

  // Identification
  code?: string | null;
  nom: string;

  // Localisation
  batiment?: string | null;
  etage?: string | null;
  local?: string | null;

  // Classification
  domaine?: string | null;

  // Informations techniques
  reference?: string | null;
  quantite?: number | null;
  constructeur?: string | null;
  modele?: string | null;

  // Maintenance
  gamme_job_plan?: string | null;
  date_intervention?: string | null;
  workorder_genere_par?: string | null;

  // Informations complémentaires
  type?: string | null;
  description?: string | null;

  // Statut
  actif?: boolean | null;

  // Traçabilité
  created_at?: string | null;
  updated_at?: string | null;
};


/* ============================================================
   TYPE DU FORMULAIRE
   ============================================================ */

/**
 * Etat interne utilisé par le Wizard.
 *
 * Dans le formulaire, les valeurs sont principalement
 * conservées sous forme de chaînes.
 *
 * quantite reste un nombre pour simplifier sa validation.
 */
type EquipmentForm = {
  code: string;

  nom: string;

  batiment: string;
  etage: string;
  local: string;

  domaine: string;

  reference: string;
  quantite: number;
  constructeur: string;
  modele: string;

  gamme_job_plan: string;
  date_intervention: string;
  workorder_genere_par: string;

  type: string;
  description: string;

  actif: boolean;
};


/* ============================================================
   FORMULAIRE VIDE
   ============================================================ */

/**
 * Etat initial utilisé :
 *
 * - lors de la création ;
 * - après une actualisation ;
 * - après la fermeture du formulaire.
 */
const emptyForm: EquipmentForm = {
  code: "",

  nom: "",

  batiment: "",
  etage: "",
  local: "",

  domaine: "",

  reference: "",
  quantite: 1,
  constructeur: "",
  modele: "",

  gamme_job_plan: "",
  date_intervention: "",
  workorder_genere_par: "",

  type: "",
  description: "",

  actif: true,
};


/* ============================================================
   CHAMPS UTILISANT LES OPTIONS DE LA BASE
   ============================================================ */

/**
 * Ces champs peuvent :
 *
 * 1. proposer les valeurs déjà présentes dans la base ;
 * 2. accepter une nouvelle valeur saisie manuellement.
 *
 * Exemple :
 *
 * Constructeur :
 *
 *     Schneider
 *     Siemens
 *     ABB
 *
 * L'utilisateur peut sélectionner Schneider,
 * mais il peut aussi écrire :
 *
 *     Grundfos
 *
 * même si Grundfos n'existe pas encore.
 */
type OptionField =
  | "nom"
  | "batiment"
  | "etage"
  | "local"
  | "domaine"
  | "reference"
  | "constructeur"
  | "modele"
  | "gamme_job_plan"
  | "workorder_genere_par"
  | "type";


/* ============================================================
   FONCTIONS UTILITAIRES
   ============================================================ */

/**
 * Accepte :
 *
 * - un tableau ;
 * - une réponse paginée DRF.
 *
 * Cela permet de ne pas casser la page si la configuration
 * de pagination Django évolue.
 */
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


/**
 * Transforme les erreurs Axios / DRF
 * en message lisible pour l'utilisateur.
 */
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


/**
 * Convertit une chaîne vide en null.
 *
 * Exemple :
 *
 *     ""
 *
 * devient :
 *
 *     null
 *
 * alors que :
 *
 *     "Schneider"
 *
 * reste :
 *
 *     "Schneider"
 */
function nullableText(
  value: string,
): string | null {
  const cleaned = value.trim();

  return cleaned || null;
}


/* ============================================================
   COMPOSANT DE CHAMP RECHERCHABLE
   ============================================================ */

type CreatableInputProps = {
  label: string;
  field: OptionField;
  value: string;
  required?: boolean;
  placeholder?: string;

  onChange: (
    value: string,
  ) => void;
};


/**
 * Champ texte avec suggestions provenant de PostgreSQL.
 *
 * Fonctionnement :
 *
 * - l'utilisateur peut écrire normalement ;
 * - après la saisie, une requête est envoyée vers :
 *
 *     /equipements/options/
 *
 * - les valeurs existantes sont proposées ;
 * - cliquer sur une valeur remplit le champ ;
 * - une nouvelle valeur peut toujours être saisie.
 *
 * Aucun package supplémentaire comme react-select
 * n'est nécessaire.
 */
function CreatableInput({
  label,
  field,
  value,
  required = false,
  placeholder,
  onChange,
}: CreatableInputProps) {
  const [options, setOptions] = useState<string[]>([]);

  const [loadingOptions, setLoadingOptions] =
    useState(false);

  const [focused, setFocused] =
    useState(false);


  /* ----------------------------------------------------------
     CHARGEMENT DES OPTIONS
     ---------------------------------------------------------- */

  useEffect(() => {
    /**
     * Petit délai avant l'appel API.
     *
     * Cela évite d'envoyer une requête à chaque frappe
     * immédiatement.
     */
    const timer = window.setTimeout(
      async () => {
        try {
          setLoadingOptions(true);

          const response =
            await api.get<EquipmentOptionsResponse>(
              "/equipements/options/",
              {
                params: {
                  field,
                  q: value.trim(),
                  limit: 20,
                },
              },
            );

          setOptions(
            Array.isArray(response.data.results)
              ? response.data.results
              : [],
          );
        } catch (error) {
          /**
           * Une erreur de suggestions ne doit pas bloquer
           * tout le formulaire.
           *
           * L'utilisateur peut continuer à saisir
           * manuellement sa valeur.
           */
          console.error(
            `Impossible de charger les options du champ ${field}.`,
            error,
          );

          setOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      },
      250,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [field, value]);


  /* ----------------------------------------------------------
     AFFICHAGE
     ---------------------------------------------------------- */

  return (
    <label className="equipment-combobox">
      <span>
        {label}
        {required ? " *" : ""}
      </span>

      <div className="equipment-combobox-control">
        <input
          required={required}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            /**
             * Le délai permet au clic sur une suggestion
             * d'être traité avant la fermeture de la liste.
             */
            window.setTimeout(
              () => setFocused(false),
              150,
            );
          }}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />

        {loadingOptions && (
          <LoaderCircle
            size={16}
            className="spin equipment-combobox-loader"
          />
        )}
      </div>

      {focused && options.length > 0 && (
        <div className="equipment-combobox-options">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className="equipment-combobox-option"
              onMouseDown={(event) => {
                /**
                 * Empêche le input de perdre immédiatement
                 * le focus avant le traitement du clic.
                 */
                event.preventDefault();

                onChange(option);

                setFocused(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}


/* ============================================================
   COMPOSANT PRINCIPAL
   ============================================================ */

export default function Equipements() {
  /* ==========================================================
     DONNEES
     ========================================================== */

  const [items, setItems] =
    useState<Equipement[]>([]);


  /* ==========================================================
     RECHERCHE
     ========================================================== */

  const [search, setSearch] =
    useState("");


  /* ==========================================================
     ETATS DE CHARGEMENT
     ========================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  /* ==========================================================
     MESSAGES
     ========================================================== */

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  /* ==========================================================
     MODALE
     ========================================================== */

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState<Equipement | null>(null);


  /* ==========================================================
     WIZARD
     ========================================================== */

  const [step, setStep] =
    useState(1);

  const totalSteps = 4;


  /* ==========================================================
     FORMULAIRE
     ========================================================== */

  const [form, setForm] =
    useState<EquipmentForm>({
      ...emptyForm,
    });


  /* ==========================================================
     CHARGEMENT DES EQUIPEMENTS
     ========================================================== */

  /**
   * Charge les équipements depuis Django.
   *
   * Django récupère ensuite les informations
   * dans PostgreSQL / Supabase.
   */
  const load = async () => {
    try {
      setLoading(true);

      setError("");

      const response =
        await api.get<
          Equipement[] |
          PaginatedResponse<Equipement>
        >(
          "/equipements/",
        );

      const results =
        extractResults(response.data)
          .filter(Boolean)
          .slice()
          .sort(
            (a, b) =>
              String(
                a.code ?? a.nom,
              ).localeCompare(
                String(
                  b.code ?? b.nom,
                ),
                "fr",
              ),
          );

      setItems(results);
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Impossible de charger les équipements.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };


  /* ==========================================================
     CHARGEMENT INITIAL
     ========================================================== */

  useEffect(() => {
    void load();
  }, []);


  /* ==========================================================
     RECHERCHE LOCALE
     ========================================================== */

  /**
   * Recherche dans plusieurs colonnes.
   *
   * Exemple :
   *
   * - code ;
   * - équipement ;
   * - bâtiment ;
   * - étage ;
   * - local ;
   * - domaine ;
   * - constructeur ;
   * - modèle ;
   * - référence.
   */
  const filtered = useMemo(
    () => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return items;
      }

      return items.filter(
        (item) =>
          [
            item.code,
            item.nom,
            item.batiment,
            item.etage,
            item.local,
            item.domaine,
            item.reference,
            item.constructeur,
            item.modele,
            item.type,
            item.gamme_job_plan,
            item.workorder_genere_par,
          ]
            .map(
              (value) =>
                String(
                  value ?? "",
                ).toLowerCase(),
            )
            .some(
              (value) =>
                value.includes(query),
            ),
      );
    },
    [
      items,
      search,
    ],
  );


  /* ==========================================================
     CREATION
     ========================================================== */

  /**
   * Ouvre le Wizard pour créer un équipement.
   *
   * Le code est récupéré automatiquement depuis :
   *
   *     /equipements/next-code/
   */
  const startCreate = async () => {
    setEditing(null);

    setStep(1);

    setError("");

    setMessage("");

    setForm({
      ...emptyForm,
    });

    setOpen(true);


    try {
      const response =
        await api.get<NextCodeResponse>(
          "/equipements/next-code/",
        );

      setForm(
        (current) => ({
          ...current,
          code:
            response.data.code || "",
        }),
      );
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Impossible de générer le code équipement.",
        ),
      );
    }
  };


  /* ==========================================================
     MODIFICATION
     ========================================================== */

  /**
   * Charge toutes les informations de l'équipement
   * dans le Wizard.
   */
  const startEdit = (
    item: Equipement,
  ) => {
    setEditing(item);

    setStep(1);

    setForm({
      code:
        item.code ?? "",

      nom:
        item.nom ?? "",

      batiment:
        item.batiment ?? "",

      etage:
        item.etage ?? "",

      local:
        item.local ?? "",

      domaine:
        item.domaine ?? "",

      reference:
        item.reference ?? "",

      quantite:
        item.quantite ?? 1,

      constructeur:
        item.constructeur ?? "",

      modele:
        item.modele ?? "",

      gamme_job_plan:
        item.gamme_job_plan ?? "",

      date_intervention:
        item.date_intervention ?? "",

      workorder_genere_par:
        item.workorder_genere_par ?? "",

      type:
        item.type ?? "",

      description:
        item.description ?? "",

      actif:
        item.actif ?? true,
    });

    setError("");

    setMessage("");

    setOpen(true);
  };


  /* ==========================================================
     VALIDATION DES ETAPES
     ========================================================== */

  /**
   * Vérifie les informations obligatoires
   * avant de passer à l'étape suivante.
   */
  const canContinue = (): boolean => {
    if (step === 1) {
      return Boolean(
        form.batiment.trim() ||
        form.etage.trim() ||
        form.local.trim(),
      );
    }

    if (step === 2) {
      return Boolean(
        form.nom.trim(),
      );
    }

    return true;
  };


  /**
   * Passe à l'étape suivante.
   */
  const nextStep = () => {
    setError("");

    if (!canContinue()) {
      if (step === 1) {
        setError(
          "Renseignez au moins une information de localisation.",
        );
      } else if (step === 2) {
        setError(
          "L'intitulé de l'équipement est obligatoire.",
        );
      }

      return;
    }

    setStep(
      (current) =>
        Math.min(
          current + 1,
          totalSteps,
        ),
    );
  };


  /**
   * Retour à l'étape précédente.
   */
  const previousStep = () => {
    setError("");

    setStep(
      (current) =>
        Math.max(
          current - 1,
          1,
        ),
    );
  };


  /* ==========================================================
     ENREGISTREMENT
     ========================================================== */

  /**
   * Enregistre l'équipement dans PostgreSQL.
   *
   * Création :
   *
   *     POST /equipements/
   *
   * Modification :
   *
   *     PATCH /equipements/{id}/
   */
  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();


    /* --------------------------------------------------------
       VALIDATION
       -------------------------------------------------------- */

    if (!form.code.trim()) {
      setError(
        "Le code équipement est obligatoire.",
      );

      return;
    }

    if (!form.nom.trim()) {
      setError(
        "L'intitulé de l'équipement est obligatoire.",
      );

      setStep(2);

      return;
    }

    if (
      !Number.isFinite(form.quantite) ||
      form.quantite < 0
    ) {
      setError(
        "La quantité doit être supérieure ou égale à 0.",
      );

      setStep(2);

      return;
    }


    /* --------------------------------------------------------
       PAYLOAD API
       -------------------------------------------------------- */

    const payload = {
      code:
        form.code
          .trim()
          .toUpperCase(),

      nom:
        form.nom.trim(),

      batiment:
        nullableText(
          form.batiment,
        ),

      etage:
        nullableText(
          form.etage,
        ),

      local:
        nullableText(
          form.local,
        ),

      domaine:
        nullableText(
          form.domaine,
        ),

      reference:
        nullableText(
          form.reference,
        ),

      quantite:
        form.quantite,

      constructeur:
        nullableText(
          form.constructeur,
        ),

      modele:
        nullableText(
          form.modele,
        ),

      gamme_job_plan:
        nullableText(
          form.gamme_job_plan,
        ),

      date_intervention:
        form.date_intervention || null,

      workorder_genere_par:
        nullableText(
          form.workorder_genere_par,
        ),

      type:
        nullableText(
          form.type,
        ),

      description:
        nullableText(
          form.description,
        ),

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
          `/equipements/${editing.id}/`,
          payload,
        );

        setMessage(
          "Équipement modifié avec succès.",
        );
      } else {
        const response =
          await api.post(
            "/equipements/",
            payload,
          );

        if (!response?.data?.id) {
          throw new Error(
            "Le backend n'a pas retourné l'identifiant de l'équipement créé.",
          );
        }

        setMessage(
          "Équipement ajouté avec succès.",
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

  /**
   * Supprime un équipement.
   *
   * Le backend peut refuser la suppression si
   * l'équipement est déjà utilisé par une gamme.
   */
  const remove = async (
    item: Equipement,
  ) => {
    const name =
      item.code
        ? `${item.code} — ${item.nom}`
        : item.nom;

    if (
      !window.confirm(
        `Supprimer l'équipement « ${name} » ?`,
      )
    ) {
      return;
    }


    try {
      setError("");

      setMessage("");

      await api.delete(
        `/equipements/${item.id}/`,
      );

      setItems(
        (current) =>
          current.filter(
            (row) =>
              row.id !== item.id,
          ),
      );

      setMessage(
        "Équipement supprimé.",
      );
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Suppression impossible. L'équipement peut déjà être utilisé par une gamme.",
        ),
      );
    }
  };


  /* ==========================================================
     ACTUALISATION
     ========================================================== */

  /**
   * Recharge les équipements sans effectuer
   * un rechargement complet du navigateur.
   *
   * Cela permet notamment de conserver
   * correctement la session JWT.
   */
  const handleRefresh = async () => {
    setOpen(false);

    setEditing(null);

    setStep(1);

    setForm({
      ...emptyForm,
    });

    setSearch("");

    setError("");

    setMessage("");

    setRefreshing(true);

    await load();

    setRefreshing(false);
  };


  /* ==========================================================
     CHARGEMENT INITIAL
     ========================================================== */

  if (loading) {
    return (
      <div className="equipment-loading">
        <LoaderCircle
          className="spin"
          size={22}
        />

        Chargement des équipements...
      </div>
    );
  }


  /* ==========================================================
     AFFICHAGE PRINCIPAL
     ========================================================== */

  return (
    <div className="equipment-page">

      {/* =====================================================
          ENTETE
          ===================================================== */}

      <header className="equipment-header">
        <div>
          <h1>
            Équipements
          </h1>

          <p>
            Gérez le parc des équipements et leurs
            informations techniques et de maintenance.
          </p>
        </div>


        <div className="equipment-header-actions">

          {/* -------------------------------------------------
              ACTUALISER
              ------------------------------------------------- */}

          <button
            type="button"
            className="equipment-cancel"
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


          {/* -------------------------------------------------
              NOUVEL EQUIPEMENT
              ------------------------------------------------- */}

          <button
            type="button"
            className="equipment-create"
            onClick={() =>
              void startCreate()
            }
          >
            <Plus size={18} />

            Nouvel équipement
          </button>

        </div>
      </header>


      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {error && (
        <div className="equipment-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="equipment-alert success">
          {message}
        </div>
      )}


      {/* =====================================================
          TABLEAU
          ===================================================== */}

      <section className="equipment-card">

        {/* ---------------------------------------------------
            BARRE DE RECHERCHE
            --------------------------------------------------- */}

        <div className="equipment-toolbar">
          <label className="equipment-search">
            <Search size={18} />

            <input
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target.value,
                  )
              }
              placeholder="Rechercher par code, équipement, bâtiment, local, constructeur..."
            />
          </label>

          <span>
            {filtered.length} équipement(s)
          </span>
        </div>


        {/* ---------------------------------------------------
            TABLE
            --------------------------------------------------- */}

        <div className="equipment-table-wrap">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Code</th>

                <th>Équipement</th>

                <th>Bâtiment</th>

                <th>Étage</th>

                <th>Local</th>

                <th>Domaine</th>

                <th>Constructeur</th>

                <th>Modèle</th>

                <th>Référence</th>

                <th>Qté</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="equipment-empty"
                  >
                    Aucun équipement.
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (item) => (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {item.code || "—"}
                        </strong>
                      </td>

                      <td>
                        {item.nom}
                      </td>

                      <td>
                        {item.batiment || "—"}
                      </td>

                      <td>
                        {item.etage || "—"}
                      </td>

                      <td>
                        {item.local || "—"}
                      </td>

                      <td>
                        {item.domaine || "—"}
                      </td>

                      <td>
                        {item.constructeur || "—"}
                      </td>

                      <td>
                        {item.modele || "—"}
                      </td>

                      <td>
                        {item.reference || "—"}
                      </td>

                      <td>
                        {item.quantite ?? 1}
                      </td>

                      <td>
                        <div className="eq-actions">

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
          MODALE / WIZARD
          ===================================================== */}

      {open && (
        <div
          className="equipment-modal-backdrop"
          onMouseDown={() => {
            if (!saving) {
              setOpen(false);
            }
          }}
        >
          <form
            className="equipment-modal equipment-wizard"
            onSubmit={submit}
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            {/* =================================================
                ENTETE DU WIZARD
                ================================================= */}

            <div className="equipment-modal-head">
              <div>
                <h2>
                  {editing
                    ? "Modifier l'équipement"
                    : "Nouvel équipement"}
                </h2>

                <p>
                  Étape {step} sur {totalSteps}
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


            {/* =================================================
                INDICATEUR DES ETAPES
                ================================================= */}

            <div className="equipment-wizard-steps">

              <div
                className={
                  step >= 1
                    ? "wizard-step active"
                    : "wizard-step"
                }
              >
                <MapPin size={18} />

                <span>
                  Localisation
                </span>
              </div>


              <div
                className={
                  step >= 2
                    ? "wizard-step active"
                    : "wizard-step"
                }
              >
                <Settings size={18} />

                <span>
                  Équipement
                </span>
              </div>


              <div
                className={
                  step >= 3
                    ? "wizard-step active"
                    : "wizard-step"
                }
              >
                <Factory size={18} />

                <span>
                  Technique
                </span>
              </div>


              <div
                className={
                  step >= 4
                    ? "wizard-step active"
                    : "wizard-step"
                }
              >
                <Wrench size={18} />

                <span>
                  Maintenance
                </span>
              </div>

            </div>


            {/* =================================================
                ETAPE 1
                LOCALISATION
                ================================================= */}

            {step === 1 && (
              <div className="equipment-wizard-content">

                <div className="equipment-section-title">
                  <Building2 size={21} />

                  <div>
                    <h3>
                      Localisation
                    </h3>

                    <p>
                      Position de l'équipement
                      dans l'installation.
                    </p>
                  </div>
                </div>


                <div className="equipment-form-grid">

                  <CreatableInput
                    label="Bâtiment"
                    field="batiment"
                    value={form.batiment}
                    placeholder="Ex. Bâtiment A"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            batiment: value,
                          }),
                        )
                    }
                  />


                  <CreatableInput
                    label="Étage"
                    field="etage"
                    value={form.etage}
                    placeholder="Ex. RDC"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            etage: value,
                          }),
                        )
                    }
                  />


                  <div className="equipment-span-2">
                    <CreatableInput
                      label="Local"
                      field="local"
                      value={form.local}
                      placeholder="Ex. Local technique"
                      onChange={
                        (value) =>
                          setForm(
                            (current) => ({
                              ...current,
                              local: value,
                            }),
                          )
                      }
                    />
                  </div>

                </div>
              </div>
            )}


            {/* =================================================
                ETAPE 2
                IDENTIFICATION EQUIPEMENT
                ================================================= */}

            {step === 2 && (
              <div className="equipment-wizard-content">

                <div className="equipment-section-title">
                  <Settings size={21} />

                  <div>
                    <h3>
                      Identification de l'équipement
                    </h3>

                    <p>
                      Informations principales
                      de l'équipement.
                    </p>
                  </div>
                </div>


                <div className="equipment-form-grid">

                  {/* -------------------------------------------
                      CODE
                      ------------------------------------------- */}

                  <label>
                    <span>
                      Code équipement *
                    </span>

                    <input
                      required
                      value={form.code}
                      readOnly={!editing}
                      onChange={
                        (event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              code:
                                event.target.value,
                            }),
                          )
                      }
                    />
                  </label>


                  {/* -------------------------------------------
                      NOM EQUIPEMENT
                      ------------------------------------------- */}

                  <CreatableInput
                    label="Équipement"
                    field="nom"
                    value={form.nom}
                    required
                    placeholder="Ex. Pompe de relevage"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            nom: value,
                          }),
                        )
                    }
                  />


                  {/* -------------------------------------------
                      DOMAINE
                      ------------------------------------------- */}

                  <CreatableInput
                    label="Domaine"
                    field="domaine"
                    value={form.domaine}
                    placeholder="Ex. Plomberie"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            domaine: value,
                          }),
                        )
                    }
                  />


                  {/* -------------------------------------------
                      TYPE
                      ------------------------------------------- */}

                  <CreatableInput
                    label="Type"
                    field="type"
                    value={form.type}
                    placeholder="Type d'équipement"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            type: value,
                          }),
                        )
                    }
                  />


                  {/* -------------------------------------------
                      QUANTITE
                      ------------------------------------------- */}

                  <label>
                    <span>
                      Quantité
                    </span>

                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.quantite}
                      onChange={
                        (event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              quantite:
                                Number(
                                  event.target.value,
                                ),
                            }),
                          )
                      }
                    />
                  </label>

                </div>
              </div>
            )}


            {/* =================================================
                ETAPE 3
                INFORMATIONS TECHNIQUES
                ================================================= */}

            {step === 3 && (
              <div className="equipment-wizard-content">

                <div className="equipment-section-title">
                  <Factory size={21} />

                  <div>
                    <h3>
                      Informations techniques
                    </h3>

                    <p>
                      Fabricant, modèle et
                      référence de l'équipement.
                    </p>
                  </div>
                </div>


                <div className="equipment-form-grid">

                  <CreatableInput
                    label="Constructeur / Marque"
                    field="constructeur"
                    value={form.constructeur}
                    placeholder="Ex. Schneider"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            constructeur: value,
                          }),
                        )
                    }
                  />


                  <CreatableInput
                    label="Modèle"
                    field="modele"
                    value={form.modele}
                    placeholder="Modèle"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            modele: value,
                          }),
                        )
                    }
                  />


                  <div className="equipment-span-2">
                    <CreatableInput
                      label="Référence"
                      field="reference"
                      value={form.reference}
                      placeholder="Référence constructeur"
                      onChange={
                        (value) =>
                          setForm(
                            (current) => ({
                              ...current,
                              reference: value,
                            }),
                          )
                      }
                    />
                  </div>


                  <label className="equipment-span-2">
                    <span>
                      Description
                    </span>

                    <textarea
                      rows={4}
                      value={form.description}
                      placeholder="Informations complémentaires..."
                      onChange={
                        (event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              description:
                                event.target.value,
                            }),
                          )
                      }
                    />
                  </label>

                </div>
              </div>
            )}


            {/* =================================================
                ETAPE 4
                MAINTENANCE
                ================================================= */}

            {step === 4 && (
              <div className="equipment-wizard-content">

                <div className="equipment-section-title">
                  <Wrench size={21} />

                  <div>
                    <h3>
                      Informations maintenance
                    </h3>

                    <p>
                      Gamme, intervention et
                      génération du Work Order.
                    </p>
                  </div>
                </div>


                <div className="equipment-form-grid">

                  <div className="equipment-span-2">
                    <CreatableInput
                      label="Gamme / Job Plan"
                      field="gamme_job_plan"
                      value={form.gamme_job_plan}
                      placeholder="Gamme ou Job Plan"
                      onChange={
                        (value) =>
                          setForm(
                            (current) => ({
                              ...current,
                              gamme_job_plan: value,
                            }),
                          )
                      }
                    />
                  </div>


                  <label>
                    <span>
                      Date d'intervention
                    </span>

                    <input
                      type="date"
                      value={
                        form.date_intervention
                      }
                      onChange={
                        (event) =>
                          setForm(
                            (current) => ({
                              ...current,
                              date_intervention:
                                event.target.value,
                            }),
                          )
                      }
                    />
                  </label>


                  <CreatableInput
                    label="Work Order généré par"
                    field="workorder_genere_par"
                    value={
                      form.workorder_genere_par
                    }
                    placeholder="Origine du Work Order"
                    onChange={
                      (value) =>
                        setForm(
                          (current) => ({
                            ...current,
                            workorder_genere_par:
                              value,
                          }),
                        )
                    }
                  />


                  <label className="equipment-checkbox">
                    <input
                      type="checkbox"
                      checked={form.actif}
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
                      Équipement actif
                    </span>
                  </label>

                </div>


                {/* ---------------------------------------------
                    RECAPITULATIF
                    --------------------------------------------- */}

                <div className="equipment-summary">

                  <h4>
                    Récapitulatif
                  </h4>

                  <div className="equipment-summary-grid">

                    <div>
                      <span>Code</span>
                      <strong>
                        {form.code || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Équipement</span>
                      <strong>
                        {form.nom || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Localisation</span>
                      <strong>
                        {[
                          form.batiment,
                          form.etage,
                          form.local,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Constructeur</span>
                      <strong>
                        {form.constructeur || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Modèle</span>
                      <strong>
                        {form.modele || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Quantité</span>
                      <strong>
                        {form.quantite}
                      </strong>
                    </div>

                  </div>
                </div>

              </div>
            )}


            {/* =================================================
                ACTIONS DU WIZARD
                ================================================= */}

            <div className="equipment-modal-actions">

              {/* ------------------------------------------------
                  ANNULER
                  ------------------------------------------------ */}

              <button
                type="button"
                className="equipment-cancel"
                onClick={() =>
                  setOpen(false)
                }
                disabled={saving}
              >
                Annuler
              </button>


              <div className="equipment-wizard-navigation">

                {/* ----------------------------------------------
                    PRECEDENT
                    ---------------------------------------------- */}

                {step > 1 && (
                  <button
                    type="button"
                    className="equipment-cancel"
                    onClick={
                      previousStep
                    }
                    disabled={saving}
                  >
                    <ChevronLeft size={17} />

                    Précédent
                  </button>
                )}


                {/* ----------------------------------------------
                    SUIVANT
                    ---------------------------------------------- */}

                {step < totalSteps && (
                  <button
                    type="button"
                    className="equipment-create"
                    onClick={
                      nextStep
                    }
                    disabled={saving}
                  >
                    Suivant

                    <ChevronRight size={17} />
                  </button>
                )}


                {/* ----------------------------------------------
                    ENREGISTRER
                    ---------------------------------------------- */}

                {step === totalSteps && (
                  <button
                    type="submit"
                    className="equipment-create"
                    disabled={saving}
                  >
                    {saving ? (
                      <LoaderCircle
                        className="spin"
                        size={17}
                      />
                    ) : (
                      <Check size={17} />
                    )}

                    {editing
                      ? "Enregistrer les modifications"
                      : "Créer l'équipement"}
                  </button>
                )}

              </div>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}