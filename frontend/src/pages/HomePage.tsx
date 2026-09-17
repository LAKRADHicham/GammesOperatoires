import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  FileText,
  HardHat,
  LogIn,
  QrCode,
  Settings,
  ShieldCheck,
  UserPlus,
  Wrench,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import "./HomePage.css";


/* ============================================================
   PAGE D'ACCUEIL PUBLIQUE
   ============================================================ */

export default function HomePage() {

  return (
    <div className="home-page">


      {/* ======================================================
          NAVIGATION
          ====================================================== */}

      <header className="home-header">

        <Link
          to="/"
          className="home-brand"
        >

          <div className="home-brand-icon">
            <Wrench size={23} />
          </div>

          <div className="home-brand-text">

            <strong>
              Gammes
            </strong>

            <span>
              Maintenance
            </span>

          </div>

        </Link>


        <nav className="home-navigation">

          <a href="#fonctionnalites">
            Fonctionnalités
          </a>

          <a href="#solution">
            La solution
          </a>

          <Link
            to="/login"
            className="home-login-link"
          >
            <LogIn size={17} />

            Se connecter
          </Link>

          <Link
            to="/inscription"
            className="home-register-link"
          >
            <UserPlus size={17} />

            Créer un compte
          </Link>

        </nav>

      </header>


      {/* ======================================================
          HERO
          ====================================================== */}

      <main>

        <section className="home-hero">

          <div className="home-hero-decoration home-circle-one" />

          <div className="home-hero-decoration home-circle-two" />


          <div className="home-hero-content">

            <div className="home-badge">

              <span />

              Maintenance industrielle

            </div>


            <h1>

              Digitalisez vos

              <span>
                {" "}
                gammes de maintenance
              </span>

            </h1>


            <p className="home-hero-description">
              Centralisez vos procédures,
              standardisez vos interventions et
              améliorez la sécurité de vos opérations
              de maintenance dans une seule application.
            </p>


            <div className="home-hero-actions">

              <Link
                to="/login"
                className="home-primary-button"
              >
                Se connecter

                <ArrowRight size={18} />
              </Link>


              <Link
                to="/inscription"
                className="home-secondary-button"
              >
                <UserPlus size={18} />

                Créer un compte
              </Link>

            </div>


            <div className="home-benefits">

              <div>
                <CheckCircle2 size={17} />
                Gammes centralisées
              </div>

              <div>
                <CheckCircle2 size={17} />
                Versioning maîtrisé
              </div>

              <div>
                <CheckCircle2 size={17} />
                Sécurité intégrée
              </div>

            </div>

          </div>


          {/* ==================================================
              APERÇU APPLICATION
              ================================================== */}

          <div className="home-hero-preview">

            <div className="preview-window">

              <div className="preview-topbar">

                <div className="preview-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="preview-title">
                  Gammes Maintenance
                </span>

              </div>


              <div className="preview-body">


                {/* --------------------------------------------
                    MINI SIDEBAR
                    -------------------------------------------- */}

                <div className="preview-sidebar">

                  <div className="preview-logo">
                    <Wrench size={18} />
                  </div>

                  <div className="preview-menu active">
                    <BarChart3 size={15} />
                    Dashboard
                  </div>

                  <div className="preview-menu">
                    <FileText size={15} />
                    Gammes
                  </div>

                  <div className="preview-menu">
                    <Settings size={15} />
                    Équipements
                  </div>

                  <div className="preview-menu">
                    <CalendarCheck2 size={15} />
                    Maintenance
                  </div>

                </div>


                {/* --------------------------------------------
                    MINI DASHBOARD
                    -------------------------------------------- */}

                <div className="preview-dashboard">

                  <div className="preview-dashboard-header">

                    <div>
                      <small>
                        Vue d'ensemble
                      </small>

                      <strong>
                        Dashboard maintenance
                      </strong>
                    </div>

                    <div className="preview-avatar">
                      A
                    </div>

                  </div>


                  <div className="preview-kpis">

                    <div className="preview-kpi">
                      <span>
                        Gammes
                      </span>

                      <strong>
                        48
                      </strong>

                      <small>
                        +6 ce mois
                      </small>
                    </div>


                    <div className="preview-kpi">
                      <span>
                        Équipements
                      </span>

                      <strong>
                        32
                      </strong>

                      <small>
                        Actifs
                      </small>
                    </div>


                    <div className="preview-kpi">
                      <span>
                        Validées
                      </span>

                      <strong>
                        41
                      </strong>

                      <small>
                        85 %
                      </small>
                    </div>

                  </div>


                  <div className="preview-content-row">

                    <div className="preview-chart">

                      <strong>
                        Activité
                      </strong>

                      <div className="preview-bars">

                        <span style={{ height: "38%" }} />
                        <span style={{ height: "55%" }} />
                        <span style={{ height: "43%" }} />
                        <span style={{ height: "75%" }} />
                        <span style={{ height: "62%" }} />
                        <span style={{ height: "88%" }} />
                        <span style={{ height: "70%" }} />

                      </div>

                    </div>


                    <div className="preview-status">

                      <strong>
                        Statut
                      </strong>

                      <div>
                        <span className="status-dot validated" />
                        Validées
                      </div>

                      <div>
                        <span className="status-dot progress" />
                        En validation
                      </div>

                      <div>
                        <span className="status-dot draft" />
                        Brouillons
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ======================================================
            INTRODUCTION
            ====================================================== */}

        <section
          id="solution"
          className="home-introduction"
        >

          <span className="section-badge">
            UNE SOLUTION CENTRALISÉE
          </span>

          <h2>
            Pilotez votre maintenance
            plus simplement
          </h2>

          <p>
            Gammes Maintenance regroupe les informations
            nécessaires à la préparation, l'exécution,
            la validation et le suivi de vos opérations.
          </p>

        </section>


        {/* ======================================================
            FONCTIONNALITÉS
            ====================================================== */}

        <section
          id="fonctionnalites"
          className="home-features"
        >


          {/* --------------------------------------------------
              ÉQUIPEMENTS
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <Settings size={25} />
            </div>

            <h3>
              Équipements
            </h3>

            <p>
              Centralisez votre parc industriel et
              associez chaque gamme à l'équipement
              correspondant.
            </p>

          </article>


          {/* --------------------------------------------------
              GAMMES
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <FileText size={25} />
            </div>

            <h3>
              Gammes opératoires
            </h3>

            <p>
              Créez des procédures structurées avec
              étapes, actions, images, moyens et
              informations techniques.
            </p>

          </article>


          {/* --------------------------------------------------
              SÉCURITÉ
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <ShieldCheck size={25} />
            </div>

            <h3>
              Sécurité
            </h3>

            <p>
              Intégrez les EPI, EPC, risques et
              recommandations directement dans
              vos procédures.
            </p>

          </article>


          {/* --------------------------------------------------
              PLANIFICATION
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <CalendarCheck2 size={25} />
            </div>

            <h3>
              Planification
            </h3>

            <p>
              Structurez vos plans de maintenance
              préventive et maîtrisez les périodicités
              d'intervention.
            </p>

          </article>


          {/* --------------------------------------------------
              KPI
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <BarChart3 size={25} />
            </div>

            <h3>
              Indicateurs & KPI
            </h3>

            <p>
              Suivez les données essentielles :
              disponibilité, MTBF, MTTR et performance
              de la maintenance.
            </p>

          </article>


          {/* --------------------------------------------------
              QR
              -------------------------------------------------- */}

          <article className="home-feature-card">

            <div className="feature-icon">
              <QrCode size={25} />
            </div>

            <h3>
              QR Codes
            </h3>

            <p>
              Accédez rapidement aux gammes depuis
              le terrain grâce aux QR Codes associés
              aux procédures.
            </p>

          </article>

        </section>


        {/* ======================================================
            SÉCURITÉ / MÉTHODE
            ====================================================== */}

        <section className="home-security-section">

          <div className="home-security-content">

            <span className="section-badge light">
              MAINTENANCE MAÎTRISÉE
            </span>

            <h2>
              Une information claire,
              structurée et accessible
            </h2>

            <p>
              De la création d'une gamme jusqu'à sa
              validation, l'application accompagne
              chaque étape du cycle documentaire.
            </p>


            <div className="security-points">

              <div>
                <CheckCircle2 size={20} />

                <span>
                  Gestion des versions
                </span>
              </div>

              <div>
                <CheckCircle2 size={20} />

                <span>
                  Validation des procédures
                </span>
              </div>

              <div>
                <CheckCircle2 size={20} />

                <span>
                  Référentiels centralisés
                </span>
              </div>

              <div>
                <CheckCircle2 size={20} />

                <span>
                  Documents PDF
                </span>
              </div>

            </div>

          </div>


          <div className="home-security-visual">

            <div className="security-card">

              <HardHat size={40} />

              <strong>
                Sécurité & conformité
              </strong>

              <p>
                Les moyens de prévention sont
                intégrés directement dans les
                gammes opératoires.
              </p>

            </div>

          </div>

        </section>


        {/* ======================================================
            CTA
            ====================================================== */}

        <section className="home-cta">

          <div>

            <span className="section-badge">
              COMMENCER
            </span>

            <h2>
              Accédez à votre espace maintenance
            </h2>

            <p>
              Connectez-vous à votre compte ou créez
              votre accès à Gammes Maintenance.
            </p>

          </div>


          <div className="home-cta-buttons">

            <Link
              to="/login"
              className="home-primary-button"
            >
              <LogIn size={18} />

              Se connecter
            </Link>


            <Link
              to="/inscription"
              className="home-outline-button"
            >
              <UserPlus size={18} />

              Créer un compte
            </Link>

          </div>

        </section>

      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="home-footer">

        <div className="home-footer-brand">

          <div className="home-brand-icon small">
            <Wrench size={18} />
          </div>

          <div>
            <strong>
              Gammes Maintenance
            </strong>

            <span>
              Gestion de la maintenance industrielle
            </span>
          </div>

        </div>


        <p>
          Application de gestion des gammes opératoires.
        </p>

      </footer>

    </div>
  );
}