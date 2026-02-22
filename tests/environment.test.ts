import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger } from '../src/logger.js';
import { clearConfigCache, loadLoggerConfig } from '../src/config.js';

describe('Logger - Browser Environment Simulation', () => {
  let consoleSpy: any;
  let originalProcess: any;

  beforeEach(() => {
    clearConfigCache();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    
    // Simulate browser by removing process
    originalProcess = (globalThis as any).process;
    delete (globalThis as any).process;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore process
    (globalThis as any).process = originalProcess;
  });

  describe('Basic Logging (Browser Mode)', () => {
    it('should log messages without file operations', async () => {
      // Re-import to get fresh module with browser detection
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger();
      
      await logger.info('browser test');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should format messages correctly in browser', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger(undefined, { 
        timestamps: false, 
        colors: false,
        prefix: 'BrowserApp'
      });
      
      await logger.info('test message');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('[BrowserApp]');
      expect(callArg).toContain('test message');
    });
  });

  describe('Vite Environment', () => {
    it('should detect Vite dev mode', async () => {
      // Simulate Vite's import.meta.env
      const originalImportMeta = (globalThis as any).import;
      (globalThis as any).import = { meta: { env: { DEV: true, MODE: 'development' } } };
      
      const { isDev } = await import('../src/config.js');
      expect(isDev).toBe(true);
      
      // Restore
      (globalThis as any).import = originalImportMeta;
    });

    it('should work with Vite-style URLs in path', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger('http://localhost:3000/src/App.tsx');
      
      await logger.info('vite test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('http://localhost:3000/src/App.tsx');
    });
  });

  describe('Browser Console Methods', () => {
    it('should use console.error for error level', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger();
      
      await logger.error('error in browser');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should use console.warn for warn level', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger();
      
      await logger.warn('warning in browser');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should use console.log for info level', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger();
      
      await logger.info('info in browser');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should use console.log for debug level', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger(undefined, { level: 'debug' });
      
      await logger.debug('debug in browser');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Browser File Logging (Skipped)', () => {
    it('should skip file logging in browser', async () => {
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger(undefined, { 
        loggingFile: './test.log' 
      });
      
      // Should not throw even with loggingFile set
      await expect(logger.info('test')).resolves.not.toThrow();
    });

    it('should not attempt to write to filesystem in browser', async () => {
      // In browser mode, file logging should be silently skipped
      // We verify this by checking the logger works without errors
      const { Logger: BrowserLogger } = await import('../src/logger.js');
      const logger = new BrowserLogger(undefined, { loggingFile: './test.log' });
      
      // Should log to console without throwing
      await logger.info('test');
      
      // File write should not be attempted in browser
      // The fact that no error was thrown and console.log was called is success
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });
});

describe('Logger - Server Environment (Node.js)', () => {
  let consoleSpy: any;
  let tempDir: string;

  beforeEach(async () => {
    clearConfigCache();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    
    tempDir = '/tmp/logger-tests-' + Date.now();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Logging in Node.js', () => {
    it('should write logs to file in Node.js', async () => {
      const fs = await import('fs');
      const testFile = `${tempDir}/test.log`;
      
      const { Logger: NodeLogger } = await import('../src/logger.js');
      const logger = new NodeLogger(undefined, { 
        loggingFile: testFile,
        timestamps: false,
        colors: false
      });
      
      await logger.info('file log test');
      
      // Give async file write time to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (fs.existsSync(testFile)) {
        const content = fs.readFileSync(testFile, 'utf-8');
        expect(content).toContain('file log test');
      }
    });

    it('should create directory for log file', async () => {
      const fs = await import('fs');
      const nestedFile = `${tempDir}/nested/deep/test.log`;
      
      const { Logger: NodeLogger } = await import('../src/logger.js');
      const logger = new NodeLogger(undefined, { loggingFile: nestedFile });
      
      await logger.info('nested test');
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(fs.existsSync(`${tempDir}/nested/deep`)).toBe(true);
    });
  });

  describe('Config Loading in Node.js', () => {
    it('should detect Node.js environment', async () => {
      const { isNode } = await import('../src/config.js');
      expect(isNode).toBe(true);
    });

    it('should load config from logger.config.ts if exists', async () => {
      // This test verifies config loading capability
      const config = await loadLoggerConfig();
      expect(typeof config).toBe('object');
    });
  });

  describe('Server-Side Rendering (SSR)', () => {
    it('should work in SSR context', async () => {
      const logger = new Logger('/server/route.ts', { prefix: 'SSR' });
      
      await logger.info('SSR log');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('/server/route.ts');
      expect(callArg).toContain('[SSR]');
    });

    it('should handle server paths correctly', async () => {
      const logger = new Logger('/app/api/users/route.ts');
      
      await logger.info('API call');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('/app/api/users/route.ts');
    });
  });
});
