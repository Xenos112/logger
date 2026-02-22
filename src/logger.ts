import { loadLoggerConfig, writeToFile } from "./config";
import { LogDetails, LogLevel, LoggerConfig, LoggerOptions } from "./types";

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
};

const COLORS: Record<LogLevel, string> = {
	debug: "\x1b[36m", // Cyan
	info: "\x1b[32m", // Green
	warn: "\x1b[33m", // Yellow
	error: "\x1b[31m" // Red
};

const RESET = "\x1b[0m";

let globalConfig: LoggerConfig | null = null;

async function initGlobalConfig(): Promise<void> {
	if (globalConfig === null) {
		globalConfig = await loadLoggerConfig();
	}
}

export class Logger {
	private level: LogLevel;
	private prefix: string;
	private timestamps: boolean;
	private colors: boolean;
	private loggingFile: string | null;
	private path: string | null;
	private configLoaded: boolean = false;
	private userOptions: LoggerOptions;

	constructor(path?: string, options: LoggerOptions = {}) {
		// Start with defaults, will be overridden by config and user options
		this.level = "info";
		this.prefix = "";
		this.timestamps = true;
		this.colors = true;
		this.loggingFile = null;
		this.path = path ?? null;
		this.userOptions = options;
	}

	private async ensureConfig(): Promise<void> {
		if (this.configLoaded) return;

		await initGlobalConfig();

		// Start with hardcoded defaults
		const finalConfig: Required<LoggerOptions> = {
			level: "info",
			prefix: "",
			timestamps: true,
			colors: true,
			loggingFile: null!
		};

		// Apply config file settings if they exist
		if (globalConfig) {
			if (globalConfig.timestamps !== undefined)
				finalConfig.timestamps = globalConfig.timestamps;
			if (globalConfig.colors !== undefined)
				finalConfig.colors = globalConfig.colors;
			if (globalConfig.loggingFile !== undefined)
				finalConfig.loggingFile = globalConfig.loggingFile;
		}

		// Apply user options as overrides (only if explicitly provided)
		if (this.userOptions.level !== undefined)
			finalConfig.level = this.userOptions.level;
		if (this.userOptions.prefix !== undefined)
			finalConfig.prefix = this.userOptions.prefix;
		if (this.userOptions.timestamps !== undefined)
			finalConfig.timestamps = this.userOptions.timestamps;
		if (this.userOptions.colors !== undefined)
			finalConfig.colors = this.userOptions.colors;
		if (this.userOptions.loggingFile !== undefined)
			finalConfig.loggingFile = this.userOptions.loggingFile;

		// Apply final config to instance
		this.level = finalConfig.level;
		this.prefix = finalConfig.prefix;
		this.timestamps = finalConfig.timestamps;
		this.colors = finalConfig.colors;
		this.loggingFile = finalConfig.loggingFile ?? null;
		// path is set in constructor and not overridden by config

		this.configLoaded = true;
	}

	private shouldLog(level: LogLevel): boolean {
		return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
	}

	private formatMessage(
		level: LogLevel,
		message: string,
		includeColors: boolean
	): string {
		const parts: string[] = [];

		if (this.timestamps) {
			parts.push(`[${new Date().toISOString()}]`);
		}

		parts.push(`[${level.toUpperCase()}]`);

		if (this.path) {
			parts.push(`[${this.path}]`);
		}

		if (this.prefix) {
			parts.push(`[${this.prefix}]`);
		}

		let formatted = parts.join(" ") + " " + message;

		if (includeColors && this.colors) {
			formatted = COLORS[level] + formatted + RESET;
		}

		return formatted;
	}

	private async log(
		level: LogLevel,
		message: string,
		...args: unknown[]
	): Promise<void> {
		await this.ensureConfig();

		if (!this.shouldLog(level)) return;

		const timestamp = new Date();

		const consoleMessage = this.formatMessage(level, message, true);
		const fileMessage = this.formatMessage(level, message, false);

		if (this.loggingFile) {
			const fileOutput =
				args.length > 0
					? fileMessage +
						" " +
						args
							.map((a) =>
								typeof a === "object" ? JSON.stringify(a) : String(a)
							)
							.join(" ")
					: fileMessage;
			await writeToFile(this.loggingFile, fileOutput);
		}

		// Execute onLog callback if defined in config
		if (globalConfig?.onLog) {
			const details: LogDetails = {
				level,
				message,
				timestamp,
				prefix: this.prefix || undefined,
				args
			};
			await globalConfig.onLog(details);
		}

		switch (level) {
			case "error":
				console.error(consoleMessage, ...args);
				break;
			case "warn":
				console.warn(consoleMessage, ...args);
				break;
			default:
				console.log(consoleMessage, ...args);
		}
	}

	async debug(message: string, ...args: unknown[]): Promise<void> {
		await this.log("debug", message, ...args);
	}

	async info(message: string, ...args: unknown[]): Promise<void> {
		await this.log("info", message, ...args);
	}

	async warn(message: string, ...args: unknown[]): Promise<void> {
		await this.log("warn", message, ...args);
	}

	async error(message: string, ...args: unknown[]): Promise<void> {
		await this.log("error", message, ...args);
	}

	child(options: LoggerOptions): Logger {
		// Use userOptions.prefix as fallback if this.prefix hasn't been loaded yet
		const inheritedPrefix = this.prefix || this.userOptions.prefix;
		return new Logger(this.path ?? undefined, {
			level: options.level,
			prefix: options.prefix ?? inheritedPrefix,
			timestamps: options.timestamps,
			colors: options.colors,
			loggingFile: options.loggingFile ?? this.loggingFile ?? undefined
		});
	}
}