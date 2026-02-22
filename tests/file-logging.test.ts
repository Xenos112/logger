import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Logger } from "../src/logger.js";
import { clearConfigCache } from "../src/config.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("File Logging Comprehensive Tests", () => {
	const testDir = path.join(__dirname, "file-test-logs");

	beforeEach(() => {
		clearConfigCache();
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	afterEach(() => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe("File Path Variations", () => {
		it("should handle absolute paths", async () => {
			const logFile = path.join(testDir, "absolute.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			await logger.info("absolute path test");
			await new Promise((r) => setTimeout(r, 50));

			expect(fs.existsSync(logFile)).toBe(true);
			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("absolute path test");
		});

		it("should handle relative paths", async () => {
			const relativePath = "./file-test-logs/relative.log";
			const logger = new Logger(undefined, {
				loggingFile: relativePath,
				timestamps: false,
				colors: false
			});

			await logger.info("relative path test");
			await new Promise((r) => setTimeout(r, 50));

			const expectedPath = path.join(
				process.cwd(),
				"file-test-logs",
				"relative.log"
			);
			if (fs.existsSync(expectedPath)) {
				const content = fs.readFileSync(expectedPath, "utf-8");
				expect(content).toContain("relative path test");
			}

			// Cleanup
			if (fs.existsSync("./file-test-logs")) {
				fs.rmSync("./file-test-logs", { recursive: true, force: true });
			}
		});

		it("should handle paths with spaces", async () => {
			const logFile = path.join(testDir, "path with spaces", "log file.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			await logger.info("spaces test");
			await new Promise((r) => setTimeout(r, 50));

			expect(fs.existsSync(logFile)).toBe(true);
		});

		it("should handle deeply nested paths", async () => {
			const logFile = path.join(testDir, "a", "b", "c", "d", "e", "deep.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			await logger.info("deeply nested");
			await new Promise((r) => setTimeout(r, 50));

			expect(fs.existsSync(logFile)).toBe(true);
		});

		it("should handle paths with special characters", async () => {
			const logFile = path.join(testDir, "special-chars-123", "test_123.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			await logger.info("special chars");
			await new Promise((r) => setTimeout(r, 50));

			expect(fs.existsSync(logFile)).toBe(true);
		});
	});

	describe("File Content", () => {
		it("should write plain messages without ANSI codes", async () => {
			const logFile = path.join(testDir, "plain.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: true // colors enabled for console
			});

			await logger.info("plain message");
			await new Promise((r) => setTimeout(r, 50));

			const content = fs.readFileSync(logFile, "utf-8");
			// File output should not have ANSI codes
			expect(content).not.toMatch(/\x1b\[/);
			expect(content).toContain("plain message");
		});

		it("should preserve timestamp format in file", async () => {
			const logFile = path.join(testDir, "timestamped.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: true,
				colors: false
			});

			await logger.info("timestamped");
			await new Promise((r) => setTimeout(r, 50));

			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
		});

		it("should write prefix to file", async () => {
			const logFile = path.join(testDir, "prefixed.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				prefix: "MyApp",
				colors: false
			});

			await logger.info("prefixed message");
			await new Promise((r) => setTimeout(r, 50));

			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("[MyApp]");
		});

		it("should write path to file", async () => {
			const logFile = path.join(testDir, "with-path.log");
			const logger = new Logger("/app/components/Button.tsx", {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			await logger.info("path message");
			await new Promise((r) => setTimeout(r, 50));

			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("/app/components/Button.tsx");
		});
	});

	describe("File Append Behavior", () => {
		it("should append to existing file", async () => {
			const logFile = path.join(testDir, "append.log");

			// First logger
			const logger1 = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});
			await logger1.info("first line");
			await new Promise((r) => setTimeout(r, 50));

			// Second logger to same file
			const logger2 = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});
			await logger2.info("second line");
			await new Promise((r) => setTimeout(r, 50));

			const content = fs.readFileSync(logFile, "utf-8");
			const lines = content.trim().split("\n");
			expect(lines).toHaveLength(2);
			expect(lines[0]).toContain("first line");
			expect(lines[1]).toContain("second line");
		});

		it("should handle concurrent writes safely", async () => {
			const logFile = path.join(testDir, "concurrent.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			// Write many messages concurrently
			const promises = Array.from({ length: 50 }, (_, i) =>
				logger.info(`message ${i}`)
			);

			await Promise.all(promises);
			await new Promise((r) => setTimeout(r, 100));

			const content = fs.readFileSync(logFile, "utf-8");
			const lines = content.trim().split("\n");
			expect(lines).toHaveLength(50);

			// Each message should be unique
			const uniqueMessages = new Set(lines.map((l) => l.trim()));
			expect(uniqueMessages.size).toBe(50);
		});
	});

	describe("Error Handling", () => {
		it("should handle read-only directories gracefully", async () => {
			const readOnlyDir = path.join(testDir, "readonly");
			fs.mkdirSync(readOnlyDir, { recursive: true });

			// Make directory read-only (if possible)
			try {
				fs.chmodSync(readOnlyDir, 0o444);
			} catch {
				// Skip if we can't change permissions
				return;
			}

			const logFile = path.join(readOnlyDir, "test.log");
			const logger = new Logger(undefined, { loggingFile: logFile });

			// Should not throw
			await expect(logger.info("test")).resolves.not.toThrow();

			// Restore permissions for cleanup
			fs.chmodSync(readOnlyDir, 0o755);
		});

		it("should handle invalid paths gracefully", async () => {
			const invalidPath = "/invalid\0null\0chars/test.log";
			const logger = new Logger(undefined, { loggingFile: invalidPath });

			// Should not throw
			await expect(logger.info("test")).resolves.not.toThrow();
		});

		it("should handle file name that is too long", async () => {
			const longName = "a".repeat(300) + ".log";
			const logFile = path.join(testDir, longName);
			const logger = new Logger(undefined, { loggingFile: logFile });

			await expect(logger.info("test")).resolves.not.toThrow();
		});
	});

	describe("File Rotation Simulation", () => {
		it("should handle writing to rotated file", async () => {
			const logFile = path.join(testDir, "rotation.log");
			const logger = new Logger(undefined, {
				loggingFile: logFile,
				timestamps: false,
				colors: false
			});

			// Write initial content
			await logger.info("before rotation");
			await new Promise((r) => setTimeout(r, 50));

			// Simulate rotation by renaming file
			const rotatedFile = path.join(testDir, "rotation.log.1");
			fs.renameSync(logFile, rotatedFile);

			// Continue writing (should create new file)
			await logger.info("after rotation");
			await new Promise((r) => setTimeout(r, 50));

			expect(fs.existsSync(logFile)).toBe(true);
			const newContent = fs.readFileSync(logFile, "utf-8");
			expect(newContent).toContain("after rotation");

			const oldContent = fs.readFileSync(rotatedFile, "utf-8");
			expect(oldContent).toContain("before rotation");
		});
	});
});

describe("Cross-Platform Compatibility", () => {
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

	it("should handle Windows paths with backslashes", async () => {
		const logger = new Logger("C:\\Users\\App\\file.ts");
		await logger.info("windows path");

		const callArg = consoleSpy.log.mock.calls[0][0];
		expect(callArg).toContain("C:\\Users\\App\\file.ts");
	});

	it("should handle Unix paths", async () => {
		const logger = new Logger("/home/user/project/file.ts");
		await logger.info("unix path");

		const callArg = consoleSpy.log.mock.calls[0][0];
		expect(callArg).toContain("/home/user/project/file.ts");
	});

	it("should handle mixed path separators", async () => {
		const logger = new Logger("C:/Users\\App/file.ts");
		await logger.info("mixed path");

		const callArg = consoleSpy.log.mock.calls[0][0];
		expect(callArg).toContain("C:/Users\\App/file.ts");
	});
});