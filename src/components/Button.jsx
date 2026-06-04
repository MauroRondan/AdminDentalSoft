export default function Button({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? "Cargando…" : children}
    </button>
  );
}
