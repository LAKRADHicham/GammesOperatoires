import ReferentielPage from "./ReferentielPage";

/**
 * Catalogue historique des pièces.
 * Dans le Wizard, les pièces restent toutefois saisies librement : Nom + Référence + Quantité.
 */
export default function PiecesPage() {
  return (
    <ReferentielPage
      title="Pièces de rechange"
      subtitle="Catalogue historique des pièces de maintenance"
      endpoint="/pieces/"
      primaryField="nom"
      secondaryFields={["code", "constructeur", "reference", "description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        { name: "code", label: "Code" },
        { name: "nom", label: "Nom", required: true },
        { name: "constructeur", label: "Constructeur" },
        { name: "reference", label: "Référence constructeur" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image_url", label: "Image", type: "image" },
      ]}
    />
  );
}
