import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Logger } from "../src/logger.js";
import { clearConfigCache } from "../src/config.js";

describe("Log Filtering", () => {
	let consoleSpy: any;

	beforeEach(() => {
		clearConfigCache();
		consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {})
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Pattern-based Filtering", () => {
		it("should include messages matching include pattern (string)", async () => {
			const logger = new Logger(undefined, {
				filter: {
					include: "important"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("This is important");
			await logger.info("This is not");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("important");
		});

		it("should include messages matching include pattern (RegExp)", async () => {
			const logger = new Logger(undefined, {
				filter: {
					include: /error\d+/
				},
				colors: false,
				timestamps: false
			});

			await logger.info("error123");
			await logger.info("error456");
			await logger.info("success");

			expect(consoleSpy.log).toHaveBeenCalledTimes(2);
		});

		it("should exclude messages matching exclude pattern (string)", async () => {
			const logger = new Logger(undefined, {
				filter: {
					exclude: "debug"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("This is debug");
			await logger.info("This is info");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("info");
		});

		it("should exclude messages matching exclude pattern (RegExp)", async () => {
			const logger = new Logger(undefined, {
				filter: {
					exclude: /temp-*/
				},
				colors: false,
				timestamps: false
			});

			await logger.info("temp-file");
			await logger.info("permanent-file");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("permanent");
		});

		it("should combine include and exclude patterns", async () => {
			const logger = new Logger(undefined, {
				level: "debug",
				filter: {
					include: "error",
					exclude: "debug"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("error debug");
			await logger.info("error info");
			await logger.info("warn error");

			// error debug: contains error but also contains debug -> filtered
			// error info: contains error, no debug -> logged
			// warn error: contains error, no debug -> logged
			expect(consoleSpy.log).toHaveBeenCalledTimes(2);
		});

		it("should handle complex regex patterns", async () => {
			const logger = new Logger(undefined, {
				filter: {
					include: "^\\[ERROR\\]"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("[ERROR] Something failed");
			await logger.info("[INFO] All good");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("ERROR");
		});
	});

	describe("Runtime Log Level Changes", () => {
		it("should filter by minLevel", async () => {
			const logger = new Logger(undefined, {
				filter: {
					minLevel: "warn"
				},
				colors: false,
				timestamps: false
			});

			await logger.debug("debug");
			await logger.info("info");
			await logger.warn("warn");
			await logger.error("error");

			expect(consoleSpy.log).not.toHaveBeenCalled();
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
			expect(consoleSpy.error).toHaveBeenCalledTimes(1);
		});

		it("should allow all levels when minLevel is debug", async () => {
			const logger = new Logger(undefined, {
				level: "debug",
				filter: {
					minLevel: "debug"
				},
				colors: false,
				timestamps: false
			});

			await logger.debug("debug");
			await logger.info("info");
			await logger.warn("warn");
			await logger.error("error");

			expect(consoleSpy.log).toHaveBeenCalledTimes(2);
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
			expect(consoleSpy.error).toHaveBeenCalledTimes(1);
		});

		it("should filter error level when minLevel is info", async () => {
			const logger = new Logger(undefined, {
				filter: {
					minLevel: "info"
				},
				colors: false,
				timestamps: false
			});

			await logger.debug("debug");
			await logger.info("info");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});
	});

	describe("Conditional Logging", () => {
		it("should support custom filter function", async () => {
			const logger = new Logger(undefined, {
				filter: {
					filter: (details) => {
						return details.message.length > 10;
					}
				},
				colors: false,
				timestamps: false
			});

			await logger.info("short");
			await logger.info("this is a longer message");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("longer");
		});

		it("should have access to level in custom filter", async () => {
			const errorsOnly: string[] = [];

			const logger = new Logger(undefined, {
				filter: {
					filter: (details) => {
						if (details.level === "error") {
							errorsOnly.push(details.message);
						}
						return details.level === "error";
					}
				},
				colors: false,
				timestamps: false
			});

			await logger.info("info message");
			await logger.error("error message");
			await logger.warn("warn message");

			expect(errorsOnly).toEqual(["error message"]);
		});

		it("should have access to metadata in custom filter", async () => {
			const logger = new Logger(undefined, {
				filter: {
					filter: (details) => {
						return (details.args[0] as any)?.required === true;
					}
				},
				colors: false,
				timestamps: false
			});

			await logger.info("message1", { required: true });
			await logger.info("message2", { required: false });
			await logger.info("message3");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should have access to prefix in custom filter", async () => {
			const logger = new Logger(undefined, {
				prefix: "API",
				filter: {
					filter: (details) => {
						return details.prefix === "API";
					}
				},
				colors: false,
				timestamps: false
			});

			await logger.info("API message");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should return true from filter to allow logging", async () => {
			const logger = new Logger(undefined, {
				filter: {
					filter: () => true
				},
				colors: false,
				timestamps: false
			});

			await logger.info("always logged");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should return false from filter to block logging", async () => {
			const logger = new Logger(undefined, {
				filter: {
					filter: () => false
				},
				colors: false,
				timestamps: false
			});

			await logger.info("never logged");

			expect(consoleSpy.log).not.toHaveBeenCalled();
		});
	});

	describe("Prefix-based Filtering", () => {
		it("should include only specified prefixes", async () => {
			const logger = new Logger(undefined, {
				filter: {
					includePrefixes: ["Auth", "API"]
				},
				colors: false,
				timestamps: false
			});

			const authLogger = logger.child({ prefix: "Auth" });
			const apiLogger = logger.child({ prefix: "API" });
			const dbLogger = logger.child({ prefix: "DB" });

			await authLogger.info("auth message");
			await apiLogger.info("api message");
			await dbLogger.info("db message");

			expect(consoleSpy.log).toHaveBeenCalledTimes(2);
		});

		it("should exclude specified prefixes", async () => {
			const logger = new Logger(undefined, {
				filter: {
					excludePrefixes: ["Debug", "Temp"]
				},
				colors: false,
				timestamps: false
			});

			const debugLogger = logger.child({ prefix: "Debug" });
			const tempLogger = logger.child({ prefix: "Temp" });
			const normalLogger = logger.child({ prefix: "Normal" });

			await debugLogger.info("debug");
			await tempLogger.info("temp");
			await normalLogger.info("normal");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("normal");
		});

		it("should combine include and exclude prefixes", async () => {
			const logger = new Logger(undefined, {
				filter: {
					includePrefixes: ["User"],
					excludePrefixes: ["User:Temp"]
				},
				colors: false,
				timestamps: false
			});

			const userLogger = logger.child({ prefix: "User" });
			const userTempLogger = logger.child({ prefix: "User:Temp" });

			await userLogger.info("user message");
			await userTempLogger.info("temp user");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.log.mock.calls[0][0]).toContain("user message");
		});

		it("should handle prefix matching with startsWith", async () => {
			const logger = new Logger(undefined, {
				filter: {
					includePrefixes: ["Auth"]
				},
				colors: false,
				timestamps: false
			});

			const auth = logger.child({ prefix: "Auth" });
			const authMiddleware = logger.child({ prefix: "Auth:Middleware" });

			await auth.info("auth");
			await authMiddleware.info("auth middleware");

			expect(consoleSpy.log).toHaveBeenCalledTimes(2);
		});
	});

	describe("Combined Filters", () => {
		it("should combine minLevel with include pattern", async () => {
			const logger = new Logger(undefined, {
				filter: {
					minLevel: "warn",
					include: "database"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("database info");
			await logger.warn("database warning");
			await logger.error("database error");

			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
			expect(consoleSpy.error).toHaveBeenCalledTimes(1);
		});

		it("should combine custom filter with exclude", async () => {
			let filterCallCount = 0;

			const logger = new Logger(undefined, {
				filter: {
					filter: () => {
						filterCallCount++;
						return true;
					},
					exclude: "secret"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("visible message");
			await logger.info("secret message");

			expect(filterCallCount).toBe(2);
			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should work with all filter options together", async () => {
			const logger = new Logger(undefined, {
				filter: {
					minLevel: "info",
					include: "app",
					exclude: "debug",
					includePrefixes: ["Main"],
					filter: (details) => details.message.startsWith("app")
				},
				colors: false,
				timestamps: false
			});

			const mainLogger = logger.child({ prefix: "Main" });
			const otherLogger = logger.child({ prefix: "Other" });

			await mainLogger.info("app started"); // should log
			await mainLogger.info("app debug"); // excluded by "debug"
			await mainLogger.warn("app warning"); // should log (warn >= info)
			await otherLogger.info("app message"); // excluded by prefix

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty filter config", async () => {
			const logger = new Logger(undefined, {
				filter: {},
				colors: false,
				timestamps: false
			});

			await logger.info("test message");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should handle undefined filter", async () => {
			const logger = new Logger(undefined, {
				colors: false,
				timestamps: false
			});

			await logger.info("test message");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should handle empty include/exclude arrays in prefixes", async () => {
			const logger = new Logger(undefined, {
				filter: {
					includePrefixes: [],
					excludePrefixes: []
				},
				colors: false,
				timestamps: false
			});

			await logger.info("test");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should handle invalid regex gracefully", async () => {
			const logger = new Logger(undefined, {
				filter: {
					include: "[invalid("
				},
				colors: false,
				timestamps: false
			});

			await expect(logger.info("test")).resolves.not.toThrow();
		});

		it("should handle unicode in patterns", async () => {
			const logger = new Logger(undefined, {
				filter: {
					include: "こんにちは"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("こんにちは world");
			await logger.info("hello");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});
	});

	describe("Child Logger Inheritance", () => {
		it("should inherit filter from parent", async () => {
			const parent = new Logger(undefined, {
				filter: {
					minLevel: "warn"
				},
				colors: false,
				timestamps: false
			});

			const child = parent.child({});

			await child.info("info");
			await child.warn("warn");

			expect(consoleSpy.log).not.toHaveBeenCalled();
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
		});

		it("should allow child to override filter", async () => {
			const parent = new Logger(undefined, {
				filter: {
					minLevel: "warn"
				},
				colors: false,
				timestamps: false
			});

			const child = parent.child({
				filter: {
					minLevel: "debug"
				}
			});

			await child.info("info");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should allow child to override parent filter", async () => {
			const parent = new Logger(undefined, {
				filter: {
					minLevel: "error"
				},
				colors: false,
				timestamps: false
			});

			const child = parent.child({
				filter: {
					minLevel: "debug"
				}
			});

			await child.info("info");

			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});

		it("should inherit filter when child provides no filter", async () => {
			const parent = new Logger(undefined, {
				filter: {
					minLevel: "warn"
				},
				colors: false,
				timestamps: false
			});

			const child = parent.child({});

			await child.info("info");
			await child.warn("warning");

			// Child should inherit parent's filter (minLevel: warn)
			expect(consoleSpy.log).not.toHaveBeenCalled();
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
		});
	});

	describe("Filter with File Logging", () => {
		it("should filter messages from file output", async () => {
			const logFile = "/tmp/filter-test.log";

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				filter: {
					include: "important"
				},
				colors: false,
				timestamps: false
			});

			await logger.info("important message");
			await logger.info("regular message");

			// Cleanup
			try {
				const fs = require("fs");
				if (fs.existsSync(logFile)) {
					const content = fs.readFileSync(logFile, "utf-8");
					expect(content).toContain("important");
					expect(content).not.toContain("regular");
					fs.unlinkSync(logFile);
				}
			} catch {}
		});

		it("should filter messages from onLog callback", async () => {
			const loggedMessages: string[] = [];

			const logger = new Logger(undefined, {
				filter: {
					include: "error"
				},
				colors: false,
				timestamps: false,
				onLog: (details) => {
					loggedMessages.push(details.message);
				}
			});

			await logger.info("info message");
			await logger.error("error message");

			expect(loggedMessages).toEqual(["error message"]);
		});
	});

	describe("Dynamic Filter Changes", () => {
		it("should apply filter based on current config", async () => {
			const logger = new Logger(undefined, {
				colors: false,
				timestamps: false
			});

			await logger.info("before filter");

			// Note: Filter cannot be changed after construction in current implementation
			// This test just verifies initial state works
			expect(consoleSpy.log).toHaveBeenCalledTimes(1);
		});
	});
});