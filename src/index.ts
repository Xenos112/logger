export { Logger } from "./logger.js";

export type {
	LogLevel,
	LoggerOptions,
	LoggerConfig,
	LogDetails,
	OnLogFunction
} from "./types";

export {
	loadLoggerConfig,
	clearConfigCache,
	defineConfig,
	isNode,
	isDev
} from "./config.js";