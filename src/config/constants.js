export const APP_NAME = "DentalSoft";
// Etiqueta que distingue este panel del ERP de las clínicas.
export const APP_SUFFIX = "Admin";

// Vite resuelve el entorno desde el comando:
//   yarn dev   -> import.meta.env.DEV = true  (development / local)
//   yarn build -> import.meta.env.PROD = true (production)
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_LOCAL = import.meta.env.DEV;
export const ENVIRONMENT = import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE;

// URL del backend (BackDentalSoft). En local apunta a :9090/dental vía .env.local.
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9090/dental";

// Clave de sesión en localStorage. Distinta de la del ERP ("usuarioMaestro")
// para no pisarse si ambos corren en el mismo navegador.
export const SESSION_KEY = "adminMaestro";

// Nivel de usuario habilitado para este panel (superadmin del SaaS).
export const NIVEL_SUPERADMIN = "SA";
