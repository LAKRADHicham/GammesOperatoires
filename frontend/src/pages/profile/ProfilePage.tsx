import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  Building2,
  Check,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  UserCircle,
  X,
} from "lucide-react";

import api from "../../api/axios";

import "./ProfilePage.css";


/* ============================================================
   TYPES
   ============================================================ */

type UserProfile = {
  id: number;

  username: string;

  first_name: string;
  last_name: string;

  email: string;

  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;

  titre_poste?: string | null;
  corps_metier?: string | null;
  telephone?: string | null;
  role?: string | null;
};


type ProfileForm = {
  first_name: string;
  last_name: string;
  titre_poste: string;
  corps_metier: string;
  telephone: string;
};


/* ============================================================
   LIBELLÉ DU RÔLE
   ============================================================ */

function getRoleLabel(
  role?: string | null,
): string {

  switch (
    role?.toLowerCase()
  ) {

    case "administrateur":
      return "Administrateur";

    case "redacteur":
      return "Éditeur";

    case "validateur":
      return "Validateur";

    case "lecteur":
      return "Lecteur";

    default:
      return "Éditeur";
  }
}


/* ============================================================
   PAGE
   ============================================================ */

export default function ProfilePage() {

  const [profile, setProfile] =
    useState<UserProfile | null>(
      null
    );

  const [form, setForm] =
    useState<ProfileForm>({
      first_name: "",
      last_name: "",
      titre_poste: "",
      corps_metier: "",
      telephone: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* ==========================================================
     PROFILE -> FORM
     ========================================================== */

  const fillForm =
    useCallback(
      (
        data: UserProfile,
      ) => {

        setForm({
          first_name:
            data.first_name || "",

          last_name:
            data.last_name || "",

          titre_poste:
            data.titre_poste || "",

          corps_metier:
            data.corps_metier || "",

          telephone:
            data.telephone || "",
        });

      },
      [],
    );


  /* ==========================================================
     CHARGEMENT
     ========================================================== */

  const loadProfile =
    useCallback(
      async () => {

        setLoading(true);
        setError("");

        try {

          const response =
            await api.get<UserProfile>(
              "/me/",
            );

          setProfile(
            response.data
          );

          fillForm(
            response.data
          );

          /*
           * On actualise également le cache utilisateur
           * utilisé éventuellement par d'autres composants.
           */
          localStorage.setItem(
            "user",
            JSON.stringify(
              response.data
            ),
          );

        } catch (err) {

          console.error(
            "Erreur profil :",
            err,
          );

          setProfile(null);

          setError(
            "Impossible de charger le profil.",
          );

        } finally {

          setLoading(false);
        }
      },
      [fillForm],
    );


  /* ==========================================================
     INITIALISATION
     ========================================================== */

  useEffect(() => {

    void loadProfile();

  }, [loadProfile]);


  /* ==========================================================
     FORMULAIRE
     ========================================================== */

  const updateField = (
    field: keyof ProfileForm,
    value: string,
  ) => {

    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    );
  };


  /* ==========================================================
     ENREGISTREMENT
     ========================================================== */

  const saveProfile =
    async () => {

      setSaving(true);

      setError("");
      setSuccess("");

      try {

        const response =
          await api.patch<UserProfile>(
            "/me/",
            form,
          );

        setProfile(
          response.data
        );

        fillForm(
          response.data
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data
          ),
        );

        /*
         * Informe éventuellement le Header
         * qu'un profil vient d'être modifié.
         */
        window.dispatchEvent(
          new Event(
            "user-profile-updated"
          )
        );

        setEditing(false);

        setSuccess(
          "Profil mis à jour avec succès.",
        );

      } catch (err) {

        console.error(
          "Erreur sauvegarde profil :",
          err,
        );

        setError(
          "Impossible d'enregistrer les modifications.",
        );

      } finally {

        setSaving(false);
      }
    };


  /* ==========================================================
     ANNULATION
     ========================================================== */

  const cancelEdit = () => {

    if (profile) {
      fillForm(profile);
    }

    setEditing(false);
    setError("");
  };


  /* ==========================================================
     NOM COMPLET
     ========================================================== */

  const fullName =
    useMemo(
      () => {

        if (!profile) {
          return "";
        }

        const value = [
          profile.first_name,
          profile.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        return (
          value ||
          profile.username ||
          "Utilisateur"
        );

      },
      [profile],
    );


  /* ==========================================================
     INITIALES
     ========================================================== */

  const initials =
    useMemo(
      () => {

        if (!profile) {
          return "U";
        }

        const first =
          profile.first_name
            ?.trim()
            .charAt(0) || "";

        const last =
          profile.last_name
            ?.trim()
            .charAt(0) || "";

        const value =
          `${first}${last}`
            .toUpperCase();

        return (
          value ||
          profile.username
            ?.charAt(0)
            .toUpperCase() ||
          "U"
        );

      },
      [profile],
    );


  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {

    return (
      <div className="profile-page">

        <div className="profile-loading">

          <RefreshCw
            className="profile-spinner"
            size={22}
          />

          Chargement du profil...

        </div>

      </div>
    );
  }


  /* ==========================================================
     PROFIL INTROUVABLE
     ========================================================== */

  if (!profile) {

    return (
      <div className="profile-page">

        <div className="profile-error">

          <strong>
            Profil indisponible
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadProfile()
            }
          >
            <RefreshCw size={16} />

            Réessayer
          </button>

        </div>

      </div>
    );
  }


  /* ==========================================================
     PAGE
     ========================================================== */

  return (
    <div className="profile-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="profile-header">

        <div>

          <span className="profile-eyebrow">
            PROFIL UTILISATEUR
          </span>

          <h1>
            Mon profil
          </h1>

          <p>
            Gérez vos informations personnelles
            et professionnelles.
          </p>

        </div>


        {!editing && (

          <button
            type="button"
            className="profile-edit-button"
            onClick={() => {

              setEditing(true);
              setSuccess("");

            }}
          >

            <Pencil size={17} />

            Modifier le profil

          </button>

        )}

      </div>


      {/* ======================================================
          MESSAGES
          ====================================================== */}

      {success && (

        <div className="profile-success">

          <Check size={18} />

          {success}

        </div>

      )}


      {error && (

        <div className="profile-message-error">

          {error}

        </div>

      )}


      {/* ======================================================
          IDENTITÉ
          ====================================================== */}

      <section className="profile-hero">

        <div className="profile-avatar">

          {initials}

        </div>


        <div className="profile-hero-content">

          <h2>
            {fullName}
          </h2>

          <p>
            {profile.titre_poste ||
              "Titre du poste non renseigné"}
          </p>

          <span className="profile-role">

            <ShieldCheck size={15} />

            {getRoleLabel(
              profile.role
            )}

          </span>

        </div>


        <div className="profile-account-status">

          <span
            className={
              profile.is_active
                ? "status-dot active"
                : "status-dot"
            }
          />

          {profile.is_active
            ? "Compte actif"
            : "Compte désactivé"}

        </div>

      </section>


      {/* ======================================================
          MODIFICATION
          ====================================================== */}

      {editing ? (

        <section className="profile-edit-card">

          <div className="profile-card-header">

            <div>

              <h2>
                Modifier mon profil
              </h2>

              <p>
                Modifiez vos informations
                personnelles et professionnelles.
              </p>

            </div>

          </div>


          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Prénom
              </label>

              <input
                value={
                  form.first_name
                }
                onChange={(event) =>
                  updateField(
                    "first_name",
                    event.target.value,
                  )
                }
                placeholder="Votre prénom"
              />

            </div>


            <div className="profile-field">

              <label>
                Nom
              </label>

              <input
                value={
                  form.last_name
                }
                onChange={(event) =>
                  updateField(
                    "last_name",
                    event.target.value,
                  )
                }
                placeholder="Votre nom"
              />

            </div>


            <div className="profile-field">

              <label>
                Titre du poste
              </label>

              <input
                value={
                  form.titre_poste
                }
                onChange={(event) =>
                  updateField(
                    "titre_poste",
                    event.target.value,
                  )
                }
                placeholder="Ex. Ingénieur maintenance"
              />

            </div>


            <div className="profile-field">

              <label>
                Corps de métier
              </label>

              <input
                value={
                  form.corps_metier
                }
                onChange={(event) =>
                  updateField(
                    "corps_metier",
                    event.target.value,
                  )
                }
                placeholder="Ex. Maintenance mécanique"
              />

            </div>


            <div className="profile-field">

              <label>
                Téléphone
              </label>

              <input
                type="tel"
                value={
                  form.telephone
                }
                onChange={(event) =>
                  updateField(
                    "telephone",
                    event.target.value,
                  )
                }
                placeholder="+33 ..."
              />

            </div>


            <div className="profile-field">

              <label>
                Adresse e-mail
              </label>

              <input
                type="email"
                value={
                  profile.email
                }
                disabled
              />

              <small>
                L'adresse e-mail est liée
                à votre compte.
              </small>

            </div>


            <div className="profile-field">

              <label>
                Rôle
              </label>

              <input
                value={
                  getRoleLabel(
                    profile.role
                  )
                }
                disabled
              />

              <small>
                Tous les utilisateurs ont
                le rôle Éditeur.
              </small>

            </div>

          </div>


          <div className="profile-form-actions">

            <button
              type="button"
              className="profile-cancel-button"
              onClick={cancelEdit}
              disabled={saving}
            >

              <X size={17} />

              Annuler

            </button>


            <button
              type="button"
              className="profile-save-button"
              onClick={() =>
                void saveProfile()
              }
              disabled={saving}
            >

              {saving ? (

                <RefreshCw
                  className="profile-spinner"
                  size={17}
                />

              ) : (

                <Save size={17} />

              )}

              {saving
                ? "Enregistrement..."
                : "Enregistrer"}

            </button>

          </div>

        </section>

      ) : (

        /* ====================================================
           CONSULTATION
           ==================================================== */

        <div className="profile-grid">

          <section className="profile-card">

            <div className="profile-card-header">

              <div className="profile-card-icon">

                <UserCircle size={21} />

              </div>

              <div>

                <h2>
                  Informations personnelles
                </h2>

                <p>
                  Informations de votre compte.
                </p>

              </div>

            </div>


            <ProfileRow
              icon={<User size={18} />}
              label="Nom complet"
              value={fullName}
            />


            <ProfileRow
              icon={<UserCircle size={18} />}
              label="Nom d'utilisateur"
              value={profile.username}
            />


            <ProfileRow
              icon={<Mail size={18} />}
              label="Adresse e-mail"
              value={profile.email}
            />


            <ProfileRow
              icon={<Phone size={18} />}
              label="Téléphone"
              value={profile.telephone}
            />

          </section>


          <section className="profile-card">

            <div className="profile-card-header">

              <div className="profile-card-icon">

                <BriefcaseBusiness
                  size={21}
                />

              </div>

              <div>

                <h2>
                  Informations professionnelles
                </h2>

                <p>
                  Fonction et droits
                  dans l'application.
                </p>

              </div>

            </div>


            <ProfileRow
              icon={
                <BriefcaseBusiness
                  size={18}
                />
              }
              label="Titre du poste"
              value={profile.titre_poste}
            />


            <ProfileRow
              icon={
                <Building2 size={18} />
              }
              label="Corps de métier"
              value={profile.corps_metier}
            />


            <ProfileRow
              icon={
                <ShieldCheck size={18} />
              }
              label="Rôle"
              value={
                getRoleLabel(
                  profile.role
                )
              }
            />


            <ProfileRow
              icon={
                <ShieldCheck size={18} />
              }
              label="État du compte"
              value={
                profile.is_active
                  ? "Compte actif"
                  : "Compte désactivé"
              }
            />

          </section>

        </div>

      )}

    </div>
  );
}


/* ============================================================
   LIGNE D'INFORMATION
   ============================================================ */

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {

  return (
    <div className="profile-row">

      <div className="profile-row-icon">

        {icon}

      </div>

      <div className="profile-row-content">

        <span>
          {label}
        </span>

        <strong>
          {value || "Non renseigné"}
        </strong>

      </div>

    </div>
  );
}