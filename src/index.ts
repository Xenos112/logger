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

export { expressMiddleware } from "./middleware/express.js";
export type { ExpressMiddlewareOptions } from "./middleware/express.js";

export { honoMiddleware } from "./middleware/hono.js";
export type { HonoMiddlewareOptions } from "./middleware/hono.js";

export { elysiaPlugin } from "./middleware/elysia.js";
export type { ElysiaPluginOptions } from "./middleware/elysia.js";