import ReferentielPage from "./ReferentielPage";

/** Configure le CRUD du référentiel EPI, y compris l'ajout et la prévisualisation d'une image. */
export default function EPIPage() {
  return (
    <ReferentielPage
      title="EPI"
      subtitle="Équipements de protection individuelle disponibles pour les gammes"
      endpoint="/epis/"
      primaryField="nom"
      secondaryFields={["description"]}
      imageField="image_url"
      displayMode="cards"
      fields={[
        { name: "nom", label: "Nom", required: true, placeholder: "Ex. Gants anti-coupure" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "image_url", label: "Image / pictogramme", type: "image" },
      ]}
    />
  );
}
