import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import RevelarPassModal from "../components/RevelarPassModal";
import { Icon, ToothIcon } from "../components/icons";
import { APP_NAME, APP_SUFFIX } from "../config/constants";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [revelarOpen, setRevelarOpen] = useState(false);

  // Atajo oculto: F6 abre la recuperación de contraseña (función interna SA).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F6") {
        e.preventDefault();
        setRevelarOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="layout">
      <div
        className={`layout__overlay${menuOpen ? " layout__overlay--visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <header className="layout__mobile-header">
        <button
          type="button"
          className="layout__hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={24} />
        </button>
        <div className="layout__mobile-logo">
          <ToothIcon className="layout__mobile-logo-icon" />
          <span>{APP_NAME} {APP_SUFFIX}</span>
        </div>
      </header>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="layout__content">{children}</main>

      <RevelarPassModal open={revelarOpen} onClose={() => setRevelarOpen(false)} />
    </div>
  );
}
