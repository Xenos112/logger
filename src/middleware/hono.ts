import type { Context, Next } from "hono";
import { Logger } from "../logger.js";
import { HTTP_METHOD_COLORS, RESET } from "../colors.js";

export interface HonoMiddlewareOptions {
	logger?: Logger;
	prefix?: string;
}

export function honoMiddleware(options: HonoMiddlewareOptions = {}) {
	const { logger: customLogger, prefix = "Hono" } = options;

	const logger =
		customLogger ||
		new Logger(undefined, {
			prefix,
			timestamps: true,
			colors: true
		});

	return async (c: Context, next: Next) => {
		const start = Date.now();

		await next();

		const duration = Date.now() - start;
		const method = c.req.method;
		const path = c.req.path;
		const status = c.res.status;

		const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

		const color = HTTP_METHOD_COLORS[method] || "\x1b[37m";
		const coloredMethod = `${color}${method}${RESET}`;

		await logger[level](`${coloredMethod} ${path} ${duration}ms`);
	};
}
