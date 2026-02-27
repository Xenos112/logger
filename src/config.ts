import type { LoggerConfig, LogRotationConfig } from "./types";
import { dirname, normalize, basename, extname, join } from "path";
import {
	appendFileSync,
	mkdirSync,
	existsSync,
	readFileSync,
	unlinkSync,
	readdirSync,
	statSync
} from "fs";

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

interface RotationState {
	lastRotationDate: Date;
	currentSize: number;
}

const rotationStates: Map<string, RotationState> = new Map();

// File operations - only available in Node.js and browser dev mode
export async function writeToFile(
	filePath: string,
	message: string,
	rotationConfig?: LogRotationConfig
): Promise<void> {
	// In Node.js: always write to file
	// In browser: only write in dev mode (prod mode silently skips)
	if (!isNode && !isDev) return;

	// Browser file writing requires File System Access API - skip for now
	if (!isNode) {
		return;
	}

	try {
		const normalizedPath = normalize(filePath);
		const dir = dirname(normalizedPath);
		const fileName = basename(normalizedPath, extname(normalizedPath));
		const fileExt = extname(normalizedPath);

		// Create directory if it's not the current directory or root
		if (dir && dir !== "." && dir !== "/") {
			try {
				mkdirSync(dir, { recursive: true });
			} catch {
				// Directory already exists or can't be created
			}
		}

		const messageWithNewline = message + "\n";
		const messageSize = Buffer.byteLength(messageWithNewline, "utf-8");

		// Handle rotation if configured
		if (rotationConfig) {
			await handleRotation(
				normalizedPath,
				dir,
				fileName,
				fileExt,
				messageSize,
				messageWithNewline,
				rotationConfig
			);
		} else {
			appendFileSync(normalizedPath, messageWithNewline, "utf-8");
		}
	} catch {
		// Silently fail if can't write to file
	}
}

async function handleRotation(
	filePath: string,
	dir: string,
	fileName: string,
	fileExt: string,
	messageSize: number,
	messageWithNewline: string,
	config: LogRotationConfig
): Promise<void> {
	const { maxSize, maxFiles = 5, daily, hourly, compress, dateFormat } =
		config;

	const now = new Date();
	const state = rotationStates.get(filePath);

	// Initialize state if not exists
	if (!state) {
		const initialSize = existsSync(filePath) ? statSync(filePath).size : 0;
		rotationStates.set(filePath, {
			lastRotationDate: now,
			currentSize: initialSize
		});
	}

	const currentState = rotationStates.get(filePath)!;
	let shouldRotate = false;

	// Check size-based rotation
	if (maxSize && currentState.currentSize >= maxSize) {
		shouldRotate = true;
	}

	// Check daily rotation
	if (daily) {
		const lastDate = currentState.lastRotationDate;
		if (
			lastDate.getDate() !== now.getDate() ||
			lastDate.getMonth() !== now.getMonth() ||
			lastDate.getFullYear() !== now.getFullYear()
		) {
			shouldRotate = true;
		}
	}

	// Check hourly rotation
	if (hourly) {
		const lastDate = currentState.lastRotationDate;
		if (
			lastDate.getHours() !== now.getHours() ||
			lastDate.getDate() !== now.getDate()
		) {
			shouldRotate = true;
		}
	}

	if (shouldRotate) {
		// Rename current file to archive
		const timestamp = formatTimestamp(
			currentState.lastRotationDate,
			dateFormat
		);
		const archiveName = `${fileName}.${timestamp}${fileExt}`;
		const archivePath = join(dir, archiveName);

		try {
			if (existsSync(filePath)) {
				// Read and archive content
				const content = readFileSync(filePath, "utf-8");

				if (compress) {
					// Write compressed archive
					const gzPath = join(dir, `${archiveName}.gz`);
					appendFileSync(gzPath, content);
				} else {
					// Write as archived file
					appendFileSync(archivePath, content);
				}
			}

			// Clean up old files beyond maxFiles
			await cleanupOldFiles(dir, fileName, fileExt, maxFiles, compress);

			// Reset state
			rotationStates.set(filePath, {
				lastRotationDate: now,
				currentSize: 0
			});
		} catch {
			// Continue even if rotation fails
		}
	}

	// Write to file
	appendFileSync(filePath, messageWithNewline, "utf-8");

	// Update size
	const newState = rotationStates.get(filePath);
	if (newState) {
		newState.currentSize += messageSize;
	}
}

function formatTimestamp(date: Date, customFormat?: string): string {
	if (customFormat) {
		return customFormat
			.replace("YYYY", date.getFullYear().toString())
			.replace(
				"MM",
				(date.getMonth() + 1).toString().padStart(2, "0")
			)
			.replace("DD", date.getDate().toString().padStart(2, "0"))
			.replace("HH", date.getHours().toString().padStart(2, "0"))
			.replace("mm", date.getMinutes().toString().padStart(2, "0"))
			.replace("ss", date.getSeconds().toString().padStart(2, "0"));
	}
	const y = date.getFullYear();
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const d = date.getDate().toString().padStart(2, "0");
	const h = date.getHours().toString().padStart(2, "0");
	const min = date.getMinutes().toString().padStart(2, "0");
	const s = date.getSeconds().toString().padStart(2, "0");
	return `${y}-${m}-${d}-${h}-${min}-${s}`;
}

async function cleanupOldFiles(
	dir: string,
	fileName: string,
	fileExt: string,
	maxFiles: number,
	compress?: boolean
): Promise<void> {
	try {
		const files = readdirSync(dir)
			.filter((f: string) => {
				const isOld =
					f.startsWith(fileName) &&
					(f.includes(".old") || f.includes("-20"));
				const isCompressed =
					compress && f.startsWith(fileName) && f.endsWith(".gz");
				return isOld || isCompressed;
			})
			.map((f: string) => ({
				name: f,
				path: join(dir, f),
				time: statSync(join(dir, f)).mtime.getTime()
			}))
			.sort((a: { time: number }, b: { time: number }) => b.time - a.time);

		// Keep maxFiles
		const filesToDelete = files.slice(maxFiles);
		for (const file of filesToDelete) {
			unlinkSync(file.path);
		}
	} catch {
		// Ignore cleanup errors
	}
}

/**
 * Helper function to define logger configuration with type inference
 * Similar to Vite/Vitest defineConfig
 */
export function defineConfig<T extends LoggerConfig>(config: T): T {
	return config;
}
