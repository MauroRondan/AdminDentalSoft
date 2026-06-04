import Tooltip from "./Tooltip";

export default function TextField({ label, name, error, help, ...props }) {
  return (
    <div className="text-field">
      <label className="text-field__label" htmlFor={name}>
        {label}
        {help && (
          <Tooltip text={help}>
            <span className="text-field__help" aria-label="Ayuda">
              ?
            </span>
          </Tooltip>
        )}
      </label>
      <input
        id={name}
        name={name}
        className={`text-field__input${error ? " text-field__input--error" : ""}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && (
        <span className="text-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
