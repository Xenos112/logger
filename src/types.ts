export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
	level?: LogLevel;
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
}

export interface LogDetails {
	level: LogLevel;
	message: string;
	timestamp: Date;
	file?: string;
	prefix?: string;
	args: unknown[];
}

export type OnLogFunction = (details: LogDetails) => void | Promise<void>;

export interface LoggerConfig {
	/** File path where logs should be saved (Node.js only) */
	loggingFile?: string;
	/** Show timestamps */
	timestamps?: boolean;
	/** Use colors in console output */
	colors?: boolean;
	/** Callback function executed on every log */
	onLog?: OnLogFunction;
}