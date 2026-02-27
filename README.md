# Simple Logger

A lightweight, TypeScript logger that works in both Node.js and browser environments with intelligent environment detection and optional file logging.

## Features

- 🌍 **Dual Environment**: Works seamlessly in Node.js and browser
- 📝 **File Logging**: Automatic file creation in Node.js, optional in browser dev mode
- ⚙️ **Configuration**: Load settings from `logger.config.ts` with type safety
- 🎨 **Customizable**: Configurable levels, prefixes, timestamps, and colors
- 🔄 **Child Loggers**: Create specialized loggers with inherited settings
- 📊 **Callbacks**: Execute custom logic on each log entry
- 🚀 **Zero Dependencies**: Lightweight and fast
- 📦 **TypeScript**: Full type safety and IntelliSense support

## Installation

```bash
npm install simple-logger
# or
bun add simple-logger
```

## Quick Start

### Basic Usage

```typescript
import { Logger } from "simple-logger";

const logger = new Logger();
await logger.info("Hello, world!");
// Output: [2024-01-01T12:00:00.000Z] [INFO] Hello, world!
```

### With Path and Options

```typescript
import { Logger } from "simple-logger";

const logger = new Logger("/app/components/User.tsx", {
	level: "debug",
	prefix: "User",
	timestamps: true,
	colors: true,
	loggingFile: "./logs/app.log"
});

await logger.info("User logged in");
// Output: [2024-01-01T12:00:00.000Z] [INFO] [/app/components/User.tsx] [User] User logged in
```

### Using `import.meta.url`

```typescript
import { Logger } from "simple-logger";

const logger = new Logger(import.meta.url);
await logger.debug("Component initialized");
```

## Configuration

Create a `logger.config.ts` file in your project root:

```typescript
import { defineConfig } from "simple-logger";

export default defineConfig({
	timestamps: true,
	colors: true,
	loggingFile: "./logs/app.log",
	onLog: (details) => {
		// Custom logic for each log entry
		if (details.level === "error") {
			// Send to monitoring service
			console.error("[ALERT]", details.message);
		}
	}
});
```

## API Reference

### Constructor

```typescript
new Logger(path?: string, options?: LoggerOptions)
```

- `path` (optional): File path or URL to display in logs
- `options` (optional): Logger configuration options

### LoggerOptions

```typescript
interface LoggerOptions {
	level?: "debug" | "info" | "warn" | "error";
	prefix?: string;
	timestamps?: boolean;
	colors?: boolean;
	loggingFile?: string;
}
```

### Methods

All logging methods are async:

```typescript
await logger.debug(message: string, ...args: unknown[])
await logger.info(message: string, ...args: unknown[])
await logger.warn(message: string, ...args: unknown[])
await logger.error(message: string, ...args: unknown[])
```

### Child Loggers

```typescript
const parent = new Logger("/app/server.ts", { prefix: "Server" });
const child = parent.child({ prefix: "API" });

await child.info("API request received");
// Output: [INFO] [/app/server.ts] [API] API request received
```

## Environment Behavior

### Node.js

- Full file logging support
- Automatic directory creation
- Config file loading from `logger.config.ts`

### Browser

- Console-only logging (unless in dev mode with `loggingFile`)
- No filesystem access
- Vite development mode detection

## Examples

### Express.js Integration

```typescript
import express from "express";
import { Logger } from "simple-logger";

const app = express();
const logger = new Logger("/app/server.ts", { prefix: "Express" });

app.use((req, res, next) => {
	await logger.info(`${req.method} ${req.path}`);
	next();
});

app.listen(3000, () => {
	await logger.info("Server started on port 3000");
});
```

### React Component

```tsx
import { useEffect } from "react";
import { Logger } from "simple-logger";

const logger = new Logger(import.meta.url, { prefix: "UserProfile" });

function UserProfile() {
	useEffect(() => {
		logger.info("Component mounted");
		return () => logger.info("Component unmounted");
	}, []);

	const handleClick = () => {
		logger.warn("Button clicked without user session");
	};

	return <button onClick={handleClick}>Click me</button>;
}
```

### Error Handling

```typescript
const logger = new Logger("/app/api.ts", { prefix: "API" });

try {
	const data = await fetchData();
	await logger.info("Data fetched successfully", { count: data.length });
} catch (error) {
	await logger.error("Failed to fetch data", { error: error.message });
}
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Build
bun run build

# Watch mode
bun run dev
```

## License

MIT

---

# Roadmap

## Core Features

- [ ] **Log Rotation**
  - [ ] Automatic file rotation by size/date
  - [ ] Configurable max file size (e.g., 10MB)
  - [ ] Keep N number of backup files
  - [ ] Compress old logs

- [ ] **Structured Logging**
  - [x] JSON output format option
  - [x] Key-value pairs for metadata
  - [ ] Searchable log format
  - [ ] Integration with log analysis tools

- [ ] **Log Filtering**
  - [ ] Pattern-based filtering
  - [ ] Include/exclude specific loggers
  - [ ] Runtime log level changes
  - [ ] Conditional logging

## Advanced Features

- [ ] **Remote Logging**
  - [ ] Send logs to external services (Loggly, Papertrail, etc.)
  - [ ] HTTP/HTTPS endpoint support
  - [ ] Batch sending for performance
  - [ ] Retry logic for failed sends

- [ ] **Performance Monitoring**
  - [ ] Log execution time
  - [ ] Memory usage tracking
  - [ ] Performance metrics
  - [ ] Alert on thresholds

- [ ] **Context Management**
  - [ ] Automatic context propagation
  - [ ] Request IDs for tracing
  - [ ] User session tracking
  - [ ] Correlation IDs

## Developer Experience

- [ ] **Better TypeScript Support**
  - [ ] Strict typing for log data
  - [ ] Template literal types
  - [ ] Autocomplete for log keys
  - [ ] Compile-time log level checking

- [ ] **Development Tools**
  - [ ] Log viewer UI
  - [ ] Real-time log streaming
  - [ ] Search and filter interface
  - [ ] Export capabilities

- [ ] **Integration Features**
  - [ ] Express middleware
  - [ ] Next.js plugin
  - [ ] React DevTools integration
  - [ ] Browser DevTools panel

## Configuration

- [ ] **Advanced Config**
  - [ ] Environment-specific configs
  - [ ] Dynamic config reloading
  - [ ] Config validation
  - [ ] Default profiles (dev, prod, test)

- [ ] **Output Formats**
  - [ ] Pretty-printed console output
  - [ ] CSV export
  - [ ] Syslog format
  - [ ] Custom formatters

- [ ] **Storage Backends**
  - [ ] Database logging (MongoDB, PostgreSQL)
  - [ ] Cloud storage (S3, GCS)
  - [ ] In-memory buffering
  - [ ] Local file with different encodings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Priority

The features are prioritized based on community needs and practical utility:

**High Priority**

- Log rotation
- Structured logging
- Better TypeScript support

**Medium Priority**

- Remote logging
- Performance monitoring
- Integration features

**Low Priority**

- Advanced configuration
- Development tools
- Additional storage backends
