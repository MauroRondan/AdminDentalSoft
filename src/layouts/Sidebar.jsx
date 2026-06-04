import { useNavigate, useLocation } from "react-router-dom";
import { Icon, ToothIcon } from "../components/icons";
import { logout } from "../services/authService";
import { APP_NAME, APP_SUFFIX, SESSION_KEY } from "../config/constants";
import { get } from "../utils/storage";

const MENU = [
  { label: "Inicio", path: "/inicio", icon: "dashboard" },
  { label: "Licencias", path: "/licencias", icon: "building" },
  { label: "Planes", path: "/planes", icon: "tag" },
  { label: "Módulos", path: "/modulos", icon: "layers" },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();
  const session = get(SESSION_KEY);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  return (
    <aside className={`sidebar${open ? " sidebar--open" : ""}`}>
      <div className="sidebar__logo">
        <ToothIcon className="sidebar__logo-icon" />
        <span>{APP_NAME}</span>
        <span className="sidebar__logo-tag">{APP_SUFFIX}</span>
      </div>

      <nav className="sidebar__nav">
        {MENU.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`sidebar__item${isActive(item.path) ? " sidebar__item--active" : ""}`}
            onClick={() => go(item.path)}
          >
            <Icon name={item.icon} className="sidebar__item-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          {session?.nombre || session?.mail || "Superadmin"}
        </div>
        <button
          type="button"
          className="sidebar__item sidebar__item--logout"
          onClick={handleLogout}
        >
          <Icon name="logOut" className="sidebar__item-icon" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
