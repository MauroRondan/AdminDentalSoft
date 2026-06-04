import { isRequired, isValidEmail, minLength, firstError } from "./rules";

export function validateLogin(values) {
  const errors = {};

  const emailError = firstError(isRequired(values.email), isValidEmail(values.email));
  if (emailError) errors.email = emailError;

  const passwordError = firstError(
    isRequired(values.password),
    minLength(3)(values.password),
  );
  if (passwordError) errors.password = passwordError;

  return errors;
}
