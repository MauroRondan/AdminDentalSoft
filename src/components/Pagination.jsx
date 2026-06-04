import { Icon } from "./icons";

function buildRange(current, total, windowSize = 4) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, start + windowSize - 1);
  if (end === total - 1) {
    start = Math.max(2, end - windowSize + 1);
  }
  const out = [1];
  if (start > 2) out.push("e-l");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("e-r");
  out.push(total);
  return out;
}

export default function Pagination({ page, total, pageSize, onChange }) {
  if (!total || !pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const rangeFrom = (current - 1) * pageSize + 1;
  const rangeTo = Math.min(current * pageSize, total);
  const items = buildRange(current, totalPages);

  const go = (n) => {
    if (n < 1 || n > totalPages || n === current) return;
    onChange(n);
  };

  return (
    <div className="pagination">
      <span className="pagination__info">
        Mostrando {rangeFrom}–{rangeTo} de {total}
      </span>
      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__btn"
          disabled={current === 1}
          onClick={() => go(current - 1)}
          aria-label="Anterior"
        >
          <Icon name="chevronLeft" size={16} />
        </button>

        {items.map((item, index) =>
          typeof item === "number" ? (
            <button
              key={`p-${item}`}
              type="button"
              className={`pagination__page${current === item ? " pagination__page--active" : ""}`}
              onClick={() => go(item)}
              aria-current={current === item ? "page" : undefined}
            >
              {item}
            </button>
          ) : (
            <span key={`e-${index}`} className="pagination__ellipsis" aria-hidden>
              …
            </span>
          ),
        )}

        <button
          type="button"
          className="pagination__btn"
          disabled={current === totalPages}
          onClick={() => go(current + 1)}
          aria-label="Siguiente"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}
