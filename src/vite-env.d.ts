/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL: string
	readonly VITE_CLASS_CAMPUS_ID: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
