import type { LoggerConfig } from "./types";

let cachedConfig: LoggerConfig | null = null;

// Detect if we're in Node.js or browser
const isNode =
	typeof process !== "undefined" && process.versions?.node !== undefined;

// Detect if we're in development mode
const isDev = (() => {
	// Node.js environment
	if (typeof process !== "undefined" && process.env) {
		return process.env.NODE_ENV !== "production";
	}
	// Vite/browser environment
	if (typeof import.meta !== "undefined" && (import.meta as any).env) {
		return (
			(import.meta as any).env.DEV === true ||
			(import.meta as any).env.MODE === "development"
		);
	}
	// Default to dev if can't detect
	return true;
})();

export { isNode, isDev };

export async function loadLoggerConfig(): Promise<LoggerConfig> {
	if (cachedConfig !== null) {
		return cachedConfig;
	}

	const config: LoggerConfig = {};

	// Only try to load from filesystem in Node.js
	if (isNode) {
		try {
			// Dynamic import to avoid browser bundling issues
			const { pathToFileURL } = await import("url");
			const { join } = await import("path");

			const configPath = join(process.cwd(), "logger.config.ts");
			const configModule = await import(
				/* @vite-ignore */ pathToFileURL(configPath).href
			);
			const loadedConfig = configModule.default ?? configModule;

			Object.assign(config, loadedConfig);
		} catch {
			// Config file doesn't exist, use defaults
		}
	}

	cachedConfig = config;
	return config;
}

export function clearConfigCache(): void {
	cachedConfig = null;
}

// File operations - only available in Node.js and browser dev mode
export async function writeToFile(
	filePath: string,
	message: string
): Promise<void> {
	// In Node.js: always write to file
	// In browser: only write in dev mode (prod mode silently skips)
	if (!isNode && !isDev) return;

	// Browser file writing requires File System Access API - skip for now
	if (!isNode) {
		// In browser dev mode, we could use localStorage/IndexedDB or File System Access API
		// For now, silently skip as actual file system access is limited in browsers
		return;
	}

	try {
		const { appendFileSync, mkdirSync } = await import("fs");
		const { dirname, normalize } = await import("path");

		const normalizedPath = normalize(filePath);
		const dir = dirname(normalizedPath);
		// Create directory if it's not the current directory or root
		if (dir && dir !== "." && dir !== "/") {
			try {
				mkdirSync(dir, { recursive: true });
			} catch {
				// Directory already exists or can't be created
			}
		}
		appendFileSync(filePath, message + "\n", "utf-8");
	} catch {
		// Silently fail if can't write to file
	}
}

/**
 * Helper function to define logger configuration with type inference
 * Similar to Vite/Vitest defineConfig
 */
export function defineConfig<T extends LoggerConfig>(config: T): T {
	return config;
}
