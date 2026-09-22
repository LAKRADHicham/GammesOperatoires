import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  FileArchive,
  FileText,
  Gauge,
  HardHat,
  Building2,
  History,
  ListChecks,
  LogOut,
  PackageSearch,
  QrCode,
  Settings,
  ShieldAlert,
  Tags,
  UserRound,
  Wrench,
} from "lucide-react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { logout } from "../api/auth";
import "./Sidebar.css";


/* ============================================================
   TYPES
   ============================================================ */

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
};


/* ============================================================
   DASHBOARD
   ============================================================ */

const dashboardItem: NavItem = {
  label: "Dashboard",
  path: "/",
  icon: <Gauge size={17} />,
};


/* ============================================================
   MAINTENANCE
   ============================================================ */

const maintenanceItems: NavItem[] = [
  {
    label: "Gammes opératoires",
    path: "/gammes",
    icon: <FileText size={17} />,
  },
  {
    label: "Versions",
    path: "/versions",
    icon: <History size={17} />,
  },
];


/* ============================================================
   RÉFÉRENTIELS
   ============================================================ */

const referenceItems: NavItem[] = [
  {
    label: "Équipements",
    path: "/equipements",
    icon: <HardHat size={17} />,
  },
  {
  label: "Entreprises / Logos",
  path: "/entreprises",
  icon: <Building2 size={17} />,
},
  {
    label: "Corps de métier",
    path: "/referentiels?categorie=corps_metier",
    icon: <Tags size={17} />,
  },
  {
    label: "Type maintenance",
    path: "/referentiels?categorie=type_maintenance",
    icon: <ListChecks size={17} />,
  },
  {
    label: "Périodicité",
    path: "/referentiels?categorie=periodicite",
    icon: <ListChecks size={17} />,
  },
  {
    label: "Type d'arrêt",
    path: "/referentiels?categorie=type_arret",
    icon: <ListChecks size={17} />,
  },
  {
    label: "Statut de la gamme",
    path: "/referentiels?categorie=statut_gamme",
    icon: <ListChecks size={17} />,
  },
  {
    label: "Type de rédaction",
    path: "/referentiels?categorie=type_redaction",
    icon: <ListChecks size={17} />,
  },
  {
    label: "EPI",
    path: "/referentiels/epis",
    icon: <HardHat size={17} />,
  },
  {
    label: "EPC",
    path: "/referentiels/epc",
    icon: <ShieldAlert size={17} />,
  },
  {
    label: "Risques",
    path: "/referentiels/risques",
    icon: <ShieldAlert size={17} />,
  },
  {
    label: "Outillages",
    path: "/referentiels/outillages",
    icon: <Wrench size={17} />,
  },
];


/* ============================================================
   PILOTAGE
   ============================================================ */

const pilotageItems: NavItem[] = [
  {
    label: "Indicateurs / KPI",
    path: "/kpi",
    icon: <BarChart3 size={17} />,
  },
  {
    label: "Plans maintenance",
    path: "/plans-maintenance",
    icon: <ClipboardList size={17} />,
  },
];


/* ============================================================
   SYSTÈME
   ============================================================ */

const systemItems: NavItem[] = [
  {
    label: "QR Codes",
    path: "/qr-codes",
    icon: <QrCode size={17} />,
  },
  {
    label: "Exports",
    path: "/exports",
    icon: <FileArchive size={17} />,
  },
];


/* ============================================================
   PROFIL UTILISATEUR
   ============================================================ */

const profileItem: NavItem = {
  label: "Mon profil",
  path: "/profil",
  icon: <UserRound size={17} />,
};


/* ============================================================
   URL COURANTE
   ============================================================ */

function getCurrentUrl(
  pathname: string,
  search: string
): string {
  return `${pathname}${search}`;
}


/* ============================================================
   LIEN DE NAVIGATION
   ============================================================ */

function NavigationItem({
  item,
}: {
  item: NavItem;
}) {
  const location = useLocation();

  const currentUrl = getCurrentUrl(
    location.pathname,
    location.search
  );

  const hasQuery = item.path.includes("?");

  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) => {
        const active = hasQuery
          ? currentUrl === item.path
          : isActive;

        return active
          ? "sidebar-link active"
          : "sidebar-link";
      }}
    >
      <span className="sidebar-link-icon">
        {item.icon}
      </span>

      <span className="sidebar-link-label">
        {item.label}
      </span>
    </NavLink>
  );
}


/* ============================================================
   SIDEBAR
   ============================================================ */

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [referencesOpen, setReferencesOpen] =
    useState(true);

  const [systemOpen, setSystemOpen] =
    useState(true);


  /* ==========================================================
     RÉFÉRENTIEL ACTIF
     ========================================================== */

  const referenceActive = useMemo(() => {
    return (
      location.pathname === "/equipements" ||
      location.pathname === "/entreprises" ||
      location.pathname.startsWith("/referentiels")
    );
  }, [location.pathname]);


  /* ==========================================================
     SYSTÈME ACTIF
     ========================================================== */

  const systemActive = useMemo(() => {
    return systemItems.some((item) =>
      location.pathname.startsWith(item.path)
    );
  }, [location.pathname]);


  /* ==========================================================
     DÉCONNEXION
     ========================================================== */

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };


  return (
    <aside className="sidebar">

      {/* ==================================================== */}
      {/* LOGO */}
      {/* ==================================================== */}

      <div className="sidebar-brand">

        <div className="sidebar-brand-icon">
          <Wrench size={22} />
        </div>

        <div className="sidebar-brand-copy">
          <strong>Gammes</strong>
          <span>Maintenance</span>
        </div>

      </div>


      {/* ==================================================== */}
      {/* CONTENU SCROLLABLE */}
      {/* ==================================================== */}

      <div className="sidebar-scroll">

        {/* ================================================== */}
        {/* DASHBOARD */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <p className="sidebar-section-title">
            DASHBOARD
          </p>

          <NavigationItem item={dashboardItem} />

        </section>


        {/* ================================================== */}
        {/* MAINTENANCE */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <p className="sidebar-section-title">
            MAINTENANCE
          </p>

          {maintenanceItems.map((item) => (
            <NavigationItem
              key={item.path}
              item={item}
            />
          ))}

        </section>


        {/* ================================================== */}
        {/* RÉFÉRENTIELS */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <button
            type="button"
            className={
              referenceActive
                ? "sidebar-group-button active"
                : "sidebar-group-button"
            }
            onClick={() =>
              setReferencesOpen(
                (value) => !value
              )
            }
          >
            <span className="sidebar-group-left">

              <PackageSearch size={17} />

              <span>Référentiels</span>

            </span>

            <ChevronDown
              size={15}
              className={
                referencesOpen
                  ? "chevron open"
                  : "chevron"
              }
            />

          </button>


          {referencesOpen && (

            <div className="sidebar-submenu">

              {referenceItems.map((item) => (
                <NavigationItem
                  key={item.path}
                  item={item}
                />
              ))}

            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* PILOTAGE */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <p className="sidebar-section-title">
            PILOTAGE
          </p>

          {pilotageItems.map((item) => (
            <NavigationItem
              key={item.path}
              item={item}
            />
          ))}

        </section>


        {/* ================================================== */}
        {/* SYSTÈME */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <button
            type="button"
            className={
              systemActive
                ? "sidebar-group-button active"
                : "sidebar-group-button"
            }
            onClick={() =>
              setSystemOpen(
                (value) => !value
              )
            }
          >
            <span className="sidebar-group-left">

              <FileArchive size={17} />

              <span>Système</span>

            </span>

            <ChevronDown
              size={15}
              className={
                systemOpen
                  ? "chevron open"
                  : "chevron"
              }
            />

          </button>


          {systemOpen && (

            <div className="sidebar-submenu">

              {systemItems.map((item) => (
                <NavigationItem
                  key={item.path}
                  item={item}
                />
              ))}

            </div>

          )}

        </section>


        {/* ================================================== */}
        {/* PROFIL UTILISATEUR */}
        {/* ================================================== */}

        <section className="sidebar-section">

          <p className="sidebar-section-title">
            PROFIL UTILISATEUR
          </p>

          <NavigationItem item={profileItem} />

        </section>

      </div>


      {/* ==================================================== */}
      {/* FOOTER */}
      {/* ==================================================== */}

      <div className="sidebar-footer">

        <NavLink
          to="/parametres"
          className="sidebar-link"
        >
          <span className="sidebar-link-icon">
            <Settings size={17} />
          </span>

          <span className="sidebar-link-label">
            Paramètres
          </span>
        </NavLink>


        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-link-icon">
            <LogOut size={17} />
          </span>

          <span className="sidebar-link-label">
            Déconnexion
          </span>
        </button>

      </div>

    </aside>
  );
}