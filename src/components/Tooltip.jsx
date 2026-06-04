import { useState } from "react";

export default function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && text && <span className="tooltip__bubble" role="tooltip">{text}</span>}
    </span>
  );
}
