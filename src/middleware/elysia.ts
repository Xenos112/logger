import { Logger } from "../logger.js";
import { HTTP_METHOD_COLORS, RESET } from "../colors.js";

export interface ElysiaPluginOptions {
	logger?: Logger;
	prefix?: string;
}

export function elysiaPlugin(options: ElysiaPluginOptions = {}) {
	const { logger: customLogger, prefix = "Elysia" } = options;

	const logger =
		customLogger ||
		new Logger(undefined, {
			prefix,
			timestamps: true,
			colors: true
		});

	return {
		name: "logx/elysia",
		mapResponse({ request, path, response }: any) {
			const start = Date.now();

			const duration = Date.now() - start;
			const method = request.method;
			const status = (response as Response)?.status || 200;

			const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

			const color = HTTP_METHOD_COLORS[method] || "\x1b[37m";
			const coloredMethod = `${color}${method}${RESET}`;

			logger[level](`${coloredMethod} ${path} ${duration}ms`);
		}
	};
}
