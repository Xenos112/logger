export { Logger } from "./logger.js";

export type {
	LogLevel,
	LowercaseLogLevel,
	LoggerOptions,
	LoggerConfig,
	LoggerConstructorOptions,
	LogDetails,
	OnLogFunction,
	LogMessageTemplate,
	ExtractLogPrefix,
	ExtractLogMessage
} from "./types";

export {
	loadLoggerConfig,
	clearConfigCache,
	defineConfig,
	isNode,
	isDev
} from "./config.js";