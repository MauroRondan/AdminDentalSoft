const TOOTH =
  "M12 2.5 C9.5 1 6 1.2 4.3 3.2 C2.6 5.2 2.8 8 3.5 11 C3.9 13.5 4.4 16 5.2 18 C5.7 19.8 6.5 21.5 7.5 21.5 C8.5 21.5 8.9 19.5 9.2 17.5 C9.5 15 10.5 13 12 13 C13.5 13 14.5 15 14.8 17.5 C15.1 19.5 15.5 21.5 16.5 21.5 C17.5 21.5 18.3 19.8 18.8 18 C19.6 16 20.1 13.5 20.5 11 C21.2 8 21.4 5.2 19.7 3.2 C18 1.2 14.5 1 12 2.5 Z";

export default function Loader() {
  return (
    <div className="loader-overlay">
      <div className="tooth-loader">
        <svg className="tooth-loader__svg" viewBox="0 0 24 24" width="96" height="96">
          <defs>
            <clipPath id="loaderToothClip">
              <path d={TOOTH} />
            </clipPath>
          </defs>
          <path d={TOOTH} className="tooth-loader__bg" />
          <g clipPath="url(#loaderToothClip)">
            <rect className="tooth-loader__fill" x="0" y="0" width="24" height="24" />
          </g>
        </svg>
        <span className="tooth-loader__text">Cargando…</span>
      </div>
    </div>
  );
}
