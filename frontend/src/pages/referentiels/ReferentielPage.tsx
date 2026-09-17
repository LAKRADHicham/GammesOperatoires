import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axios";
import { supabaseImageUrl } from "../../utils/supabaseImage";


type DisplayMode = "list" | "cards" | "table";


type FieldConfig = {
  name: string;
  label: string;

  type?:
    | "text"
    | "number"
    | "textarea"
    | "url"
    | "image";

  required?: boolean;
  placeholder?: string;
};


type ReferentielItem = {
  id: string;
  [key: string]: unknown;
};


type Props = {
  title: string;
  subtitle?: string;

  endpoint: string;

  primaryField: string;

  secondaryFields?: string[];

  imageField?: string;

  displayMode?: DisplayMode;

  fields: FieldConfig[];
};


/* ============================================================
   NORMALISATION API
   ============================================================ */

function extractItems(
  data: any
): ReferentielItem[] {
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


/* ============================================================
   ERREURS API
   ============================================================ */

function apiErrorMessage(
  error: any,
  fallback: string
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

  for (
    const [field, value]
    of Object.entries(data)
  ) {
    if (
      Array.isArray(value) &&
      value.length
    ) {
      return `${field} : ${String(
        value[0]
      )}`;
    }

    if (typeof value === "string") {
      return `${field} : ${value}`;
    }
  }

  return fallback;
}


/* ============================================================
   COMPOSANT
   ============================================================ */

export default function ReferentielPage({
  title,
  subtitle,
  endpoint,
  primaryField,
  secondaryFields = [],
  imageField,
  displayMode = "list",
  fields,
}: Props) {

  const [items, setItems] =
    useState<ReferentielItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  /* ==========================================================
     FORMULAIRE INITIAL
     ========================================================== */

  const initialForm = useMemo(() => {
    const data: Record<string, string> = {};

    fields.forEach((field) => {
      data[field.name] = "";
    });

    return data;
  }, [fields]);


  const [form, setForm] =
    useState<Record<string, string>>(
      initialForm
    );


  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);


  /* ==========================================================
     CHARGEMENT
     ========================================================== */

  const loadItems = async () => {
    setError("");

    try {
      const response =
        await api.get(endpoint);

      setItems(
        extractItems(response.data)
      );
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          `Impossible de charger ${title}.`
        )
      );
    }
  };


  useEffect(() => {
    const boot = async () => {
      setLoading(true);

      await loadItems();

      setLoading(false);
    };

    void boot();
  }, [endpoint]);


  /* ==========================================================
     RESET
     ========================================================== */

  const resetForm = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setError("");
  };


  /* ==========================================================
     ACTUALISER
     ========================================================== */

  const handleRefresh = async () => {
    resetForm();

    setMessage("");

    setRefreshing(true);

    await loadItems();

    setRefreshing(false);
  };


  /* ==========================================================
     INPUT
     ========================================================== */

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  /* ==========================================================
     IMAGE
     ========================================================== */

  const handleImageFile = (
    fieldName: string,
    file?: File
  ) => {
    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Le fichier sélectionné n'est pas une image."
      );

      return;
    }

    if (
      file.size >
      3 * 1024 * 1024
    ) {
      setError(
        "L'image ne doit pas dépasser 3 Mo."
      );

      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setForm((previous) => ({
          ...previous,

          [fieldName]:
            reader.result as string,
        }));

        setError("");
      }
    };

    reader.onerror = () => {
      setError(
        "Impossible de lire cette image."
      );
    };

    reader.readAsDataURL(file);
  };


  /* ==========================================================
     MODIFIER
     ========================================================== */

  const handleEdit = (
    item: ReferentielItem
  ) => {
    const nextForm:
      Record<string, string> = {};

    fields.forEach((field) => {
      const value =
        item[field.name];

      nextForm[field.name] =
        value == null
          ? ""
          : String(value);
    });

    setEditingId(item.id);

    setForm(nextForm);

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* ==========================================================
     ENREGISTRER
     ========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const payload:
      Record<string, unknown> = {};

    fields.forEach((field) => {
      const value =
        form[field.name];

      payload[field.name] =
        field.type === "number"
          ? value === ""
            ? null
            : Number(value)
          : value || null;
    });

    setSaving(true);

    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.patch(
          `${endpoint}${editingId}/`,
          payload
        );
      } else {
        await api.post(
          endpoint,
          payload
        );
      }

      setMessage(
        editingId
          ? "Élément modifié avec succès."
          : "Élément ajouté avec succès."
      );

      resetForm();

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Impossible d'enregistrer cet élément."
        )
      );
    } finally {
      setSaving(false);
    }
  };


  /* ==========================================================
     SUPPRIMER
     ========================================================== */

  const handleDelete = async (
    id: string
  ) => {
    if (
      !window.confirm(
        "Voulez-vous vraiment supprimer cet élément ?"
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(
        `${endpoint}${id}/`
      );

      if (
        editingId === id
      ) {
        resetForm();
      }

      setMessage(
        "Élément supprimé."
      );

      await loadItems();
    } catch (err) {
      console.error(err);

      setError(
        apiErrorMessage(
          err,
          "Suppression impossible. Cet élément est peut-être déjà utilisé."
        )
      );
    }
  };


  /* ==========================================================
     VALEUR
     ========================================================== */

  const getValue = (
    item: ReferentielItem,
    fieldName: string
  ): string => {
    const value =
      item[fieldName];

    return value == null
      ? ""
      : String(value);
  };


  /* ==========================================================
     CARTE
     ========================================================== */

  const renderCard = (
    item: ReferentielItem
  ) => {

    const image =
      imageField
        ? getValue(
            item,
            imageField
          )
        : "";

    const titleValue =
      getValue(
        item,
        primaryField
      );

    return (
      <article
        key={item.id}
        style={card}
      >

        {/* IMAGE */}

        <div style={cardImageContainer}>

          {image ? (
            <img
              src={supabaseImageUrl(image)}
              alt={titleValue}
              style={cardImage}
            />
          ) : (
            <div
              style={
                noImageContainer
              }
            >
              <ImagePlus
                size={30}
              />

              <span>
                Aucune image
              </span>
            </div>
          )}

        </div>


        {/* CONTENU */}

        <div style={cardBody}>

          <h3 style={cardTitle}>
            {titleValue || "Sans nom"}
          </h3>


          <div
            style={
              cardDescriptionContainer
            }
          >

            {secondaryFields.map(
              (fieldName) => {

                const value =
                  getValue(
                    item,
                    fieldName
                  );

                if (!value) {
                  return null;
                }

                return (
                  <p
                    key={fieldName}
                    style={
                      cardDescription
                    }
                  >
                    {value}
                  </p>
                );
              }
            )}

          </div>

        </div>


        {/* ACTIONS */}

        <div style={cardActions}>

          <button
            type="button"
            onClick={() =>
              handleEdit(item)
            }
            style={
              cardEditButton
            }
          >
            <Pencil
              size={15}
            />

            Modifier
          </button>


          <button
            type="button"
            onClick={() =>
              void handleDelete(
                item.id
              )
            }
            style={
              cardDeleteButton
            }
          >
            <Trash2
              size={15}
            />

            Supprimer
          </button>

        </div>

      </article>
    );
  };


  /* ==========================================================
     LISTE
     ========================================================== */

  const renderListItem = (
    item: ReferentielItem
  ) => (
    <div
      key={item.id}
      style={listItem}
    >

      {imageField &&
        getValue(
          item,
          imageField
        ) && (

          <img
            src={supabaseImageUrl(getValue(
              item,
              imageField
            ))}
            alt={getValue(
              item,
              primaryField
            )}
            style={{
              width: 64,
              height: 64,
              objectFit:
                "contain",
              border:
                "1px solid #DDE7E3",
              borderRadius: 8,
            }}
          />

        )}


      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >

        <div
          style={{
            fontWeight: 750,
            color: "#172B2A",
          }}
        >
          {getValue(
            item,
            primaryField
          )}
        </div>


        {secondaryFields.map(
          (fieldName) => {

            const value =
              getValue(
                item,
                fieldName
              );

            return value ? (
              <div
                key={fieldName}
                style={{
                  color:
                    "#64748B",
                  fontSize: 14,
                  marginTop: 3,
                }}
              >
                {value}
              </div>
            ) : null;
          }
        )}

      </div>


      <button
        type="button"
        onClick={() =>
          handleEdit(item)
        }
        style={smallButton}
      >
        <Pencil size={15} />

        Modifier
      </button>


      <button
        type="button"
        onClick={() =>
          void handleDelete(
            item.id
          )
        }
        style={{
          ...smallButton,

          color:
            "#DC3545",

          borderColor:
            "#F4B5BB",
        }}
      >
        <Trash2 size={15} />

        Supprimer
      </button>

    </div>
  );


  /* ==========================================================
     AFFICHAGE
     ========================================================== */

  return (
    <div
      style={{
        width: "100%",
        padding: 24,
        boxSizing: "border-box",
      }}
    >

      {/* ==================================================== */}
      {/* HEADER */}
      {/* ==================================================== */}

      <div
        style={{
          display: "flex",

          alignItems:
            "flex-start",

          justifyContent:
            "space-between",

          gap: 16,

          marginBottom: 24,

          flexWrap: "wrap",
        }}
      >

        <div>

          <p
            style={{
              margin: 0,

              color: "#007F5F",

              fontWeight: 800,

              fontSize: 12,
            }}
          >
            RÉFÉRENTIELS
          </p>


          <h1
            style={{
              margin:
                "6px 0 0",

              color: "#172B2A",

              fontSize: 28,
            }}
          >
            {title}
          </h1>


          {subtitle && (
            <p
              style={{
                marginTop: 8,

                marginBottom: 0,

                color:
                  "#64748B",
              }}
            >
              {subtitle}
            </p>
          )}

        </div>


        <button
          type="button"

          onClick={() =>
            void handleRefresh()
          }

          disabled={
            refreshing ||
            saving
          }

          style={
            secondaryButton
          }
        >

          <RefreshCw
            size={16}

            className={
              refreshing
                ? "spin"
                : undefined
            }
          />

          Actualiser

        </button>

      </div>


      {/* ==================================================== */}
      {/* MESSAGES */}
      {/* ==================================================== */}

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}


      {message && (
        <div style={successBox}>
          {message}
        </div>
      )}


      {/* ==================================================== */}
      {/* FORMULAIRE */}
      {/* ==================================================== */}

      <div style={formCard}>

        <h2
          style={{
            margin:
              "0 0 18px",

            color: "#172B2A",

            fontSize: 18,
          }}
        >
          {editingId
            ? "Modifier"
            : "Ajouter"}
        </h2>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(260px,1fr))",

              gap: 18,

              alignItems:
                "start",
            }}
          >

            {fields.map(
              (field) => (

                <div
                  key={
                    field.name
                  }
                >

                  <label
                    style={{
                      display:
                        "block",

                      marginBottom: 7,

                      fontWeight:
                        650,

                      color:
                        "#344A46",
                    }}
                  >

                    {field.label}

                    {field.required
                      ? " *"
                      : ""}

                  </label>


                  {field.type ===
                  "textarea" ? (

                    <textarea
                      name={
                        field.name
                      }

                      required={
                        field.required
                      }

                      value={
                        form[
                          field.name
                        ] ?? ""
                      }

                      onChange={
                        handleChange
                      }

                      rows={4}

                      style={{
                        ...control,

                        resize:
                          "vertical",

                        minHeight:
                          100,
                      }}
                    />

                  ) : field.type ===
                    "image" ? (

                    <div>

                      <label
                        style={
                          imagePicker
                        }
                      >

                        <ImagePlus
                          size={18}
                        />

                        Choisir une image


                        <input
                          type="file"

                          accept="image/png,image/jpeg,image/webp,image/gif"

                          style={{
                            display:
                              "none",
                          }}

                          onChange={(
                            e
                          ) =>
                            handleImageFile(
                              field.name,

                              e.target
                                .files?.[0]
                            )
                          }
                        />

                      </label>


                      {form[
                        field.name
                      ] && (

                        <div
                          style={{
                            marginTop:
                              10,

                            position:
                              "relative",

                            width:
                              "100%",

                            maxWidth:
                              220,
                          }}
                        >

                          <img
                            src={supabaseImageUrl(
                              form[field.name]
                            )}

                            alt="Aperçu"

                            style={{
                              width:
                                "100%",

                              height:
                                130,

                              objectFit:
                                "contain",

                              border:
                                "1px solid #DDE7E3",

                              borderRadius:
                                10,

                              background:
                                "#F8FBFA",
                            }}
                          />


                          <button
                            type="button"

                            title="Supprimer l'image"

                            onClick={() =>
                              setForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,

                                  [field.name]:
                                    "",
                                })
                              )
                            }

                            style={
                              removeImage
                            }
                          >

                            <X
                              size={
                                15
                              }
                            />

                          </button>

                        </div>

                      )}

                    </div>

                  ) : (

                    <input
                      name={
                        field.name
                      }

                      type={
                        field.type ??
                        "text"
                      }

                      required={
                        field.required
                      }

                      placeholder={
                        field.placeholder
                      }

                      value={
                        form[
                          field.name
                        ] ?? ""
                      }

                      onChange={
                        handleChange
                      }

                      style={
                        control
                      }
                    />

                  )}

                </div>

              )
            )}

          </div>


          <div
            style={{
              display: "flex",

              gap: 10,

              marginTop: 20,

              flexWrap: "wrap",
            }}
          >

            <button
              type="submit"

              disabled={
                saving
              }

              style={
                primaryButton
              }
            >

              {saving ? (
                <LoaderCircle
                  className="spin"
                  size={16}
                />
              ) : editingId ? (
                <Pencil
                  size={16}
                />
              ) : (
                <Plus
                  size={16}
                />
              )}


              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer"
                  : "Ajouter"}

            </button>


            {editingId && (

              <button
                type="button"

                disabled={
                  saving
                }

                onClick={
                  resetForm
                }

                style={
                  secondaryButton
                }
              >

                <X size={16} />

                Annuler

              </button>

            )}

          </div>

        </form>

      </div>


      {/* ==================================================== */}
      {/* LISTE / CARTES */}
      {/* ==================================================== */}

      <div style={itemsContainer}>

        {/* TITRE DE LA LISTE */}

        <div style={itemsHeader}>

          <div>

            <h2
              style={{
                margin: 0,

                color:
                  "#172B2A",

                fontSize: 18,
              }}
            >
              {title} disponibles
            </h2>


            {!loading && (
              <p
                style={{
                  margin:
                    "5px 0 0",

                  color:
                    "#64748B",

                  fontSize: 13,
                }}
              >
                {items.length}{" "}
                {items.length > 1
                  ? "éléments"
                  : "élément"}
              </p>
            )}

          </div>

        </div>


        {/* CHARGEMENT */}

        {loading ? (

          <div style={stateBox}>
            <LoaderCircle
              size={22}
              className="spin"
            />

            Chargement...
          </div>

        ) : items.length ===
          0 ? (

          <div style={stateBox}>
            Aucun élément enregistré.
          </div>

        ) : displayMode ===
          "cards" ? (

          /* ================================================ */
          /* GRILLE DE CARTES                                */
          /* ================================================ */

          <div style={cardsGrid}>

            {items.map(
              renderCard
            )}

          </div>

        ) : (

          /* ================================================ */
          /* AFFICHAGE LISTE                                 */
          /* ================================================ */

          <div
            style={{
              display: "flex",

              flexDirection:
                "column",

              gap: 10,
            }}
          >

            {items.map(
              renderListItem
            )}

          </div>

        )}

      </div>

    </div>
  );
}


/* ============================================================
   STYLES FORMULAIRE
   ============================================================ */

const control:
  React.CSSProperties = {

  width: "100%",

  boxSizing:
    "border-box",

  minHeight: 42,

  border:
    "1px solid #DDE7E3",

  borderRadius: 8,

  padding:
    "10px 12px",

  fontFamily:
    "inherit",

  outline: "none",

  background:
    "#FFF",

  color:
    "#172B2A",
};


const imagePicker:
  React.CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 8,

  minHeight: 42,

  padding:
    "0 12px",

  border:
    "1px dashed #9CCDBD",

  borderRadius: 8,

  background:
    "#F1FBF7",

  color:
    "#007F5F",

  fontWeight: 700,

  cursor:
    "pointer",
};


const removeImage:
  React.CSSProperties = {

  position:
    "absolute",

  top: 6,

  right: 6,

  width: 30,

  height: 30,

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  border:
    "1px solid #F4B5BB",

  borderRadius: 8,

  background:
    "#FFF",

  color:
    "#DC3545",

  cursor:
    "pointer",
};


const formCard:
  React.CSSProperties = {

  background:
    "#FFF",

  border:
    "1px solid #DDE7E3",

  borderRadius: 14,

  padding: 22,

  marginBottom: 24,
};


/* ============================================================
   CONTENEUR DES ÉLÉMENTS
   ============================================================ */

const itemsContainer:
  React.CSSProperties = {

  background:
    "#FFF",

  border:
    "1px solid #DDE7E3",

  borderRadius: 14,

  padding: 22,
};


const itemsHeader:
  React.CSSProperties = {

  display:
    "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",

  marginBottom: 18,

  paddingBottom: 15,

  borderBottom:
    "1px solid #EDF2F0",
};


/* ============================================================
   GRILLE
   ============================================================ */

const cardsGrid:
  React.CSSProperties = {

  display: "grid",

  /*
   * 4 cartes environ sur un grand écran.
   * Elles passent automatiquement à 3, 2 ou 1
   * selon la largeur disponible.
   */

  gridTemplateColumns:
    "repeat(auto-fill, minmax(250px, 1fr))",

  gap: 18,

  alignItems:
    "stretch",
};


/* ============================================================
   CARTE
   ============================================================ */

const card:
  React.CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  minWidth: 0,

  minHeight: 360,

  overflow:
    "hidden",

  border:
    "1px solid #DDE7E3",

  borderRadius: 12,

  background:
    "#FFF",

  boxShadow:
    "0 2px 8px rgba(23,43,42,0.04)",
};


/* ============================================================
   IMAGE CARTE
   ============================================================ */

const cardImageContainer:
  React.CSSProperties = {

  width: "100%",

  height: 150,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  padding: 12,

  boxSizing:
    "border-box",

  background:
    "#F8FBFA",

  borderBottom:
    "1px solid #EDF2F0",
};


const cardImage:
  React.CSSProperties = {

  width: "100%",

  height: "100%",

  objectFit:
    "contain",
};


const noImageContainer:
  React.CSSProperties = {

  width: "100%",

  height: "100%",

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 8,

  color:
    "#9AA9A5",

  fontSize: 12,
};


/* ============================================================
   CONTENU CARTE
   ============================================================ */

const cardBody:
  React.CSSProperties = {

  flex: 1,

  display:
    "flex",

  flexDirection:
    "column",

  padding:
    "16px 16px 10px",
};


const cardTitle:
  React.CSSProperties = {

  margin:
    "0 0 9px",

  color:
    "#063D32",

  fontSize: 16,

  fontWeight: 750,

  lineHeight: 1.3,

  overflowWrap:
    "anywhere",
};


const cardDescriptionContainer:
  React.CSSProperties = {

  flex: 1,
};


const cardDescription:
  React.CSSProperties = {

  margin:
    "0 0 6px",

  color:
    "#64748B",

  fontSize: 13,

  lineHeight: 1.5,

  overflowWrap:
    "anywhere",
};


/* ============================================================
   ACTIONS CARTE
   ============================================================ */

const cardActions:
  React.CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "1fr 1fr",

  gap: 8,

  padding:
    "10px 16px 16px",
};


const cardEditButton:
  React.CSSProperties = {

  minHeight: 38,

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 6,

  border:
    "1px solid #9CCDBD",

  borderRadius: 8,

  padding:
    "7px 10px",

  background:
    "#FFF",

  color:
    "#007F5F",

  cursor:
    "pointer",

  fontWeight: 650,

  whiteSpace:
    "nowrap",
};


const cardDeleteButton:
  React.CSSProperties = {

  minHeight: 38,

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 6,

  border:
    "1px solid #F4B5BB",

  borderRadius: 8,

  padding:
    "7px 10px",

  background:
    "#FFF",

  color:
    "#DC3545",

  cursor:
    "pointer",

  fontWeight: 650,

  whiteSpace:
    "nowrap",
};


/* ============================================================
   LISTE STANDARD
   ============================================================ */

const listItem:
  React.CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap: 14,

  border:
    "1px solid #DDE7E3",

  borderRadius: 10,

  padding: 14,
};


/* ============================================================
   BOUTONS
   ============================================================ */

const primaryButton:
  React.CSSProperties = {

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 7,

  border: 0,

  borderRadius: 8,

  padding:
    "10px 18px",

  background:
    "#00966D",

  color:
    "#FFF",

  cursor:
    "pointer",

  fontWeight: 700,
};


const secondaryButton:
  React.CSSProperties = {

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 7,

  border:
    "1px solid #DDE7E3",

  borderRadius: 8,

  padding:
    "10px 16px",

  background:
    "#FFF",

  color:
    "#405A55",

  cursor:
    "pointer",

  fontWeight: 650,
};


const smallButton:
  React.CSSProperties = {

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 6,

  border:
    "1px solid #9CCDBD",

  borderRadius: 7,

  padding:
    "7px 10px",

  background:
    "#FFF",

  color:
    "#007F5F",

  cursor:
    "pointer",

  fontWeight: 650,
};


/* ============================================================
   MESSAGES
   ============================================================ */

const errorBox:
  React.CSSProperties = {

  marginBottom: 14,

  padding: 11,

  border:
    "1px solid #FECDD3",

  borderRadius: 9,

  background:
    "#FFF1F2",

  color:
    "#B4232F",
};


const successBox:
  React.CSSProperties = {

  marginBottom: 14,

  padding: 11,

  border:
    "1px solid #B8E8D6",

  borderRadius: 9,

  background:
    "#F1FBF7",

  color:
    "#007F5F",
};


const stateBox:
  React.CSSProperties = {

  minHeight: 120,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap: 9,

  color:
    "#64748B",
};