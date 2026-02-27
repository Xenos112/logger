export type LogLevel = "debug" | "info" | "warn" | "error";

export type LowercaseLogLevel = Lowercase<LogLevel>;

export type RotationStrategy = "size" | "date" | "daily" | "hourly";

export interface LogRotationConfig {
	/** Maximum file size in bytes before rotation (e.g., 10 * 1024 * 1024 for 10MB) */
	maxSize?: number;
	/** Number of backup files to keep */
	maxFiles?: number;
	/** Rotate daily at midnight */
	daily?: boolean;
	/** Rotate hourly */
	hourly?: boolean;
	/** Compress rotated files */
	compress?: boolean;
	/** Custom date format for rotated file names */
	dateFormat?: string;
}

export interface LoggerOptions<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
	level?: LogLevel;
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
	enableFileLogging?: boolean;
	json?: boolean;
	metadata?: TMetadata;
	onLog?: OnLogFunction<TMetadata>;
	rotation?: LogRotationConfig;
}

export interface LogDetails<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
	level: LogLevel;
	message: string;
	timestamp: Date;
	file?: string;
	prefix?: string;
	args: unknown[];
	metadata?: TMetadata;
}

export type OnLogFunction<TMetadata extends Record<string, unknown> = Record<string, unknown>> = (details: LogDetails<TMetadata>) => void | Promise<void>;

export interface LoggerConfig<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
	/** File path where logs should be saved (Node.js only) */
	loggingFile?: string;
	/** Show timestamps */
	timestamps?: boolean;
	/** Use colors in console output */
	colors?: boolean;
	/** Output logs in JSON format */
	json?: boolean;
	/** Metadata key-value pairs included in every log */
	metadata?: TMetadata;
	/** Callback function executed on every log */
	onLog?: OnLogFunction<TMetadata>;
	/** Log rotation configuration */
	rotation?: LogRotationConfig;
}

export type LogMessageTemplate<T extends string> = T;

export type ExtractLogPrefix<T extends string> = T extends `${infer P}:${string}` ? P : never;

export type ExtractLogMessage<T extends string> = T extends `${string}:${infer M}` ? M : T;

export interface LoggerConstructorOptions<TMetadata extends Record<string, unknown> = Record<string, unknown>> {
	level?: LogLevel;
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
	enableFileLogging?: boolean;
	json?: boolean;
	metadata?: TMetadata;
	onLog?: OnLogFunction<TMetadata>;
	rotation?: LogRotationConfig;
}