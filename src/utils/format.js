// Formato de moneda para precios mensuales. Guaraníes por defecto (sin decimales).
const formatter = new Intl.NumberFormat("es-PY", {
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `Gs. ${formatter.format(n)}`;
}

export function formatNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return formatter.format(n);
}
