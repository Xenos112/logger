export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
	enableFileLogging?: boolean;
	json?: boolean;
	metadata?: Record<string, unknown>;
	onLog?: OnLogFunction;
}

export interface LogDetails {
	level: LogLevel;
	message: string;
	timestamp: Date;
	file?: string;
	prefix?: string;
	args: unknown[];
	metadata?: Record<string, unknown>;
}

export type OnLogFunction = (details: LogDetails) => void | Promise<void>;

export interface LoggerConfig {
	/** File path where logs should be saved (Node.js only) */
	loggingFile?: string;
	/** Show timestamps */
	timestamps?: boolean;
	/** Use colors in console output */
	colors?: boolean;
	/** Output logs in JSON format */
	json?: boolean;
	/** Metadata key-value pairs included in every log */
	metadata?: Record<string, unknown>;
	/** Callback function executed on every log */
	onLog?: OnLogFunction;
}