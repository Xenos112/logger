import { defineConfig, loadLoggerConfig, clearConfigCache, isNode, isDev, writeToFile } from '../src/config.js';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Environment Detection', () => {
  describe('isNode', () => {
    it('should detect Node.js environment', () => {
      expect(isNode).toBe(true);
    });

    it('should be true when process.versions.node exists', () => {
      expect(typeof process.versions.node).toBe('string');
      expect(isNode).toBe(true);
    });
  });

  describe('isDev', () => {
    it('should reflect current environment dev/prod status', () => {
      // isDev is determined at module load time based on NODE_ENV
      // In test environment, it should be true (test !== production)
      expect(isDev).toBe(true);
    });

    it('should be true when NODE_ENV is test', () => {
      // Current test environment has NODE_ENV=test
      expect(process.env.NODE_ENV).toBe('test');
      expect(isDev).toBe(true);
    });
  });
});

describe('defineConfig', () => {
  it('should return the same config object', () => {
    const config = {
      timestamps: true,
      colors: false,
      loggingFile: './test.log',
      onLog: (details: any) => console.log(details),
    };
    
    const result = defineConfig(config);
    expect(result).toBe(config);
  });

  it('should work with partial config', () => {
    const config = { timestamps: true };
    const result = defineConfig(config);
    expect(result).toEqual({ timestamps: true });
  });

  it('should work with empty config', () => {
    const config = {};
    const result = defineConfig(config);
    expect(result).toEqual({});
  });

  it('should preserve type information for onLog callback', () => {
    const config = defineConfig({
      onLog: (details) => {
        expect(details.level).toBeDefined();
        expect(details.message).toBeDefined();
        expect(details.timestamp).toBeDefined();
        expect(details.prefix).toBeDefined();
        expect(details.args).toBeDefined();
      },
    });
    
    expect(config.onLog).toBeDefined();
  });
});

describe('Config Loading', () => {
  beforeEach(() => {
    clearConfigCache();
  });

  it('should return empty config when no config file exists', async () => {
    const config = await loadLoggerConfig();
    expect(config).toEqual({});
  });

  it('should cache config after first load', async () => {
    const config1 = await loadLoggerConfig();
    const config2 = await loadLoggerConfig();
    expect(config1).toBe(config2);
  });

  it('should return fresh config after clearing cache', async () => {
    const config1 = await loadLoggerConfig();
    clearConfigCache();
    const config2 = await loadLoggerConfig();
    // After clearing cache, we get a new object with same contents
    expect(config1).not.toBe(config2); // Different reference
    expect(config1).toEqual(config2); // Same contents
  });
});

describe('writeToFile (Node.js only)', () => {
  const testDir = path.join(__dirname, 'test-logs');
  const testFile = path.join(testDir, 'test.log');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should create directory if it does not exist', async () => {
    await writeToFile(testFile, 'Test message');
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('should write message to file', async () => {
    await writeToFile(testFile, 'Test message');
    const content = fs.readFileSync(testFile, 'utf-8');
    expect(content).toBe('Test message\n');
  });

  it('should append multiple messages', async () => {
    await writeToFile(testFile, 'Message 1');
    await writeToFile(testFile, 'Message 2');
    await writeToFile(testFile, 'Message 3');
    
    const content = fs.readFileSync(testFile, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toEqual(['Message 1', 'Message 2', 'Message 3']);
  });

  it('should handle nested directories', async () => {
    const nestedFile = path.join(testDir, 'nested', 'deep', 'test.log');
    await writeToFile(nestedFile, 'Nested message');
    
    expect(fs.existsSync(nestedFile)).toBe(true);
    const content = fs.readFileSync(nestedFile, 'utf-8');
    expect(content).toBe('Nested message\n');
  });

  it('should silently fail on invalid paths', async () => {
    const invalidPath = '/invalid\0path/test.log';
    await expect(writeToFile(invalidPath, 'Test')).resolves.not.toThrow();
  });

  it('should handle relative paths starting with ./', async () => {
    const relativeFile = './test-logs-relative/test.log';
    const cwd = process.cwd();
    const expectedPath = path.join(cwd, 'test-logs-relative', 'test.log');
    
    await writeToFile(relativeFile, 'Relative path test');
    
    expect(fs.existsSync(expectedPath)).toBe(true);
    
    // Cleanup
    fs.rmSync(path.join(cwd, 'test-logs-relative'), { recursive: true, force: true });
  });
});
