import { useEffect, useState } from "react";

/**
 * Calcula cuántas filas entran en el contenedor (alto disponible / alto de fila).
 * Se actualiza ante resize del contenedor y del viewport.
 */
export default function useFitRows(
  containerRef,
  { rowHeight = 54, headerOffset = 46, minRows = 5 } = {},
) {
  const [rows, setRows] = useState(10);

  useEffect(() => {
    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const usable = Math.max(0, el.clientHeight - headerOffset);
      const next = Math.max(minRows, Math.floor(usable / rowHeight));
      setRows((prev) => (prev === next ? prev : next));
    };

    compute();

    let ro;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      ro = new ResizeObserver(compute);
      ro.observe(containerRef.current);
    }
    window.addEventListener("resize", compute);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [containerRef, rowHeight, headerOffset, minRows]);

  return rows;
}
