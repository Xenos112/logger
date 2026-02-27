export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
	json?: boolean;
	metadata?: Record<string, unknown>;
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
	/** Callback function executed on every log */
	onLog?: OnLogFunction;
}