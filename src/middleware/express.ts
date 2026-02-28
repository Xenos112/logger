import type { Request, Response, NextFunction } from "express";
import { Logger } from "../logger.js";
import { HTTP_METHOD_COLORS, RESET } from "../colors.js";

export interface ExpressMiddlewareOptions {
	logger?: Logger;
	prefix?: string;
}

export function expressMiddleware(options: ExpressMiddlewareOptions = {}) {
	const { logger: customLogger, prefix = "Express" } = options;

	const logger =
		customLogger ||
		new Logger(undefined, {
			prefix,
			timestamps: true,
			colors: true
		});

	return async (req: Request, res: Response, next: NextFunction) => {
		const start = Date.now();

		res.on("finish", async () => {
			const duration = Date.now() - start;
			const method = req.method;
			const path = req.path;
			const status = res.statusCode;

			const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

			const color = HTTP_METHOD_COLORS[method] || "\x1b[37m";
			const coloredMethod = `${color}${method}${RESET}`;

			await logger[level](`${coloredMethod} ${path} ${duration}ms`);
		});

		next();
	};
}
