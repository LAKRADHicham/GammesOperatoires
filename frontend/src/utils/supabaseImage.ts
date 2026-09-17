/**
 * ============================================================
 * SUPABASE IMAGE UTILITIES
 * ============================================================
 *
 * Centralise la construction des URLs publiques des images
 * stockées dans Supabase Storage.
 *
 * Bucket utilisé :
 *   referentiels
 *
 * Exemples de valeurs enregistrées en base :
 *
 *   epis/casque_de_securite.png
 *   epcs/garde_corps.png
 *   risques/risque_electrique.png
 *   outillages/cle_a_molette.png
 *   pieces_rechange/roulement.png
 *
 * Elles sont transformées automatiquement en :
 *
 * https://<project>.supabase.co/storage/v1/object/public/
 * referentiels/epis/casque_de_securite.png
 */


/* ============================================================
   CONFIGURATION
   ============================================================ */

const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL ?? ""
)
  .trim()
  .replace(/\/+$/, "");

const REFERENTIELS_BUCKET = "referentiels";


/* ============================================================
   TYPES D'URL DÉJÀ UTILISABLES
   ============================================================ */

/**
 * Vérifie si la valeur est déjà directement utilisable
 * comme source d'une image.
 *
 * Exemples :
 * https://...
 * http://...
 * data:image/...
 * blob:...
 */
function isDirectImageUrl(value: string): boolean {
  return /^(https?:\/\/|data:|blob:)/i.test(value);
}


/* ============================================================
   NETTOYAGE DU CHEMIN
   ============================================================ */

/**
 * Nettoie le chemin enregistré en base.
 *
 * Exemple :
 *
 * /epis/casque.png
 *
 * devient :
 *
 * epis/casque.png
 */
function cleanStoragePath(value: string): string {
  return value
    .trim()
    .replace(/^\/+/, "");
}


/* ============================================================
   URL PUBLIQUE SUPABASE
   ============================================================ */

/**
 * Transforme un chemin relatif Supabase Storage en URL publique.
 *
 * Exemple :
 *
 * supabaseImageUrl("epis/casque_de_securite.png")
 *
 * retourne :
 *
 * https://xxxxx.supabase.co/storage/v1/object/public/
 * referentiels/epis/casque_de_securite.png
 *
 *
 * Si la valeur est déjà une URL HTTP/HTTPS, une Data URL ou
 * une Blob URL, elle est retournée sans modification.
 *
 * Si aucune image n'est renseignée, retourne "".
 */
export function supabaseImageUrl(
  value?: string | null
): string {

  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }


  /* ----------------------------------------------------------
     URL déjà complète
     ---------------------------------------------------------- */

  if (isDirectImageUrl(raw)) {
    return raw;
  }


  /* ----------------------------------------------------------
     Vérification configuration Supabase
     ---------------------------------------------------------- */

  if (!SUPABASE_URL) {
    console.warn(
      "[supabaseImageUrl] VITE_SUPABASE_URL n'est pas configurée."
    );

    return "";
  }


  /* ----------------------------------------------------------
     Nettoyage du chemin
     ---------------------------------------------------------- */

  let path = cleanStoragePath(raw);


  /* ----------------------------------------------------------
     Évite de doubler le nom du bucket
     
     Si la base contient par exemple :
     
     referentiels/epis/casque.png
     
     on transforme en :
     
     epis/casque.png
     ---------------------------------------------------------- */

  const bucketPrefix = `${REFERENTIELS_BUCKET}/`;

  if (path.startsWith(bucketPrefix)) {
    path = path.slice(bucketPrefix.length);
  }


  /* ----------------------------------------------------------
     Construction URL publique
     ---------------------------------------------------------- */

  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${REFERENTIELS_BUCKET}/` +
    `${path}`
  );
}


/* ============================================================
   ALIAS
   ============================================================ */

/**
 * Alias plus générique.
 *
 * Permet d'utiliser :
 *
 * getImageUrl(item.image_url)
 *
 * au lieu de :
 *
 * supabaseImageUrl(item.image_url)
 */
export function getImageUrl(
  value?: string | null
): string {
  return supabaseImageUrl(value);
}


/* ============================================================
   VÉRIFICATION IMAGE
   ============================================================ */

/**
 * Retourne true lorsqu'une valeur d'image existe.
 *
 * Attention :
 * cette fonction vérifie seulement qu'une valeur est présente.
 * Elle ne vérifie pas que le fichier existe réellement dans
 * Supabase Storage.
 */
export function hasImage(
  value?: string | null
): boolean {
  return String(value ?? "").trim().length > 0;
}


/* ============================================================
   CONFIGURATION DISPONIBLE
   ============================================================ */

/**
 * Permet de vérifier si VITE_SUPABASE_URL est configurée.
 */
export function isSupabaseImageConfigured(): boolean {
  return SUPABASE_URL.length > 0;
}


/* ============================================================
   EXPORT PAR DÉFAUT
   ============================================================ */

export default supabaseImageUrl;