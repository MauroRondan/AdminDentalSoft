/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Loader from "../components/Loader";

let setVisibleRef = null;
let queued = null;
let showStart = 0;
let hideTimer = null;
const MIN_VISIBLE_MS = 400;

const apply = (value) => {
  if (setVisibleRef) setVisibleRef(value);
  else queued = value;
};

export const cargarLoader = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  showStart = Date.now();
  apply(true);
};

export const ocultarLoader = () => {
  const elapsed = Date.now() - showStart;
  const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
  if (hideTimer) clearTimeout(hideTimer);
  if (wait > 0) {
    hideTimer = setTimeout(() => {
      apply(false);
      hideTimer = null;
    }, wait);
  } else {
    apply(false);
  }
};

export default function LoaderManager() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisibleRef = setVisible;
    if (queued !== null) {
      setVisible(queued);
      queued = null;
    }
    return () => {
      setVisibleRef = null;
    };
  }, []);

  return createPortal(visible ? <Loader /> : null, document.body);
}
