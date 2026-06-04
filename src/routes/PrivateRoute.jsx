import { Navigate } from "react-router-dom";
import { SESSION_KEY, NIVEL_SUPERADMIN } from "../config/constants";
import { get } from "../utils/storage";

/**
 * Protege rutas privadas: exige sesión activa Y nivel superadmin (SA).
 * Cualquier otra cosa redirige al login.
 */
const PrivateRoute = ({ children }) => {
  const session = get(SESSION_KEY);
  const ok = session?.token && String(session.nivel) === NIVEL_SUPERADMIN;
  return ok ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
