import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Botón de 3 puntitos que abre un popover con acciones por fila.
 * El popover se posiciona con `position: fixed` para no quedar recortado por el
 * scroll de la tabla.
 */
export default function RowMenu({ items, ariaLabel = "Acciones" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ right: 0, top: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      right: Math.max(8, window.innerWidth - rect.right),
      top: rect.bottom + 6,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (event) => {
      if (btnRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="row-menu__trigger"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="moreVertical" size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="row-menu__pop"
          style={{ right: pos.right, top: pos.top }}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              className={`row-menu__item${item.danger ? " row-menu__item--danger" : ""}`}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
            >
              {item.icon && <Icon name={item.icon} size={15} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
