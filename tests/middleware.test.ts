import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Logger } from "../src/logger.js";
import { clearConfigCache } from "../src/config.js";

describe("Middleware", () => {
	let _consoleSpy: any;

	beforeEach(() => {
		clearConfigCache();
		_consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {})
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Express Middleware", () => {
		it("should export expressMiddleware function", async () => {
			const { expressMiddleware } = await import("../src/middleware/express.js");
			expect(expressMiddleware).toBeDefined();
			expect(typeof expressMiddleware).toBe("function");
		});

		it("should create middleware with custom logger", async () => {
			const { expressMiddleware } = await import("../src/middleware/express.js");
			const logger = new Logger(undefined, {
				prefix: "Test",
				colors: false,
				timestamps: false
			});

			const middleware = expressMiddleware({ logger });
			expect(middleware).toBeDefined();
		});

		it("should create middleware with custom prefix", async () => {
			const { expressMiddleware } = await import("../src/middleware/express.js");

			const middleware = expressMiddleware({ prefix: "API" });
			expect(middleware).toBeDefined();
		});

		it("should create middleware with default options", async () => {
			const { expressMiddleware } = await import("../src/middleware/express.js");

			const middleware = expressMiddleware();
			expect(middleware).toBeDefined();
		});
	});

	describe("Hono Middleware", () => {
		it("should export honoMiddleware function", async () => {
			const { honoMiddleware } = await import("../src/middleware/hono.js");
			expect(honoMiddleware).toBeDefined();
			expect(typeof honoMiddleware).toBe("function");
		});

		it("should create middleware with custom logger", async () => {
			const { honoMiddleware } = await import("../src/middleware/hono.js");
			const logger = new Logger(undefined, {
				prefix: "Test",
				colors: false,
				timestamps: false
			});

			const middleware = honoMiddleware({ logger });
			expect(middleware).toBeDefined();
		});

		it("should create middleware with custom prefix", async () => {
			const { honoMiddleware } = await import("../src/middleware/hono.js");

			const middleware = honoMiddleware({ prefix: "API" });
			expect(middleware).toBeDefined();
		});

		it("should create middleware with default options", async () => {
			const { honoMiddleware } = await import("../src/middleware/hono.js");

			const middleware = honoMiddleware();
			expect(middleware).toBeDefined();
		});
	});

	describe("Elysia Plugin", () => {
		it("should export elysiaPlugin function", async () => {
			const { elysiaPlugin } = await import("../src/middleware/elysia.js");
			expect(elysiaPlugin).toBeDefined();
			expect(typeof elysiaPlugin).toBe("function");
		});

		it("should create plugin with custom logger", async () => {
			const { elysiaPlugin } = await import("../src/middleware/elysia.js");
			const logger = new Logger(undefined, {
				prefix: "Test",
				colors: false,
				timestamps: false
			});

			const plugin = elysiaPlugin({ logger });
			expect(plugin).toBeDefined();
		});

		it("should create plugin with custom prefix", async () => {
			const { elysiaPlugin } = await import("../src/middleware/elysia.js");

			const plugin = elysiaPlugin({ prefix: "API" });
			expect(plugin).toBeDefined();
		});

		it("should create plugin with default options", async () => {
			const { elysiaPlugin } = await import("../src/middleware/elysia.js");

			const plugin = elysiaPlugin();
			expect(plugin).toBeDefined();
		});

		it("should have name property", async () => {
			const { elysiaPlugin } = await import("../src/middleware/elysia.js");

			const plugin = elysiaPlugin();
			expect(plugin.name).toBe("logx/elysia");
		});
	});

	describe("Middleware Exports", () => {
		it("should export all middleware from index", async () => {
			const { expressMiddleware, honoMiddleware, elysiaPlugin } = await import("../src/index.js");
			expect(expressMiddleware).toBeDefined();
			expect(honoMiddleware).toBeDefined();
			expect(elysiaPlugin).toBeDefined();
		});
	});
});
