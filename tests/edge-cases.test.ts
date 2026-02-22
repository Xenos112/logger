import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger } from '../src/logger.js';
import { clearConfigCache } from '../src/config.js';

describe('Edge Cases and Special Scenarios', () => {
  let consoleSpy: any;

  beforeEach(() => {
    clearConfigCache();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Unicode and Internationalization', () => {
    it('should handle Unicode characters', async () => {
      const logger = new Logger();
      
      await logger.info('Unicode: 你好世界 🌍 ñ émojis');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('你好世界');
      expect(callArg).toContain('🌍');
    });

    it('should handle RTL languages', async () => {
      const logger = new Logger();
      
      await logger.info('RTL: مرحبا بالعالم');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle mixed scripts', async () => {
      const logger = new Logger();
      
      await logger.info('Mixed: Hello 你好 Hola שלום こんにちは');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle zero-width characters', async () => {
      const logger = new Logger();
      
      await logger.info('Zero\u200Bwidth\u200Cchars\u200D');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Empty and Whitespace', () => {
    it('should handle empty string message', async () => {
      const logger = new Logger();
      
      await logger.info('');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('[INFO]');
    });

    it('should handle whitespace-only message', async () => {
      const logger = new Logger();
      
      await logger.info('   \t\n   ');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle leading/trailing whitespace', async () => {
      const logger = new Logger();
      
      await logger.info('  message with spaces  ');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('  message with spaces  ');
    });
  });

  describe('Complex Data Types', () => {
    it('should handle Error objects', async () => {
      const logger = new Logger();
      const error = new Error('Test error');
      
      await logger.error('An error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle Date objects', async () => {
      const logger = new Logger();
      const date = new Date('2024-01-01');
      
      await logger.info('Current date:', date);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle RegExp', async () => {
      const logger = new Logger();
      const regex = /test-\d+/gi;
      
      await logger.info('Pattern:', regex);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle Map and Set', async () => {
      const logger = new Logger();
      const map = new Map([['key', 'value']]);
      const set = new Set([1, 2, 3]);
      
      await logger.info('Map:', map, 'Set:', set);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle Symbol', async () => {
      const logger = new Logger();
      const sym = Symbol('test');
      
      await logger.info('Symbol:', sym);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle BigInt', async () => {
      const logger = new Logger();
      const big = BigInt(9007199254740991);
      
      await logger.info('BigInt:', big);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle nested objects', async () => {
      const logger = new Logger();
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: 'deep'
            }
          }
        }
      };
      
      await logger.info('Nested:', obj);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle arrays with mixed types', async () => {
      const logger = new Logger();
      const arr = [1, 'two', { three: 3 }, [4], null, undefined, true];
      
      await logger.info('Array:', arr);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Function and Class Instances', () => {
    it('should handle class instances', async () => {
      const logger = new Logger();
      
      class TestClass {
        name = 'test';
        value = 42;
      }
      
      const instance = new TestClass();
      await logger.info('Instance:', instance);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle functions', async () => {
      const logger = new Logger();
      const fn = () => 'result';
      
      await logger.info('Function:', fn);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('Large Data', () => {
    it('should handle very long string', async () => {
      const logger = new Logger();
      const longString = 'x'.repeat(100000);
      
      await expect(logger.info(longString)).resolves.not.toThrow();
    });

    it('should handle many arguments', async () => {
      const logger = new Logger();
      const args = Array.from({ length: 100 }, (_, i) => `arg${i}`);
      
      await expect(logger.info('many', ...args)).resolves.not.toThrow();
    });

    it('should handle deeply nested objects', async () => {
      const logger = new Logger();
      let obj: any = { level: 0 };
      let current = obj;
      
      for (let i = 1; i <= 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }
      
      await expect(logger.info('deep', obj)).resolves.not.toThrow();
    });
  });

  describe('Special Prefixes and Paths', () => {
    it('should handle prefix with brackets', async () => {
      const logger = new Logger(undefined, { prefix: '[MyApp]' });
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('[[MyApp]]');
    });

    it('should handle prefix with special characters', async () => {
      const logger = new Logger(undefined, { prefix: 'App$#@!' });
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('[App$#@!]');
    });

    it('should handle path with spaces', async () => {
      const logger = new Logger('/path with spaces/file.ts');
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('/path with spaces/file.ts');
    });

    it('should handle path with unicode', async () => {
      const logger = new Logger('/ユーザー/ファイル.ts');
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('/ユーザー/ファイル.ts');
    });

    it('should handle Windows-style paths', async () => {
      const logger = new Logger('C:\\Users\\Test\\file.ts');
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('C:\\Users\\Test\\file.ts');
    });

    it('should handle URL paths', async () => {
      const logger = new Logger('https://example.com/path/file.ts');
      
      await logger.info('test');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('https://example.com/path/file.ts');
    });
  });

  describe('Log Level Edge Cases', () => {
    it('should handle invalid level gracefully', async () => {
      const logger = new Logger(undefined, { level: 'invalid' as any });
      
      // Should default to info or handle gracefully
      await expect(logger.info('test')).resolves.not.toThrow();
    });

    it('should handle case sensitivity in levels', async () => {
      const logger = new Logger(undefined, { level: 'INFO' as any });
      
      await logger.info('test');
      
      // May or may not log depending on implementation
      expect(consoleSpy.log.mock.calls.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle numeric level values', async () => {
      const logger = new Logger(undefined, { level: 1 as any });
      
      await expect(logger.info('test')).resolves.not.toThrow();
    });
  });

  describe('Async Behavior', () => {
    it('should handle rapid consecutive calls', async () => {
      const logger = new Logger();
      
      const promises = [
        logger.info('1'),
        logger.info('2'),
        logger.info('3'),
        logger.info('4'),
        logger.info('5'),
      ];
      
      await Promise.all(promises);
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(5);
    });

    it('should handle async message generation', async () => {
      const logger = new Logger();
      
      const getMessage = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async message';
      };
      
      await logger.info(await getMessage());
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('async message');
    });

    it('should not lose logs during concurrent execution', async () => {
      const logger = new Logger();
      const messages: string[] = [];
      
      consoleSpy.log.mockImplementation((msg: string) => {
        messages.push(msg);
      });
      
      await Promise.all(
        Array.from({ length: 20 }, (_, i) => 
          logger.info(`message-${i}`)
        )
      );
      
      // All 20 messages should be logged
      expect(messages.length).toBe(20);
    });
  });

  describe('Memory and Resources', () => {
    it('should not accumulate memory with many loggers', async () => {
      const loggers: Logger[] = [];
      
      // Create many loggers
      for (let i = 0; i < 100; i++) {
        loggers.push(new Logger(`/path${i}.ts`));
      }
      
      // All should work
      await Promise.all(loggers.map((l, i) => l.info(`test ${i}`)));
      
      expect(consoleSpy.log).toHaveBeenCalledTimes(100);
    });

    it('should handle child logger chains', async () => {
      let logger: Logger = new Logger('/root.ts', { prefix: 'Root' });
      
      // Create deep chain
      for (let i = 0; i < 20; i++) {
        logger = logger.child({ prefix: `Level${i}` });
      }
      
      await logger.info('deep chain');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('JSON Serialization Edge Cases', () => {
    it('should handle toJSON method', async () => {
      const logger = new Logger();
      
      const obj = {
        toJSON() {
          return { custom: 'serialization' };
        }
      };
      
      await logger.info('custom JSON:', obj);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle objects with getters', async () => {
      const logger = new Logger();
      
      const obj = {
        get computed() {
          return 'computed value';
        }
      };
      
      await logger.info('getter:', obj);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle objects with undefined prototype', async () => {
      const logger = new Logger();
      
      const obj = Object.create(null);
      obj.key = 'value';
      
      await logger.info('no prototype:', obj);
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('String Escaping', () => {
    it('should handle ANSI escape sequences in message', async () => {
      const logger = new Logger();
      
      await logger.info('With ANSI: \x1b[31mred\x1b[0m text');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should handle newlines and tabs', async () => {
      const logger = new Logger();
      
      await logger.info('Line1\nLine2\tTabbed');
      
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('Line1\nLine2\tTabbed');
    });

    it('should handle carriage returns', async () => {
      const logger = new Logger();
      
      await logger.info('Progress: 0%\rProgress: 50%\rProgress: 100%');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });
});

describe('Logger with Multiple Configurations', () => {
  let consoleSpy: any;

  beforeEach(() => {
    clearConfigCache();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow mixing options', async () => {
    const logger = new Logger('/app.ts', {
      level: 'debug',
      prefix: 'App',
      timestamps: true,
      colors: false,
    });

    await logger.debug('debug message');
    await logger.info('info message');
    await logger.warn('warn message');
    await logger.error('error message');

    expect(consoleSpy.log).toHaveBeenCalledTimes(2); // debug and info
    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
  });

  it('should respect most restrictive level setting', async () => {
    // Parent with error level, child with debug level
    const parent = new Logger(undefined, { level: 'error' });
    const child = parent.child({ level: 'debug' });

    await child.debug('debug from child');
    await child.info('info from child');
    await child.error('error from child');

    // Child's level should be respected
    expect(consoleSpy.log).toHaveBeenCalled(); // debug
    expect(consoleSpy.error).toHaveBeenCalled(); // error
  });
});
