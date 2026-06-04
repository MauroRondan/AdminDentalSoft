export const isRequired = (value) =>
  value?.toString().trim() ? "" : "Este campo es obligatorio";

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Correo electrónico no válido";

export const minLength = (min) => (value) =>
  (value?.length ?? 0) >= min ? "" : `Debe tener al menos ${min} caracteres`;

export const firstError = (...results) => results.find(Boolean) ?? "";
