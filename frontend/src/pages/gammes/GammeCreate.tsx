import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileDown,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";
import { supabaseImageUrl } from "../../utils/supabaseImage";
import "./GammeCreate.css";

/**
 * PHASE 1 - Wizard stabilisé.
 * Équipements = saisie libre dans le wizard puis création dans la table `equipements`.
 * Listes génériques = table unique `referentiel_valeurs`.
 * Aucun fallback métier codé en dur : Supabase est la source de vérité.
 */
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
  batiment?: string | null;
  etage?: string | null;
  local?: string | null;
  domaine?: string | null;
  reference?: string | null;
  constructeur?: string | null;
  modele?: string | null;
  date_intervention?: string | null;
  workorder_genere_par?: string | null;
  type?: string | null;
  description?: string | null;
  image_url?: string | null;
  actif?: boolean;
};

type SimpleRef = {
  id: string;
  nom: string;
  description?: string | null;
  image_url?: string | null;
  actif?: boolean;
};

type RefValue = {
  id?: string;
  code: string;
  libelle: string;
  ordre?: number;
  actif?: boolean;
};

type GammeVersion = {
  id: string;
  numero_version?: number;
  code_version?: string;
};

type CurrentUser = {
  id?: number | string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type PieceLibre = {
  localId: string;
  nom: string;
  reference: string;
  quantite: number;
};

type ActionDraft = { localId: string; contenu: string };
type EtapeImageDraft = { localId: string; image_url: string };
type EtapeDraft = {
  localId: string; numero: number; titre: string;
  duree_minutes: number; actions: ActionDraft[]; images: EtapeImageDraft[];
};

type FormState = {
  code: string;
  designation: string;
  abreviation: string;
  equipement_nom: string;
  equipement_code: string;
  equipement_constructeur: string;
  equipement_type: string;
  equipement_reference: string;
  equipement_batiment: string;
  equipement_etage: string;
  equipement_local: string;
  equipement_domaine: string;
  equipement_modele: string;
  equipement_date_intervention: string;
  equipement_workorder_genere_par: string;
  equipement_description: string;
  equipement_image_url: string;
  corps_metier: string;
  type_redaction: string;
  image_url: string;
  redacteur: string;
  titre_poste: string;
  type_maintenance: string;
  periodicite: string;
  main_oeuvre: number;
  type_arret: string;
  modifications: string;
};

const initialForm: FormState = {
  code: "",
  designation: "",
  abreviation: "",
  equipement_nom: "",
  equipement_code: "",
  equipement_constructeur: "",
  equipement_type: "",
  equipement_reference: "",
  equipement_batiment: "",
  equipement_etage: "",
  equipement_local: "",
  equipement_domaine: "",
  equipement_modele: "",
  equipement_date_intervention: "",
  equipement_workorder_genere_par: "",
  equipement_description: "",
  equipement_image_url: "",
  corps_metier: "",
  type_redaction: "",
  image_url: "",
  redacteur: "",
  titre_poste: "",
  type_maintenance: "",
  periodicite: "",
  main_oeuvre: 1,
  type_arret: "",
  modifications: "Création initiale de la gamme",
};

const wizardSteps = [
  "Informations générales",
  "Équipement",
  "Périodicité & maintenance",
  "Moyens & pièces",
  "Documents & recommandations",
  "Sécurité & risques",
  "Actions & images",
  "Vérification",
];

/**
 * Normalise une réponse DRF.
 * L'API peut retourner soit un tableau direct, soit une réponse paginée `results`.
 */
function extractResults<T>(data: T[] | PaginatedResponse<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

/** Normalise un tableau ou une réponse DRF paginée de référentiel. */
function normalizeReferenceValues(
  values: RefValue[] | PaginatedResponse<RefValue> | null | undefined,
): RefValue[] {
  return extractResults<RefValue>(values)
    .filter((item) => item && item.actif !== false)
    .slice()
    .sort((a, b) => {
      const orderDiff = Number(a.ordre ?? 0) - Number(b.ordre ?? 0);
      return orderDiff !== 0
        ? orderDiff
        : String(a.libelle ?? "").localeCompare(String(b.libelle ?? ""), "fr");
    });
}

/**
 * Génère un identifiant uniquement côté navigateur.
 * Il sert à ajouter/supprimer une pièce libre avant son enregistrement dans Supabase.
 */
function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyEtape(numero = 1): EtapeDraft {
  return { localId: createLocalId(), numero, titre: "", duree_minutes: 0, actions: [{ localId: createLocalId(), contenu: "" }], images: [] };
}


/** Réduit une image avant de la convertir en Data URL.
 * Cela évite l'erreur Django RequestDataTooBig rencontrée avec les photos brutes.
 */
async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné n'est pas une image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("L'image source ne doit pas dépasser 12 Mo.");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Impossible de lire l'image."));
      img.src = sourceUrl;
    });

    const maxDimension = 1400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Impossible de préparer l'image.");
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    if (dataUrl.length > 1_800_000) {
      throw new Error("L'image reste trop volumineuse après compression. Choisissez une image plus légère.");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}


function formatApiError(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    const messages = data.map(formatApiError).filter(Boolean);
    return messages.length ? messages.join(" ") : null;
  }
  if (typeof data === "object") {
    const messages = Object.entries(data as Record<string, unknown>)
      .map(([field, value]) => {
        const message = formatApiError(value);
        return message ? `${field}: ${message}` : null;
      })
      .filter(Boolean);
    return messages.length ? messages.join(" | ") : null;
  }
  return String(data);
}

/**
 * Wizard principal de création d'une gamme opératoire.
 *
 * Les données saisies restent dans les états React pendant le passage
 * Informations générales -> Équipement -> Périodicité & maintenance ->
 * Moyens & pièces -> Documents & recommandations -> Sécurité & risques ->
 * Actions & images -> Vérification.
 * Supabase n'est écrit qu'au clic final sur "Créer la gamme".
 */
export default function GammeCreate() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [equipmentMode, setEquipmentMode] = useState<"existing" | "new">("existing");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentResults, setEquipmentResults] = useState<Equipement[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipement | null>(null);
  const [equipmentSearching, setEquipmentSearching] = useState(false);
  const [epis, setEpis] = useState<SimpleRef[]>([]);
  const [epcs, setEpcs] = useState<SimpleRef[]>([]);
  const [risques, setRisques] = useState<SimpleRef[]>([]);
  const [outillages, setOutillages] = useState<SimpleRef[]>([]);

  const [maintenanceTypes, setMaintenanceTypes] = useState<RefValue[]>([]);
  const [periodicites, setPeriodicites] = useState<RefValue[]>([]);
  const [typesArret, setTypesArret] = useState<RefValue[]>([]);
  const [corpsMetiers, setCorpsMetiers] = useState<RefValue[]>([]);
  const [typesRedaction, setTypesRedaction] = useState<RefValue[]>([]);

  const [selectedEpis, setSelectedEpis] = useState<string[]>([]);
  const [selectedEpcs, setSelectedEpcs] = useState<string[]>([]);
  const [selectedRisques, setSelectedRisques] = useState<string[]>([]);
  const [selectedOutillages, setSelectedOutillages] = useState<Record<string, number>>({});

  const [piecesLibres, setPiecesLibres] = useState<PieceLibre[]>([]);
  const [pieceDraft, setPieceDraft] = useState({ nom: "", reference: "", quantite: 1 });
  const [etapes, setEtapes] = useState<EtapeDraft[]>(() => [createEmptyEtape(1)]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");

  // Identifiants conservés après une création réussie.
  // Ils permettent de générer les documents sans recréer la gamme ni V0.
  const [createdGammeId, setCreatedGammeId] = useState<string | null>(null);
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "word" | null>(null);

  /**
   * Charge les référentiels nécessaires. Les équipements sont saisis manuellement.
   * L’effet peut être relancé proprement par le bouton Actualiser.
   */
  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      setError("");

      try {
        const [episResponse, risquesResponse, outillagesResponse, meResponse] =
          await Promise.all([
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/epis/"),
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/risques/"),
            api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/outillages/"),
            api.get<CurrentUser>("/me/"),
          ]);

        setCurrentUser(meResponse.data);
        setEpis(extractResults<SimpleRef>(episResponse.data).filter(Boolean));
        setRisques(extractResults<SimpleRef>(risquesResponse.data).filter(Boolean));
        setOutillages(extractResults<SimpleRef>(outillagesResponse.data).filter(Boolean));

        const optionalResponses = await Promise.allSettled([
          api.get<SimpleRef[] | PaginatedResponse<SimpleRef>>("/v2/epcs/"),
          api.get<RefValue[] | PaginatedResponse<RefValue>>("/v2/referentiels/?categorie=type_maintenance"),
          api.get<RefValue[] | PaginatedResponse<RefValue>>("/v2/referentiels/?categorie=periodicite"),
          api.get<RefValue[] | PaginatedResponse<RefValue>>("/v2/referentiels/?categorie=type_arret"),
          api.get<RefValue[] | PaginatedResponse<RefValue>>("/v2/referentiels/?categorie=corps_metier"),
          api.get<RefValue[] | PaginatedResponse<RefValue>>("/v2/referentiels/?categorie=type_redaction"),
        ]);

        if (optionalResponses[0].status === "fulfilled") {
          setEpcs(extractResults<SimpleRef>(optionalResponses[0].value.data).filter((item) => item && item.actif !== false));
        }
        if (optionalResponses[1].status === "fulfilled") {
          setMaintenanceTypes(
            normalizeReferenceValues(optionalResponses[1].value.data),
          );
        }
        if (optionalResponses[2].status === "fulfilled") {
          setPeriodicites(normalizeReferenceValues(optionalResponses[2].value.data));
        }
        if (optionalResponses[3].status === "fulfilled") {
          setTypesArret(normalizeReferenceValues(optionalResponses[3].value.data));
        }
        if (optionalResponses[4].status === "fulfilled") {
          setCorpsMetiers(normalizeReferenceValues(optionalResponses[4].value.data));
        }
        if (optionalResponses[5].status === "fulfilled") {
          setTypesRedaction(normalizeReferenceValues(optionalResponses[5].value.data));
        }
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les référentiels nécessaires.");
      } finally {
        setLoading(false);
      }
    };

    void loadReferences();
  }, [reloadKey]);

  /**
   * Applique les premières valeurs disponibles des référentiels après chargement.
   * Aucun métier, périodicité ou type d'arrêt n'est codé en dur.
   */
  useEffect(() => {
    setForm((current) => {
      const next = { ...current };

      if (!next.type_maintenance && maintenanceTypes.length > 0) {
        next.type_maintenance = maintenanceTypes[0].code;
      }
      if (!next.periodicite && periodicites.length > 0) {
        next.periodicite = periodicites[0].code;
      }
      if (!next.type_arret && typesArret.length > 0) {
        next.type_arret = typesArret[0].code;
      }
      if (!next.type_redaction && typesRedaction.length > 0) {
        next.type_redaction = typesRedaction[0].code;
      }

      return next;
    });
  }, [maintenanceTypes, periodicites, typesArret, typesRedaction]);

  useEffect(() => {
    if (equipmentMode !== "existing") return;
    const query = equipmentSearch.trim();
    if (query.length < 2) {
      setEquipmentResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setEquipmentSearching(true);
      try {
        const response = await api.get<Equipement[] | PaginatedResponse<Equipement>>(
          "/equipements/",
          { params: { search: query } },
        );
        setEquipmentResults(extractResults(response.data).filter((item) => item.actif !== false));
      } catch {
        setEquipmentResults([]);
      } finally {
        setEquipmentSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [equipmentMode, equipmentSearch]);

  const chooseEquipment = (item: Equipement) => {
    setSelectedEquipment(item);
    setEquipmentSearch(`${item.code ? `${item.code} — ` : ""}${item.nom}`);
    setForm((current) => ({
      ...current,
      equipement_nom: item.nom ?? "",
      equipement_code: item.code ?? "",
      equipement_constructeur: item.constructeur ?? "",
      equipement_type: item.type ?? "",
      equipement_reference: item.reference ?? "",
      equipement_batiment: item.batiment ?? "",
      equipement_etage: item.etage ?? "",
      equipement_local: item.local ?? "",
      equipement_domaine: item.domaine ?? "",
      equipement_modele: item.modele ?? "",
      equipement_date_intervention: item.date_intervention ?? "",
      equipement_workorder_genere_par: item.workorder_genere_par ?? "",
      equipement_description: item.description ?? "",
      equipement_image_url: item.image_url ?? "",
    }));
    setEquipmentResults([]);
    setError("");
  };

  const resetEquipmentForm = () => {
    setSelectedEquipment(null);
    setEquipmentSearch("");
    setEquipmentResults([]);
    setForm((current) => ({
      ...current,
      equipement_nom: "", equipement_code: "", equipement_constructeur: "",
      equipement_type: "", equipement_reference: "", equipement_batiment: "",
      equipement_etage: "", equipement_local: "", equipement_domaine: "",
      equipement_modele: "",
      equipement_date_intervention: "", equipement_workorder_genere_par: "",
      equipement_description: "", equipement_image_url: "",
    }));
  };

  const profileName = useMemo(() => {
    if (!currentUser) return "—";
    const fullName = `${currentUser.first_name ?? ""} ${currentUser.last_name ?? ""}`.trim();
    return fullName || currentUser.username || "—";
  }, [currentUser]);

  /** Met à jour un seul champ du formulaire sans écraser les autres. */
  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  /**
   * Ajoute ou retire un identifiant dans une sélection multiple.
   * Utilisé pour EPI, EPC et Risques.
   */
  const toggleId = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  /**
   * Sélectionne/désélectionne un outillage.
   * Lors de la sélection, la quantité initiale vaut 1.
   */
  const toggleQuantity = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  ) => {
    setter((current) => {
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: 1 };
    });
  };

  /**
   * Modifie la quantité d'un outillage sélectionné.
   * Une quantité inférieure à 1 est automatiquement ramenée à 1.
   */
  const updateQuantity = (
    id: string,
    quantity: number,
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  ) => {
    setter((current) => ({ ...current, [id]: Math.max(1, Number(quantity) || 1) }));
  };

  /** Ajoute une pièce libre : Nom + Référence + Quantité, sans liste déroulante. */
  const addPieceLibre = () => {
    const nom = pieceDraft.nom.trim();
    if (!nom) {
      setError("Le nom de la pièce de rechange est obligatoire.");
      return;
    }

    setPiecesLibres((current) => [
      ...current,
      {
        localId: createLocalId(),
        nom,
        reference: pieceDraft.reference.trim(),
        quantite: Math.max(1, Number(pieceDraft.quantite) || 1),
      },
    ]);
    setPieceDraft({ nom: "", reference: "", quantite: 1 });
    setError("");
  };

  /**
   * Supprime une pièce de la liste locale avant sauvegarde.
   * Aucune suppression Supabase n'est nécessaire car la pièce n'existe pas encore en base.
   */
  const removePieceLibre = (localId: string) => {
    setPiecesLibres((current) => current.filter((item) => item.localId !== localId));
  };

  /** Bloque le passage à l’étape suivante si les champs obligatoires manquent. */
  /** Ajoute une étape locale avec une première action obligatoire. */
  const addEtape = () => { setEtapes((current) => [...current, createEmptyEtape(current.length + 1)]); setError(""); };

  /** Modifie le titre ou la durée. */
  const updateEtape = (id: string, field: "titre" | "duree_minutes", value: string) => { setEtapes((current) => current.map((e) => e.localId === id ? { ...e, [field]: field === "duree_minutes" ? Math.max(0, Number(value) || 0) : value } : e)); };

  /** Supprime une étape puis renumérote automatiquement les suivantes. */
  const removeEtape = (id: string) => {
    setEtapes((current) => current.filter((e) => e.localId !== id).map((e, i) => ({ ...e, numero: i + 1 })));
  };

  /** Ajoute une action vide à une étape. */
  const addAction = (etapeId: string) => {
    setEtapes((current) => current.map((e) => e.localId === etapeId ? {
      ...e, actions: [...e.actions, { localId: createLocalId(), contenu: "" }],
    } : e));
  };

  /** Met à jour le contenu d'une action locale. */
  const updateAction = (etapeId: string, actionId: string, contenu: string) => {
    setEtapes((current) => current.map((e) => e.localId === etapeId ? {
      ...e, actions: e.actions.map((a) => a.localId === actionId ? { ...a, contenu } : a),
    } : e));
  };

  /** Supprime une action locale ; la validation exige toujours au moins une action renseignée. */
  const removeAction = (etapeId: string, actionId: string) => {
    setEtapes((current) => current.map((e) => e.localId === etapeId ? {
      ...e, actions: e.actions.filter((a) => a.localId !== actionId),
    } : e));
  };

  /** Compresse puis ajoute une image à une étape. */
  const addEtapeImage = async (etapeId: string, file?: File) => {
    if (!file) return;
    try {
      const imageUrl = await compressImage(file);
      setEtapes((current) => current.map((e) => e.localId === etapeId ? {
        ...e, images: [...e.images, { localId: createLocalId(), image_url: imageUrl }],
      } : e));
      setError("");
    } catch (err: any) {
      setError(err?.message || "Impossible de préparer l'image.");
    }
  };


  /** Supprime une image locale avant l'enregistrement. */
  const removeEtapeImage = (etapeId: string, imageId: string) => {
    setEtapes((current) => current.map((e) => e.localId === etapeId ? {
      ...e, images: e.images.filter((img) => img.localId !== imageId),
    } : e));
  };

  /** Calcule automatiquement la durée totale de toutes les étapes. */
  const totalDurationMinutes = etapes.reduce((sum, e) => sum + Math.max(0, Number(e.duree_minutes) || 0), 0);

  /** Valide les champs obligatoires avant de changer d'étape. */
  const validateCurrentStep = () => {
    setError("");

    if (currentStep === 0 && (!form.code.trim() || !form.designation.trim())) {
      setError("Le code et l'intitulé sont obligatoires.");
      return false;
    }

    if (currentStep === 1) {
      if (equipmentMode === "existing" && !selectedEquipment) {
        setError("Recherchez puis sélectionnez un équipement existant.");
        return false;
      }
      if (equipmentMode === "new" && (!form.equipement_nom.trim() || !form.equipement_code.trim())) {
        setError("Le code et le nom du nouvel équipement sont obligatoires.");
        return false;
      }
    }

    if (
      currentStep === 2 &&
      (!form.type_maintenance || !form.periodicite || form.main_oeuvre < 1 || !form.type_arret)
    ) {
      setError(
        "Renseignez le type de maintenance, la périodicité, la main-d'œuvre et le type d'arrêt.",
      );
      return false;
    }

    if (currentStep === 3 && pieceDraft.nom.trim()) {
      setError("Une pièce est encore en cours de saisie. Cliquez sur « Ajouter la pièce » avant de continuer.");
      return false;
    }
    if (currentStep === 6) {
      if (etapes.length === 0) { setError("Ajoutez au moins une étape de maintenance."); return false; }
      const invalid = etapes.find((e) => !e.titre.trim() || e.actions.length === 0 || e.actions.some((a) => !a.contenu.trim()));
      if (invalid) { setError(`Étape ${invalid.numero} : le titre et toutes les actions sont obligatoires.`); return false; }
    }
    return true;
  };

  /**
   * Passe à l'étape suivante uniquement si l'étape actuelle est valide.
   * Les valeurs déjà saisies ne sont pas réinitialisées.
   */
  const next = () => {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Revient à l'étape précédente sans perdre les données du Wizard.
   */
  const previous = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Crée la gamme et enregistre l'ensemble des données du Wizard dans l'ordre.
   *
   * Ordre d'écriture :
   * 1. gamme principale ;
   * 2. métadonnées de la gamme ;
   * 3. récupération de V0 créée automatiquement par Django ;
   * 4. paramètres de maintenance de V0 ;
   * 5. EPI / EPC / Risques / Outillages ;
   * 6. création et association des pièces libres ;
   * 7. étapes, actions et images ;
   * 8. recalcul de la durée totale ;
   * 9. conservation des identifiants pour les exports PDF/Word.
   *
   * Une erreur est affichée avec l'étape précise qui a échoué.
   * On ne masque plus les erreurs EPC ou métadonnées : l'utilisateur sait
   * exactement ce qui n'a pas été enregistré.
   */
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep !== wizardSteps.length - 1) {
      next();
      return;
    }

    if (saving) return;

    if (!form.code.trim() || !form.designation.trim() || !form.equipement_nom.trim()) {
      setError("Le code, l'intitulé et l'équipement sont obligatoires.");
      return;
    }

    setSaving(true);
    setError("");

    let currentSaveStage = "Création de la gamme";

    try {
      setSaveStage("Vérification du code de la gamme");
      const normalizedCode = form.code.trim().toUpperCase();
      const existingResponse = await api.get("/gammes/", { params: { search: normalizedCode } });
      const existingGammes = extractResults<any>(existingResponse.data);
      if (existingGammes.some((item: any) => String(item?.code ?? "").trim().toUpperCase() === normalizedCode)) {
        throw new Error(`Le code ${normalizedCode} existe déjà. Choisissez un autre code.`);
      }
      let equipmentId: string;
      if (equipmentMode === "existing") {
        if (!selectedEquipment?.id) throw new Error("Aucun équipement existant sélectionné.");
        equipmentId = String(selectedEquipment.id);

        // L'image peut être ajoutée/remplacée même pour un équipement déjà enregistré.
        if (form.equipement_image_url && form.equipement_image_url !== (selectedEquipment.image_url ?? "")) {
          currentSaveStage = "Mise à jour de l'image de l'équipement";
          setSaveStage(currentSaveStage);
          await api.patch(`/equipements/${equipmentId}/`, {
            image_url: form.equipement_image_url,
          });
        }
      } else {
        currentSaveStage = "Création de l'équipement";
        setSaveStage(currentSaveStage);
        const equipmentResponse = await api.post("/equipements/", {
          code: form.equipement_code.trim().toUpperCase(),
          nom: form.equipement_nom.trim(),
          batiment: form.equipement_batiment.trim() || null,
          etage: form.equipement_etage.trim() || null,
          local: form.equipement_local.trim() || null,
          domaine: form.equipement_domaine.trim() || null,
          reference: form.equipement_reference.trim() || null,
          constructeur: form.equipement_constructeur.trim() || null,
          modele: form.equipement_modele.trim() || null,
          date_intervention: form.equipement_date_intervention || null,
          workorder_genere_par: form.equipement_workorder_genere_par.trim() || null,
          type: form.equipement_type.trim() || null,
          description: form.equipement_description.trim() || null,
          image_url: form.equipement_image_url || null,
          actif: true,
        });
        equipmentId = String(equipmentResponse.data.id);
      }

      currentSaveStage = "Création de la gamme";
      setSaveStage(currentSaveStage);

      const gammeResponse = await api.post("/gammes/", {
        code: form.code.trim(),
        designation: form.designation.trim(),
        abreviation: form.abreviation.trim() || null,
        equipement: equipmentId,
        description: null,
        actif: true,
      });

      const gammeId = String(gammeResponse.data.id);

      currentSaveStage = "Récupération de la version V0";
      setSaveStage(currentSaveStage);

      const versionsResponse = await api.get<GammeVersion[] | PaginatedResponse<GammeVersion>>(
        `/gammes/${gammeId}/versions/`,
      );

      const version = extractResults(versionsResponse.data)
        .slice()
        .sort((a, b) => Number(b.numero_version ?? 0) - Number(a.numero_version ?? 0))[0];

      if (!version) {
        throw new Error("La version V0 n'a pas été créée automatiquement.");
      }

      currentSaveStage = "Enregistrement des paramètres de maintenance";
      setSaveStage(currentSaveStage);

      await api.patch(`/versions/${version.id}/`, {
        type_maintenance: form.type_maintenance,
        periodicite: form.periodicite,
        main_oeuvre: form.main_oeuvre,
        duree_minutes: totalDurationMinutes,
        modifications: form.modifications.trim(),
        arret: form.type_arret !== "aucun",
      });

      await api.patch(`/v2/versions/${version.id}/metadata/`, {
        type_arret: form.type_arret,
        redacteur: form.redacteur.trim() || null,
      });

      // Les métadonnées générales sont enregistrées seulement après V0 et ses
      // paramètres de maintenance. Ainsi, une image trop volumineuse ne peut plus
      // empêcher l'enregistrement des données métier principales de la version.
      currentSaveStage = "Enregistrement des informations générales";
      setSaveStage(currentSaveStage);

      await api.patch(`/v2/gammes/${gammeId}/metadata/`, {
        corps_metier: form.corps_metier || null,
        type_redaction: form.type_redaction || null,
        image_url: form.image_url || null,
      });

      currentSaveStage = "Association des EPI";
      setSaveStage(currentSaveStage);

      for (const epi of selectedEpis) {
        await api.post("/version-epis/", {
          version: version.id,
          epi,
        });
      }

      currentSaveStage = "Association des EPC";
      setSaveStage(currentSaveStage);

      for (const epc of selectedEpcs) {
        await api.post("/v2/version-epcs/", {
          version: version.id,
          epc,
        });
      }

      currentSaveStage = "Association des risques";
      setSaveStage(currentSaveStage);

      for (const risque of selectedRisques) {
        await api.post("/version-risques/", {
          version: version.id,
          risque,
        });
      }

      currentSaveStage = "Association des outillages";
      setSaveStage(currentSaveStage);

      for (const [outillage, quantite] of Object.entries(selectedOutillages)) {
        await api.post("/version-outillages/", {
          version: version.id,
          outillage,
          quantite,
        });
      }

      currentSaveStage = "Enregistrement des pièces de rechange";
      setSaveStage(currentSaveStage);

      for (const piece of piecesLibres) {
        const createdPiece = await api.post("/pieces/", {
          code: null,
          nom: piece.nom,
          reference: piece.reference || null,
          constructeur: null,
          description: null,
          image_url: null,
        });

        await api.post("/version-pieces/", {
          version: version.id,
          piece: createdPiece.data.id,
          quantite: piece.quantite,
        });
      }

      currentSaveStage = "Enregistrement des étapes";
      setSaveStage(currentSaveStage);
      for (const [i, etape] of etapes.entries()) {
        const er = await api.post("/etapes/", { version: version.id, numero: i + 1, titre: etape.titre.trim(), description: null, duree_minutes: etape.duree_minutes, ordre: i + 1 });
        currentSaveStage = `Actions de l'étape ${i + 1}`; setSaveStage(currentSaveStage);
        for (const [j, action] of etape.actions.entries()) await api.post("/actions/", { etape: er.data.id, ordre: j + 1, contenu: action.contenu.trim() });
        currentSaveStage = `Images de l'étape ${i + 1}`; setSaveStage(currentSaveStage);
        for (const [j, image] of etape.images.entries()) await api.post("/images-etapes/", { etape: er.data.id, image_url: image.image_url, description: null, ordre: j + 1 });
      }
      currentSaveStage = "Recalcul de la durée totale";
      setSaveStage(currentSaveStage);

      // Le backend recalcule la durée depuis les étapes réellement enregistrées.
      // Le PDF et le Word utiliseront ainsi la valeur persistée en base.
      await api.post(`/versions/${version.id}/recalculate/`);

      currentSaveStage = "Création terminée";
      setSaveStage(currentSaveStage);

      // On reste sur la page et on mémorise les UUID créés.
      // Cela évite un second POST /gammes/ lors d'un téléchargement ou d'un clic répété.
      setCreatedGammeId(gammeId);
      setCreatedVersionId(String(version.id));
      setCreatedCode(form.code.trim());
    } catch (err: any) {
      console.error(`Erreur pendant : ${currentSaveStage}`, err);

      const responseData = err?.response?.data;
      const reason =
        formatApiError(responseData) ||
        (typeof err?.message === "string" ? err.message : null) ||
        "Le serveur a refusé l'enregistrement.";

      setError(`${currentSaveStage} : ${reason}`);
    } finally {
      setSaving(false);
      setSaveStage("");
    }
  };

  /**
   * Déclenche le téléchargement local d'un Blob retourné par Django.
   *
   * Cette fonction ne lit ni ne modifie Supabase : elle crée uniquement une URL
   * temporaire dans le navigateur, clique sur un lien invisible puis libère l'URL.
   * Elle est utilisée par les exports PDF et Word.
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  /**
   * Génère et télécharge le document de la version V0 créée.
   *
   * API appelée :
   * - POST /versions/{uuid}/export_pdf/ pour le PDF ;
   * - POST /versions/{uuid}/export_word/ pour le DOCX.
   *
   * La réponse est demandée en `blob` afin de conserver le JWT Axios et de ne pas
   * naviguer vers l'API. Une erreur d'export ne recrée jamais la gamme.
   */
  const exportDocument = async (format: "pdf" | "word") => {
    if (!createdVersionId) {
      setError("Aucune version créée n'est disponible pour l'export.");
      return;
    }

    setExporting(format);
    setError("");

    try {
      const endpoint =
        format === "pdf"
          ? `/versions/${createdVersionId}/export_pdf/`
          : `/versions/${createdVersionId}/export_word/`;

      const response = await api.post(endpoint, {}, { responseType: "blob" });
      const extension = format === "pdf" ? "pdf" : "docx";
      downloadBlob(response.data, `${createdCode || "gamme"}_V0.${extension}`);
    } catch (err: any) {
      console.error(`Erreur export ${format}:`, err);

      // Quand Axios reçoit une erreur JSON avec responseType=blob, le détail serveur
      // peut lui-même être contenu dans un Blob. On tente de le lire pour afficher
      // un message exploitable au lieu d'un simple "Request failed".
      let reason = `Impossible de générer le fichier ${format.toUpperCase()}.`;
      const data = err?.response?.data;

      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text);
          if (typeof parsed?.detail === "string") reason = parsed.detail;
        } catch {
          // Le serveur n'a pas renvoyé un JSON exploitable : on conserve le message générique.
        }
      } else if (typeof data?.detail === "string") {
        reason = data.detail;
      } else if (typeof err?.message === "string") {
        reason = err.message;
      }

      setError(`Export ${format.toUpperCase()} : ${reason}`);
    } finally {
      setExporting(null);
    }
  };

  /**
   * Actualiser remet le Wizard dans son état initial puis relit Supabase.
   * On évite window.location.reload() pour ne pas perturber la session JWT.
   */
  const handleRefresh = () => {
    setCurrentStep(0);
    setForm({ ...initialForm });
    setEquipmentMode("existing");
    resetEquipmentForm();
    setSelectedEpis([]);
    setSelectedEpcs([]);
    setSelectedRisques([]);
    setSelectedOutillages({});
    setPiecesLibres([]);
    setPieceDraft({ nom: "", reference: "", quantite: 1 });
    setError("");
    setSaveStage("");
    setCreatedGammeId(null);
    setCreatedVersionId(null);
    setCreatedCode("");
    setExporting(null);
    setReloadKey((value) => value + 1);
  };

  /** Compresse l'image principale avant de la conserver dans le formulaire. */
  const handleImage = async (file?: File) => {
    if (!file) return;
    try {
      const imageUrl = await compressImage(file);
      updateForm("image_url", imageUrl);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Impossible de préparer l'image.");
    }
  };

  /**
   * Transforme une sélection d'identifiants en libellés lisibles
   * pour l'écran de Vérification.
   */
  const selectedNames = (items: SimpleRef[], ids: string[]) => {
    const names = items
      .filter((item) => ids.includes(item.id))
      .map((item) => item.nom)
      .filter(Boolean);

    return names.length > 0 ? names.join(", ") : "Aucun";
  };

  /**
   * Transforme les outillages sélectionnés en texte avec quantité.
   * Exemple : "Clé dynamométrique × 1, Multimètre × 2".
   */
  const selectedToolNames = () => {
    const names = Object.entries(selectedOutillages)
      .map(([id, quantity]) => {
        const tool = outillages.find((item) => item.id === id);
        return tool ? `${tool.nom} × ${quantity}` : null;
      })
      .filter((value): value is string => Boolean(value));

    return names.length > 0 ? names.join(", ") : "Aucun";
  };

  /**
   * Transforme les pièces libres en résumé lisible avant création.
   */
  const selectedPieceNames = () => {
    if (piecesLibres.length === 0) return "Aucune";

    return piecesLibres
      .map(
        (piece) =>
          `${piece.nom}${piece.reference ? ` (${piece.reference})` : ""} × ${piece.quantite}`,
      )
      .join(", ");
  };

  /** Résume les étapes pour la page Vérification. */
  const stepsSummary = () => etapes.length === 0 ? "Aucune" : etapes.map((e) => `${e.numero}. ${e.titre} — ${e.duree_minutes} min — ${e.actions.length} action(s) — ${e.images.length} image(s)`).join(" | ");

  if (loading) {
    return (
      <div className="page-loading">
        <LoaderCircle className="spin" size={28} />
        <span>Chargement des référentiels...</span>
      </div>
    );
  }

  if (createdVersionId) {
    return (
      <div className="gamme-create-page">
        <div className="page-header">
          <div>
            <p className="page-kicker">Gammes opératoires</p>
            <h1>Gamme créée avec succès</h1>
            <p>
              La gamme <strong>{createdCode}</strong> et sa version V0 sont enregistrées.
              Vous pouvez maintenant générer les documents sans recréer la gamme.
            </p>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <section className="wizard-card">
          <div className="section-heading">
            <div>
              <span>Documents</span>
              <h2>Générer les fichiers de la gamme</h2>
            </div>
          </div>

          <div className="wizard-actions">
            <button
              type="button"
              className="primary-button"
              disabled={exporting !== null}
              onClick={() => exportDocument("pdf")}
            >
              {exporting === "pdf" ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <FileDown size={17} />
              )}
              Télécharger PDF
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={exporting !== null}
              onClick={() => exportDocument("word")}
            >
              {exporting === "word" ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <FileDown size={17} />
              )}
              Télécharger Word
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={exporting !== null}
              onClick={() => navigate("/gammes")}
            >
              Voir les gammes
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={exporting !== null}
              onClick={handleRefresh}
            >
              <Plus size={17} /> Nouvelle gamme
            </button>
          </div>

          <p className="helper-text">
            Identifiant gamme : {createdGammeId} — Version : {createdVersionId}
          </p>
        </section>
      </div>
    );
  }

  return (
    <form className="gamme-create-page" onSubmit={save}>
      <div className="page-header">
        <div>
          <p className="page-kicker">Gammes opératoires</p>
          <h1>Créer une gamme</h1>
          <p>Création guidée d'une nouvelle gamme de maintenance.</p>
        </div>
        <button type="button" className="secondary-button" onClick={handleRefresh} disabled={saving}>
          <RefreshCw size={17} /> Actualiser
        </button>
      </div>

      <div className="wizard-progress">
        {wizardSteps.map((label, index) => (
          <button
            key={label}
            type="button"
            className={
              index === currentStep
                ? "wizard-step active"
                : index < currentStep
                  ? "wizard-step done"
                  : "wizard-step"
            }
            onClick={() => {
              if (index <= currentStep) {
                setCurrentStep(index);
                setError("");
              }
            }}
          >
            <span>{index < currentStep ? <Check size={15} /> : index + 1}</span>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="form-error">{error}</div>}

      <section className="wizard-card">
        {currentStep === 0 && (
          <>
            <div className="section-heading">
              <h2>Informations générales</h2>
              <p>Le code et l'intitulé de l'opération sont les informations principales.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>Code de la gamme *</span>
                <input
                  value={form.code}
                  onChange={(event) => updateForm("code", event.target.value.toUpperCase())}
                  placeholder="Ex. GAM-001"
                />
              </label>

              <label>
                <span>Abréviation</span>
                <input
                  value={form.abreviation}
                  onChange={(event) =>
                    updateForm("abreviation", event.target.value.toUpperCase())
                  }
                  placeholder="Ex. MP-CONV"
                />
              </label>

              <label className="form-span-2">
                <span>Intitulé de l'opération *</span>
                <input
                  value={form.designation}
                  onChange={(event) => updateForm("designation", event.target.value)}
                  placeholder="Ex. Contrôle mensuel du convoyeur"
                />
              </label>

              <label>
                <span>Corps de métier</span>
                <select
                  value={form.corps_metier}
                  onChange={(event) => updateForm("corps_metier", event.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {corpsMetiers.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Type de rédaction</span>
                <select
                  value={form.type_redaction}
                  onChange={(event) => updateForm("type_redaction", event.target.value)}
                >
                  <option value="">Sélectionner</option>
                  {typesRedaction.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-span-2 profile-section-title">Rédacteur</div>

            
              <label>
                <span>Nom du rédacteur</span>
                <input
                value={form.redacteur}
                onChange={(event) => updateForm("redacteur", event.target.value)}
                placeholder="Ex. Jean Dupont"
                />
              </label>

              <label>
                <span>Titre du poste</span>
                <input
                  value={form.titre_poste}
                  onChange={(event) => updateForm("titre_poste", event.target.value)}
                  placeholder="Ex. Ingénieur Méthodes Maintenance"
                />
              </label>

              <label className="form-span-2">
                <span>Image de la gamme</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => handleImage(event.target.files?.[0])}
                />
              </label>

              {form.image_url && (
                <div className="image-preview form-span-2">
                  <img src={form.image_url} alt="Aperçu de la gamme" />
                  <button type="button" onClick={() => updateForm("image_url", "")}>
                    <Trash2 size={16} /> Supprimer l'image
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {currentStep === 1 && (
          <>
            <div className="section-heading">
              <h2>Équipement</h2>
              <p>Choisissez un équipement déjà enregistré ou créez-en un nouveau.</p>
            </div>

            <div className="equipment-mode-switch">
              <button type="button" className={equipmentMode === "existing" ? "primary-button" : "secondary-button"}
                onClick={() => { setEquipmentMode("existing"); resetEquipmentForm(); }}>
                Rechercher un équipement existant
              </button>
              <button type="button" className={equipmentMode === "new" ? "primary-button" : "secondary-button"}
                onClick={() => { setEquipmentMode("new"); resetEquipmentForm(); }}>
                <Plus size={16}/> Créer un nouvel équipement
              </button>
            </div>

            {equipmentMode === "existing" ? (
              <div className="equipment-search-block">
                <label className="form-span-2">
                  <span>Recherche équipement *</span>
                  <input value={equipmentSearch}
                    onChange={(e) => { setEquipmentSearch(e.target.value); setSelectedEquipment(null); }}
                    placeholder="Rechercher par code, nom, constructeur, référence..." />
                </label>
                {equipmentSearching && <p className="helper-text"><LoaderCircle className="spin" size={15}/> Recherche...</p>}
                {equipmentResults.length > 0 && (
                  <div className="equipment-search-results">
                    {equipmentResults.map((item) => (
                      <button type="button" key={item.id} className="equipment-result" onClick={() => chooseEquipment(item)}>
                        <strong>{item.code || "Sans code"} — {item.nom}</strong>
                        <span>{[item.constructeur, item.modele, item.reference, item.local].filter(Boolean).join(" · ") || "Aucun détail"}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedEquipment && (
                  <>
                    <div className="review-grid">
                      <ReviewItem label="Code" value={selectedEquipment.code || "—"}/>
                      <ReviewItem label="Nom" value={selectedEquipment.nom || "—"}/>
                      <ReviewItem label="Constructeur" value={selectedEquipment.constructeur || "—"}/>
                      <ReviewItem label="Modèle" value={selectedEquipment.modele || "—"}/>
                      <ReviewItem label="Référence" value={selectedEquipment.reference || "—"}/>
                      <ReviewItem label="Localisation" value={[selectedEquipment.batiment, selectedEquipment.etage, selectedEquipment.local].filter(Boolean).join(" / ") || "—"}/>
                    </div>

                    <label className="form-span-2">
                      <span>Image de l'équipement</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            updateForm("equipement_image_url", await compressImage(file));
                            setError("");
                          } catch (err: any) {
                            setError(err?.message || "Impossible de préparer l'image de l'équipement.");
                          }
                        }}
                      />
                    </label>
                    {form.equipement_image_url && (
                      <div className="image-preview form-span-2">
                        <img src={supabaseImageUrl(form.equipement_image_url) || form.equipement_image_url} alt="Aperçu équipement" />
                        <button type="button" onClick={() => updateForm("equipement_image_url", "")}>
                          <Trash2 size={16} /> Supprimer l'image
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="form-grid">
                <label><span>Code équipement *</span><input value={form.equipement_code} onChange={(e)=>updateForm("equipement_code",e.target.value.toUpperCase())}/></label>
                <label><span>Nom équipement *</span><input value={form.equipement_nom} onChange={(e)=>updateForm("equipement_nom",e.target.value)}/></label>
                <label><span>Bâtiment</span><input value={form.equipement_batiment} onChange={(e)=>updateForm("equipement_batiment",e.target.value)}/></label>
                <label><span>Étage</span><input value={form.equipement_etage} onChange={(e)=>updateForm("equipement_etage",e.target.value)}/></label>
                <label><span>Local</span><input value={form.equipement_local} onChange={(e)=>updateForm("equipement_local",e.target.value)}/></label>
                <label><span>Domaine</span><input value={form.equipement_domaine} onChange={(e)=>updateForm("equipement_domaine",e.target.value)}/></label>
                <label><span>Constructeur / marque</span><input value={form.equipement_constructeur} onChange={(e)=>updateForm("equipement_constructeur",e.target.value)}/></label>
                <label><span>Modèle</span><input value={form.equipement_modele} onChange={(e)=>updateForm("equipement_modele",e.target.value)}/></label>
                <label><span>Référence</span><input value={form.equipement_reference} onChange={(e)=>updateForm("equipement_reference",e.target.value)}/></label>
                <label><span>Type</span><input value={form.equipement_type} onChange={(e)=>updateForm("equipement_type",e.target.value)}/></label>
                <label><span>Date d'intervention</span><input type="date" value={form.equipement_date_intervention} onChange={(e)=>updateForm("equipement_date_intervention",e.target.value)}/></label>
                <label><span>Workorder généré par</span><input value={form.equipement_workorder_genere_par} onChange={(e)=>updateForm("equipement_workorder_genere_par",e.target.value)}/></label>
                <label className="form-span-2"><span>Description</span><textarea rows={3} value={form.equipement_description} onChange={(e)=>updateForm("equipement_description",e.target.value)}/></label>

                <label className="form-span-2">
                  <span>Image de l'équipement</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        updateForm("equipement_image_url", await compressImage(file));
                        setError("");
                      } catch (err: any) {
                        setError(err?.message || "Impossible de préparer l'image de l'équipement.");
                      }
                    }}
                  />
                </label>
                {form.equipement_image_url && (
                  <div className="image-preview form-span-2">
                    <img src={supabaseImageUrl(form.equipement_image_url) || form.equipement_image_url} alt="Aperçu équipement" />
                    <button type="button" onClick={() => updateForm("equipement_image_url", "")}>
                      <Trash2 size={16} /> Supprimer l'image
                    </button>
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <div className="section-heading">
              <h2>Périodicité & paramètres de maintenance</h2>
              <p>Renseignez les paramètres principaux de l'intervention.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>Type de maintenance *</span>
                <select
                  value={form.type_maintenance}
                  onChange={(event) => updateForm("type_maintenance", event.target.value)}
                >
                  {maintenanceTypes.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Périodicité *</span>
                <select
                  value={form.periodicite}
                  onChange={(event) => updateForm("periodicite", event.target.value)}
                >
                  {periodicites.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Main-d'œuvre *</span>
                <input
                  type="number"
                  min={1}
                  value={form.main_oeuvre}
                  onChange={(event) =>
                    updateForm("main_oeuvre", Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </label>

              <label>
                <span>Type d'arrêt *</span>
                <select
                  value={form.type_arret}
                  onChange={(event) => updateForm("type_arret", event.target.value)}
                >
                  {typesArret.map((item) => (
                    <option key={item.id ?? item.code} value={item.code}>
                      {item.libelle}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div className="section-heading">
              <h2>Documents liés & recommandations particulières</h2>
              <p>
                Cette étape est réservée aux documents associés à la gamme et aux recommandations
                particulières. Les champs seront conservés séparément des moyens et de la sécurité.
              </p>
            </div>

            <div className="form-grid">
              <div className="form-span-2 profile-section-title">Documents liés</div>
              <div className="form-span-2 empty-state">
                Aucun document ajouté pour le moment.
              </div>

              <div className="form-span-2 profile-section-title">Recommandations particulières / Informations</div>
              <div className="form-span-2 empty-state">
                Aucune recommandation ajoutée pour le moment.
              </div>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <>
            <div className="section-heading">
              <h2>Sécurité & risques</h2>
              <p>Sélectionnez les EPI, EPC et risques applicables.</p>
            </div>

            <div className="selection-columns">
              <SelectionPanel
                title="EPI"
                items={epis}
                selectedIds={selectedEpis}
                onToggle={(id) => toggleId(id, setSelectedEpis)}
              />
              <SelectionPanel
                title="EPC"
                items={epcs}
                selectedIds={selectedEpcs}
                onToggle={(id) => toggleId(id, setSelectedEpcs)}
              />
              <SelectionPanel
                title="Risques"
                items={risques}
                selectedIds={selectedRisques}
                onToggle={(id) => toggleId(id, setSelectedRisques)}
              />
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <div className="section-heading">
              <h2>Moyens d’exécution & pièces de rechange</h2>
              <p>Sélectionnez les outillages et saisissez directement les pièces de rechange.</p>
            </div>

            <div className="selection-columns means-columns">
              <div className="selection-panel">
                <h3>Outillages</h3>
                {outillages.length === 0 ? (
                  <p className="empty-selection">Aucun outillage disponible.</p>
                ) : (
                  outillages.map((item) => {
                    const selected = selectedOutillages[item.id];
                    return (
                      <div key={item.id} className="quantity-row">
                        <label className="selection-row">
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleQuantity(item.id, setSelectedOutillages)}
                          />
                          {supabaseImageUrl(item.image_url) ? (
                            <img
                              src={supabaseImageUrl(item.image_url)}
                              alt={item.nom}
                              loading="lazy"
                              style={{ width: 42, height: 42, objectFit: "contain", flex: "0 0 42px" }}
                              onError={(event) => { event.currentTarget.style.display = "none"; }}
                            />
                          ) : null}
                          <span>{item.nom}</span>
                        </label>
                        {selected ? (
                          <input
                            className="quantity-input"
                            type="number"
                            min={1}
                            value={selected}
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                Number(event.target.value),
                                setSelectedOutillages,
                              )
                            }
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="selection-panel piece-panel">
                <h3>Pièces de rechange</h3>
                <p className="panel-help">Champ libre : aucune liste déroulante.</p>

                <div className="piece-entry-grid">
                  <label>
                    <span>Nom de la pièce *</span>
                    <input
                      value={pieceDraft.nom}
                      onChange={(event) =>
                        setPieceDraft((current) => ({ ...current, nom: event.target.value }))
                      }
                      placeholder="Ex. Courroie moteur"
                    />
                  </label>
                  <label>
                    <span>Référence</span>
                    <input
                      value={pieceDraft.reference}
                      onChange={(event) =>
                        setPieceDraft((current) => ({
                          ...current,
                          reference: event.target.value,
                        }))
                      }
                      placeholder="Ex. REF-12345"
                    />
                  </label>
                  <label>
                    <span>Quantité</span>
                    <input
                      type="number"
                      min={1}
                      value={pieceDraft.quantite}
                      onChange={(event) =>
                        setPieceDraft((current) => ({
                          ...current,
                          quantite: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                  </label>
                  <button type="button" className="add-piece-button" onClick={addPieceLibre}>
                    <Plus size={17} /> Ajouter la pièce
                  </button>
                </div>

                <div className="piece-list">
                  {piecesLibres.length === 0 ? (
                    <p className="empty-selection">Aucune pièce ajoutée.</p>
                  ) : (
                    piecesLibres.map((piece) => (
                      <div className="piece-row" key={piece.localId}>
                        <div>
                          <strong>{piece.nom}</strong>
                          <span>
                            {piece.reference || "Sans référence"} · Qté {piece.quantite}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="danger-icon-button"
                          onClick={() => removePieceLibre(piece.localId)}
                          title="Supprimer la pièce"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {currentStep === 6 && (
          <>
            <div className="section-heading"><h2>Liste des actions & images</h2><p>Définissez le titre, la durée, l’image et les actions obligatoires.</p></div>
            <div className="steps-toolbar"><div><strong>{etapes.length} étape(s)</strong><span>Durée totale : {totalDurationMinutes} min</span></div><button type="button" className="primary-button" onClick={addEtape}><Plus size={16}/> Ajouter une étape</button></div>
            <div className="maintenance-steps-list">{etapes.map((etape) => <article key={etape.localId} className="maintenance-step-card">
              <div className="maintenance-step-header"><div className="step-number-badge">{etape.numero}</div><div className="maintenance-step-heading"><strong>Étape {etape.numero}</strong><span>{etape.duree_minutes} min</span></div><button type="button" className="danger-icon-button" disabled={etapes.length===1} onClick={() => removeEtape(etape.localId)}><Trash2 size={16}/></button></div>
              <div className="step-main-fields"><label><span>Titre de l’étape *</span><input value={etape.titre} onChange={(e)=>updateEtape(etape.localId,"titre",e.target.value)}/></label><label><span>Durée (min)</span><input type="number" min={0} value={etape.duree_minutes} onChange={(e)=>updateEtape(etape.localId,"duree_minutes",e.target.value)}/></label></div>
              <div className="step-subsection"><div className="step-subsection-title"><div><strong>Image de l’étape</strong><span>PNG, JPG ou WebP · 3 Mo maximum.</span></div><label className="secondary-button step-file-button"><ImagePlus size={15}/> Inclure une image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>{addEtapeImage(etape.localId,e.target.files?.[0]);e.currentTarget.value="";}}/></label></div>{etape.images.length===0?<div className="step-images-empty">Aucune image incluse.</div>:<div className="step-images-grid">{etape.images.map((img)=><div key={img.localId} className="step-image-card"><div className="step-image-preview"><img src={img.image_url} alt={`Étape ${etape.numero}`}/><button type="button" className="step-image-remove" onClick={()=>removeEtapeImage(etape.localId,img.localId)}><X size={15}/></button></div></div>)}</div>}</div>
              <div className="step-subsection"><div className="step-subsection-title"><div><strong>Actions obligatoires</strong><span>Au moins une action renseignée.</span></div><button type="button" className="secondary-button" onClick={()=>addAction(etape.localId)}><Plus size={15}/> Ajouter une action</button></div><div className="actions-editor-list">{etape.actions.map((a,j)=><div key={a.localId} className="action-editor-row"><div className="action-order">{j+1}</div><textarea rows={2} value={a.contenu} onChange={(e)=>updateAction(etape.localId,a.localId,e.target.value)} placeholder="Action à réaliser *"/><button type="button" className="danger-icon-button" disabled={etape.actions.length===1} onClick={()=>removeAction(etape.localId,a.localId)}><Trash2 size={15}/></button></div>)}</div></div>
            </article>)}</div>
          </>
        )}

        {currentStep === 7 && (
          <>
            <div className="section-heading">
              <h2>Vérification</h2>
              <p>Contrôlez les informations avant la création de la gamme.</p>
            </div>

            <div className="review-grid">
              <ReviewItem label="Code" value={form.code || "—"} />
              <ReviewItem label="Intitulé" value={form.designation || "—"} />
              <ReviewItem label="Nom du profil" value={profileName} />
              <ReviewItem label="Titre du poste" value={form.titre_poste.trim() || "—"} />
              <ReviewItem label="Mode équipement" value={equipmentMode === "existing" ? "Équipement existant" : "Nouvel équipement"} />
              <ReviewItem label="Code équipement" value={form.equipement_code.trim() || "—"} />
              <ReviewItem label="Équipement" value={form.equipement_nom.trim() || "—"} />
              <ReviewItem label="Constructeur" value={form.equipement_constructeur.trim() || "—"} />
              <ReviewItem label="Type machine" value={form.equipement_type.trim() || "—"} />
              <ReviewItem label="Référence machine" value={form.equipement_reference.trim() || "—"} />
              <ReviewItem
                label="Type maintenance"
                value={
                  maintenanceTypes.find((item) => item.code === form.type_maintenance)?.libelle ||
                  form.type_maintenance ||
                  "—"
                }
              />
              <ReviewItem label="Périodicité" value={form.periodicite || "—"} />
              <ReviewItem
                label="Type d'arrêt"
                value={
                  typesArret.find((item) => item.code === form.type_arret)?.libelle ||
                  form.type_arret ||
                  "—"
                }
              />
              <ReviewItem
                label="Corps de métier"
                value={
                  corpsMetiers.find((item) => item.code === form.corps_metier)?.libelle ||
                  form.corps_metier ||
                  "—"
                }
              />
              <ReviewItem
                label="Type de rédaction"
                value={
                  typesRedaction.find((item) => item.code === form.type_redaction)?.libelle ||
                  form.type_redaction ||
                  "—"
                }
              />
              <ReviewItem label="Main-d'œuvre" value={String(form.main_oeuvre)} />
              <ReviewItem label="EPI" value={selectedNames(epis, selectedEpis)} />
              <ReviewItem label="EPC" value={selectedNames(epcs, selectedEpcs)} />
              <ReviewItem label="Risques" value={selectedNames(risques, selectedRisques)} />
              <ReviewItem label="Outillages" value={selectedToolNames()} />
              <ReviewItem label="Pièces de rechange" value={selectedPieceNames()} />
              <ReviewItem label="Nombre d’étapes" value={String(etapes.length)} />
              <ReviewItem label="Durée totale" value={`${totalDurationMinutes} min`} />
              <ReviewItem label="Étapes / Actions / Images" value={stepsSummary()} />
            </div>
          </>
        )}
      </section>

      {saving && saveStage && (
        <div className="save-progress" role="status">
          <LoaderCircle className="spin" size={17} />
          <span>{saveStage}...</span>
        </div>
      )}

      <div className="wizard-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={currentStep === 0 || saving}
          onClick={previous}
        >
          <ArrowLeft size={17} /> Précédent
        </button>

        {currentStep < wizardSteps.length - 1 ? (
          <button type="button" className="primary-button" disabled={saving} onClick={next}>
            Suivant <ArrowRight size={17} />
          </button>
        ) : (
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Créer la gamme
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Panneau réutilisable pour EPI, EPC et Risques.
 * Il affiche les valeurs reçues de Supabase et gère la sélection multiple.
 */
function SelectionPanel({
  title,
  items,
  selectedIds,
  onToggle,
}: {
  title: string;
  items: SimpleRef[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

  return (
    <div className="selection-panel">
      <h3>{title}</h3>
      {safeItems.length === 0 ? (
        <p className="empty-selection">Aucun élément disponible.</p>
      ) : (
        safeItems.map((item) => (
          <label key={item.id} className="selection-row">
            <input
              type="checkbox"
              checked={safeSelectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
            />
            {supabaseImageUrl(item.image_url) ? (
              <img
                src={supabaseImageUrl(item.image_url)}
                alt={item.nom || "Référentiel"}
                loading="lazy"
                style={{ width: 42, height: 42, objectFit: "contain", flex: "0 0 42px" }}
                onError={(event) => { event.currentTarget.style.display = "none"; }}
              />
            ) : null}
            <span>{item.nom || "Sans nom"}</span>
          </label>
        ))
      )}
    </div>
  );
}

/**
 * Ligne de synthèse utilisée dans l'étape Vérification.
 * Elle permet de contrôler visuellement les données avant écriture en base.
 */
function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}