import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Logger } from "../src/logger.js";
import { clearConfigCache } from "../src/config.js";

describe("Logger - Unit Tests", () => {
	let consoleSpy: any;

	beforeEach(() => {
		clearConfigCache();
		consoleSpy = {
			log: vi.spyOn(console, "log").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {}),
			info: vi.spyOn(console, "info").mockImplementation(() => {})
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Constructor", () => {
		it("should create logger with default options", () => {
			const logger = new Logger();
			expect(logger).toBeDefined();
		});

		it("should create logger with path", () => {
			const logger = new Logger("/test/path.ts");
			expect(logger).toBeDefined();
		});

		it("should create logger with path and options", () => {
			const logger = new Logger("/test/path.ts", {
				level: "debug",
				prefix: "Test"
			});
			expect(logger).toBeDefined();
		});

		it("should create logger with only options (no path)", () => {
			const logger = new Logger(undefined, { level: "warn" });
			expect(logger).toBeDefined();
		});

		it("should create logger with empty options", () => {
			const logger = new Logger(undefined, {});
			expect(logger).toBeDefined();
		});
	});

	describe("Log Levels", () => {
		it("should log debug message when level is debug", async () => {
			const logger = new Logger(undefined, { level: "debug" });
			await logger.debug("debug message");
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it("should not log debug when level is info", async () => {
			const logger = new Logger(undefined, { level: "info" });
			await logger.debug("debug message");
			expect(consoleSpy.log).not.toHaveBeenCalled();
		});

		it("should log info message when level is info", async () => {
			const logger = new Logger(undefined, { level: "info" });
			await logger.info("info message");
			expect(consoleSpy.log).toHaveBeenCalled();
		});

		it("should not log info when level is warn", async () => {
			const logger = new Logger(undefined, { level: "warn" });
			await logger.info("info message");
			expect(consoleSpy.log).not.toHaveBeenCalled();
		});

		it("should log warn message when level is warn", async () => {
			const logger = new Logger(undefined, { level: "warn" });
			await logger.warn("warn message");
			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it("should not log warn when level is error", async () => {
			const logger = new Logger(undefined, { level: "error" });
			await logger.warn("warn message");
			expect(consoleSpy.warn).not.toHaveBeenCalled();
		});

		it("should log error message when level is error", async () => {
			const logger = new Logger(undefined, { level: "error" });
			await logger.error("error message");
			expect(consoleSpy.error).toHaveBeenCalled();
		});

		it("should log all levels when level is debug", async () => {
			const logger = new Logger(undefined, { level: "debug" });
			await logger.debug("debug");
			await logger.info("info");
			await logger.warn("warn");
			await logger.error("error");

			expect(consoleSpy.log).toHaveBeenCalledTimes(2); // debug and info
			expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
			expect(consoleSpy.error).toHaveBeenCalledTimes(1);
		});
	});

	describe("Prefix", () => {
		it("should include prefix in log output", async () => {
			const logger = new Logger(undefined, { prefix: "MyApp" });
			await logger.info("test message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toContain("[MyApp]");
		});

		it("should not include prefix when not set", async () => {
			const logger = new Logger();
			await logger.info("test message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).not.toContain("[undefined]");
		});

		it("should include empty prefix when prefix is empty string", async () => {
			const logger = new Logger(undefined, { prefix: "" });
			await logger.info("test message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			// Empty prefix should not add brackets
			expect(callArg).not.toContain("[]");
		});
	});

	describe("Timestamps", () => {
		it("should include timestamp when timestamps is true", async () => {
			const logger = new Logger(undefined, { timestamps: true });
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toMatch(/\[\d{4}-\d{2}-\d{2}T/); // ISO timestamp format
		});

		it("should not include timestamp when timestamps is false", async () => {
			const logger = new Logger(undefined, { timestamps: false });
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe("Colors", () => {
		it("should include ANSI codes when colors is true", async () => {
			const logger = new Logger(undefined, { colors: true });
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			// ANSI codes start with \x1b[
			expect(callArg).toMatch(/\x1b\[/);
		});

		it("should not include ANSI codes when colors is false", async () => {
			const logger = new Logger(undefined, { colors: false });
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).not.toMatch(/\x1b\[/);
		});
	});

	describe("Path", () => {
		it("should include path in output when path is provided", async () => {
			const logger = new Logger("/test/file.ts");
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toContain("/test/file.ts");
		});

		it("should not include path when path is not provided", async () => {
			const logger = new Logger();
			await logger.info("test");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).not.toContain("undefined");
		});
	});

	describe("Additional Arguments", () => {
		it("should log with additional arguments", async () => {
			const logger = new Logger();
			await logger.info("message", { key: "value" }, 123);

			expect(consoleSpy.log).toHaveBeenCalledWith(
				expect.any(String),
				{ key: "value" },
				123
			);
		});

		it("should handle multiple object arguments", async () => {
			const logger = new Logger(undefined, { level: "debug" });
			const obj1 = { a: 1 };
			const obj2 = { b: 2 };

			await logger.debug("objects", obj1, obj2);

			// The call should have: [message, obj1, obj2]
			const call = consoleSpy.log.mock.calls[0];
			expect(call[1]).toEqual(obj1);
			expect(call[2]).toEqual(obj2);
		});
	});

	describe("Child Logger", () => {
		it("should create child logger with same options", () => {
			const parent = new Logger("/parent.ts", {
				level: "debug",
				prefix: "Parent",
				timestamps: true,
				colors: false,
				loggingFile: "/test.log"
			});

			const child = parent.child({});
			expect(child).toBeDefined();
		});

		it("should inherit parent prefix when not specified", async () => {
			const parent = new Logger(undefined, { prefix: "Parent" });
			const child = parent.child({});

			await child.info("child message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toContain("[Parent]");
		});

		it("should override parent prefix when specified", async () => {
			const parent = new Logger(undefined, { prefix: "Parent" });
			const child = parent.child({ prefix: "Child" });

			await child.info("child message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toContain("[Child]");
			expect(callArg).not.toContain("[Parent]");
		});

		it("should inherit parent path", async () => {
			const parent = new Logger("/parent/path.ts");
			const child = parent.child({});

			await child.info("child message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toContain("/parent/path.ts");
		});

		it("should allow child to have different level", async () => {
			const parent = new Logger(undefined, { level: "error" });
			const child = parent.child({ level: "debug" });

			await child.debug("debug from child");
			expect(consoleSpy.log).toHaveBeenCalled();
		});
	});

	describe("Format Output", () => {
		it("should format message with all components", async () => {
			const logger = new Logger("/test.ts", {
				prefix: "App",
				timestamps: true,
				colors: false
			});

			await logger.info("test message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			// Format: [timestamp] [LEVEL] [path] [prefix] message
			expect(callArg).toMatch(
				/\[\d{4}-\d{2}-\d{2}T.+\] \[INFO\] \[\/test\.ts\] \[App\] test message/
			);
		});

		it("should format with only level when no optional components", async () => {
			const logger = new Logger(undefined, {
				timestamps: false,
				colors: false
			});

			await logger.info("simple message");

			const callArg = consoleSpy.log.mock.calls[0][0];
			expect(callArg).toBe("[INFO] simple message");
		});
	});
});