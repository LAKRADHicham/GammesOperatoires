import ReferentielPage from "./ReferentielPage";

/** Configure le CRUD du référentiel Outillages, y compris l'ajout et la prévisualisation d'une image. */
export default function OutillagesPage() {
  return (
    <ReferentielPage
      title="Outillages"
      subtitle="Moyens et outils de maintenance disponibles dans le Wizard"
      endpoint="/outillages/"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        { name: "nom", label: "Nom", required: true, placeholder: "Ex. Clé dynamométrique" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image_url", label: "Image", type: "image" },
      ]}
    />
  );
}
