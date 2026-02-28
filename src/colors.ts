export const LOG_LEVEL_COLORS: Record<string, string> = {
	debug: "\x1b[36m",
	info: "\x1b[32m",
	warn: "\x1b[33m",
	error: "\x1b[31m"
};

export const HTTP_METHOD_COLORS: Record<string, string> = {
	GET: "\x1b[34m",
	POST: "\x1b[35m",
	PUT: "\x1b[33m",
	DELETE: "\x1b[31m",
	PATCH: "\x1b[36m",
	OPTIONS: "\x1b[32m",
	HEAD: "\x1b[90m"
};

export const RESET = "\x1b[0m";
