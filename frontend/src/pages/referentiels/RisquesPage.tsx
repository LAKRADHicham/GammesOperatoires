import ReferentielPage from "./ReferentielPage";

/** Configure le CRUD du référentiel Risques, y compris l'ajout et la prévisualisation d'une image. */
export default function RisquesPage() {
  return (
    <ReferentielPage
      title="Risques"
      subtitle="Bibliothèque des risques de maintenance industrielle"
      endpoint="/risques/"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        { name: "nom", label: "Nom", required: true, placeholder: "Ex. Risque électrique" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image_url", label: "Image / pictogramme", type: "image" },
      ]}
    />
  );
}
