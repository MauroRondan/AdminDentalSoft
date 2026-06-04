import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "../../hooks/useForm";
import { validateLogin } from "../../validations/loginValidation";
import { login } from "../../services/authService";
import { cargarLoader, ocultarLoader } from "../../hooks/LoaderManager";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import { ToothIcon } from "../../components/icons";
import { APP_NAME, APP_SUFFIX } from "../../config/constants";

const firstName = (fullName = "") => fullName.trim().split(/\s+/)[0] || "";

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const { values, errors, handleChange, handleSubmit } = useForm(
    { email: "", password: "" },
    validateLogin,
  );

  const submit = async (data) => {
    setGeneralError("");
    setLoading(true);
    cargarLoader();
    try {
      const session = await login(data);
      const name = firstName(session?.nombre);
      navigate("/inicio");
      toast.success(`${greetingByHour()}${name ? `, ${name}` : ""}`, {
        description: `Panel de administración de ${APP_NAME}.`,
        duration: 5000,
      });
    } catch (error) {
      setGeneralError(error.message);
      toast.error(error.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
      ocultarLoader();
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <aside className="login-page__brand">
          <ToothIcon className="login-page__brand-bg" />

          <div className="login-page__logo">
            <ToothIcon className="login-page__logo-icon" />
            <span>{APP_NAME}</span>
            <span className="login-page__logo-tag">{APP_SUFFIX}</span>
          </div>

          <div className="login-page__brand-text">
            <h2 className="login-page__tagline">
              Administración
              <br />
              de licencias
            </h2>
            <p className="login-page__description">
              Gestioná los planes, los módulos y las clínicas suscriptas a
              DentalSoft desde un solo lugar.
            </p>
          </div>

          <ul className="login-page__benefits">
            <li>Planes y precios por funcionalidad</li>
            <li>Venta modular y mensual</li>
            <li>Control de clínicas suscriptas</li>
          </ul>
        </aside>

        <section className="login-page__panel">
          <header className="login-page__header">
            <h1 className="login-page__title">Panel de administración</h1>
            <p className="login-page__subtitle">
              Acceso exclusivo para el equipo de DentalSoft
            </p>
          </header>

          <form className="login-page__form" onSubmit={handleSubmit(submit)} noValidate>
            <div className="login-page__fields">
              <TextField
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="username"
                value={values.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="superadmin@dentalsoft.com"
              />
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••"
              />
            </div>

            {generalError && (
              <p className="login-page__error" role="alert">
                {generalError}
              </p>
            )}

            <Button type="submit" loading={loading}>
              Iniciar sesión
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
