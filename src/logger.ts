import { loadLoggerConfig, writeToFile } from "./config";
import {
	LogDetails,
	LogLevel,
	LoggerConfig,
	LoggerOptions,
	OnLogFunction
} from "./types";

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

function safeStringify(obj: unknown): string {
	try {
		return JSON.stringify(obj);
	} catch {
		return "[Circular or non-serializable object]";
	}
}

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
	private json: boolean;
	private loggingFile: string | null;
	private enableFileLogging: boolean;
	private path: string | null;
	private configLoaded: boolean = false;
	private userOptions: LoggerOptions;
	private metadata: Record<string, unknown>;
	private onLog: OnLogFunction | undefined;

	constructor(path?: string, options: LoggerOptions = {}) {
		// Start with defaults, will be overridden by config and user options
		this.level = "info";
		this.prefix = "";
		this.timestamps = true;
		this.colors = true;
		this.json = false;
		this.loggingFile = null;
		this.enableFileLogging = true;
		this.path = path ?? null;
		this.userOptions = options;
		this.metadata = {};
		this.onLog = options.onLog;
	}

	private async ensureConfig(): Promise<void> {
		if (this.configLoaded) return;

		await initGlobalConfig();

		type ConfigWithOptionalOnLog = Omit<
			Required<LoggerOptions>,
			"onLog" | "enableFileLogging"
		> & {
			onLog?: OnLogFunction;
			enableFileLogging: boolean;
		};

		// Start with hardcoded defaults
		const finalConfig: ConfigWithOptionalOnLog = {
			level: "info",
			prefix: "",
			timestamps: true,
			colors: true,
			json: false,
			metadata: {},
			onLog: this.onLog,
			enableFileLogging: true,
			loggingFile: null!
		};

		// Apply config file settings if they exist
		if (globalConfig) {
			if (globalConfig.timestamps !== undefined)
				finalConfig.timestamps = globalConfig.timestamps;
			if (globalConfig.colors !== undefined)
				finalConfig.colors = globalConfig.colors;
			if (globalConfig.json !== undefined)
				finalConfig.json = globalConfig.json;
			if (globalConfig.metadata !== undefined)
				finalConfig.metadata = globalConfig.metadata;
			if (globalConfig.loggingFile !== undefined)
				finalConfig.loggingFile = globalConfig.loggingFile;
			if (globalConfig.onLog !== undefined && !finalConfig.onLog)
				finalConfig.onLog = globalConfig.onLog;
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
		if (this.userOptions.json !== undefined)
			finalConfig.json = this.userOptions.json;
		if (this.userOptions.metadata !== undefined)
			finalConfig.metadata = this.userOptions.metadata;
		if (this.userOptions.loggingFile !== undefined)
			finalConfig.loggingFile = this.userOptions.loggingFile;
		if (this.userOptions.onLog !== undefined)
			finalConfig.onLog = this.userOptions.onLog;
		if (this.userOptions.enableFileLogging !== undefined)
			finalConfig.enableFileLogging = this.userOptions.enableFileLogging;

		// Apply final config to instance
		this.level = finalConfig.level;
		this.prefix = finalConfig.prefix;
		this.timestamps = finalConfig.timestamps;
		this.colors = finalConfig.colors;
		this.json = finalConfig.json;
		this.metadata = finalConfig.metadata;
		this.onLog = finalConfig.onLog;
		this.enableFileLogging = finalConfig.enableFileLogging;
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
		if (this.json) {
			return this.formatJsonMessage(level, message);
		}

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

	private formatJsonMessage(level: LogLevel, message: string): string {
		const logObject: Record<string, unknown> = {
			level: level.toUpperCase(),
			message
		};

		if (this.timestamps) {
			logObject.timestamp = new Date().toISOString();
		}

		if (this.path) {
			logObject.file = this.path;
		}

		if (this.prefix) {
			logObject.prefix = this.prefix;
		}

		if (this.metadata && Object.keys(this.metadata).length > 0) {
			logObject.metadata = this.metadata;
		}

		return safeStringify(logObject);
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

		if (this.loggingFile && this.enableFileLogging) {
			let fileOutput = fileMessage;
			if (args.length > 0) {
				if (this.json) {
					const logObj = JSON.parse(fileMessage);
					logObj.args = args;
					fileOutput = safeStringify(logObj);
				} else {
					fileOutput =
						fileMessage +
						" " +
						args
							.map((a) =>
								typeof a === "object" ? safeStringify(a) : String(a)
							)
							.join(" ");
				}
			}
			await writeToFile(this.loggingFile, fileOutput);
		}

		// Execute onLog callback if defined (from options or config)
		if (this.onLog) {
			const details: LogDetails = {
				level,
				message,
				timestamp,
				file: this.path || undefined,
				prefix: this.prefix || undefined,
				args,
				metadata: this.metadata
			};
			await this.onLog(details);
		}

		if (this.json) {
			console.log(consoleMessage);
		} else {
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
		const inheritedPrefix = this.prefix || this.userOptions.prefix;
		const inheritedJson = this.userOptions.json;
		const inheritedColors = this.colors;
		const inheritedTimestamps = this.timestamps;
		const inheritedMetadata = this.userOptions.metadata;
		const inheritedEnableFileLogging = this.enableFileLogging;
		return new Logger(this.path ?? undefined, {
			level: options.level,
			prefix: options.prefix ?? inheritedPrefix,
			timestamps: options.timestamps ?? inheritedTimestamps,
			colors: options.colors ?? inheritedColors,
			json: options.json ?? inheritedJson,
			metadata: options.metadata ?? inheritedMetadata,
			enableFileLogging: options.enableFileLogging ?? inheritedEnableFileLogging,
			loggingFile: options.loggingFile ?? this.loggingFile ?? undefined
		});
	}
}