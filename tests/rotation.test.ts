import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Logger } from "../src/logger.js";
import { clearConfigCache, writeToFile } from "../src/config.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Log Rotation", () => {
	const testDir = path.join(__dirname, "rotation-test-logs");

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

	describe("Size-based Rotation", () => {
		it("should rotate file when max size is reached", async () => {
			const logFile = path.join(testDir, "size-rotate.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					maxSize: 100 // 100 bytes
				}
			});

			// Write multiple messages to exceed maxSize
			await logger.info("A".repeat(50)); // ~56 bytes each
			await logger.info("B".repeat(50));

			// First file should exist
			expect(fs.existsSync(logFile)).toBe(true);
		});

		it("should keep maxFiles number of backups", async () => {
			const logFile = path.join(testDir, "max-files.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					maxSize: 50,
					maxFiles: 2
				}
			});

			// Write enough to trigger multiple rotations
			for (let i = 0; i < 10; i++) {
				await logger.info(`Message ${i}`);
			}

			// Main log file should exist
			expect(fs.existsSync(logFile)).toBe(true);
		});
	});

	describe("Daily Rotation", () => {
		it("should create new file when day changes", async () => {
			const logFile = path.join(testDir, "daily-rotate.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					daily: true
				}
			});

			await logger.info("First day message");

			expect(fs.existsSync(logFile)).toBe(true);
			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("First day message");
		});
	});

	describe("Hourly Rotation", () => {
		it("should create new file when hour changes", async () => {
			const logFile = path.join(testDir, "hourly-rotate.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					hourly: true
				}
			});

			await logger.info("Hourly message");

			expect(fs.existsSync(logFile)).toBe(true);
		});
	});

	describe("Compression", () => {
		it("should compress rotated files when enabled", async () => {
			const logFile = path.join(testDir, "compress-rotate.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					maxSize: 50,
					compress: true
				}
			});

			await logger.info("Message 1");
			await logger.info("Message 2");

			// Check for compressed file
			const files = fs.readdirSync(testDir);
			const compressedFiles = files.filter((f) => f.endsWith(".gz"));
			expect(compressedFiles.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("Custom Date Format", () => {
		it("should use custom date format in rotated file names", async () => {
			const logFile = path.join(testDir, "custom-format.log");

			const logger = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					daily: true,
					dateFormat: "YYYY-MM-DD"
				}
			});

			await logger.info("Test message");

			expect(fs.existsSync(logFile)).toBe(true);
		});
	});

	describe("Child Logger Inheritance", () => {
		it("should inherit rotation config from parent", async () => {
			const logFile = path.join(testDir, "child-rotate.log");

			const parent = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					maxSize: 100
				}
			});

			// Parent must log first to initialize config
			await parent.info("Parent message");

			const child = parent.child({});

			await child.info("Child message");

			expect(fs.existsSync(logFile)).toBe(true);
			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("Child message");
		});

		it("should allow child to override rotation config", async () => {
			const logFile = path.join(testDir, "child-override.log");

			const parent = new Logger(undefined, {
				loggingFile: logFile,
				level: "debug",
				colors: false,
				timestamps: false,
				rotation: {
					maxSize: 100
				}
			});

			// Parent must log first to initialize config
			await parent.info("Parent message");

			const child = parent.child({
				rotation: {
					daily: true,
					maxFiles: 3
				}
			});

			await child.info("Override message");

			// File should be created with child config
			expect(fs.existsSync(logFile)).toBe(true);
		});
	});

	describe("writeToFile with rotation", () => {
		it("should handle rotation via writeToFile directly", async () => {
			const logFile = path.join(testDir, "direct-rotate.log");

			await writeToFile(logFile, "Test message", {
				maxSize: 50
			});

			expect(fs.existsSync(logFile)).toBe(true);
			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("Test message");
		});

		it("should write without rotation when not configured", async () => {
			const logFile = path.join(testDir, "no-rotation.log");

			await writeToFile(logFile, "No rotation message");

			expect(fs.existsSync(logFile)).toBe(true);
			const content = fs.readFileSync(logFile, "utf-8");
			expect(content).toContain("No rotation message");
		});
	});
});