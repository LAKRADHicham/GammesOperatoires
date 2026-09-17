import "./Modules.css";

type Props = {
  title: string;
  subtitle: string;
};

export default function SimpleModulePage({
  title,
  subtitle,
}: Props) {
  return (
    <div className="module-page-v3">
      <header className="module-v3-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>

      <section className="module-v3-card">
        <div className="module-v3-empty">
          Module prêt pour la prochaine phase fonctionnelle.
        </div>
      </section>
    </div>
  );
}
