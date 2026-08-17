/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public API origin, e.g. https://bimcrm-api-ivanov3011.amvera.io — not the internal Amvera host */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}