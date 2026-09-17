import ReferentielPage from "./ReferentielPage";

/** Configure le CRUD du référentiel EPC, y compris l'ajout et la prévisualisation d'une image. */
export default function EPCPage() {
  return (
    <ReferentielPage
      title="EPC"
      subtitle="Équipements de protection collective disponibles pour les gammes"
      endpoint="/v2/epcs/"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        { name: "nom", label: "Nom", required: true, placeholder: "Ex. Barrière de protection" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image_url", label: "Image / pictogramme", type: "image" },
      ]}
    />
  );
}
