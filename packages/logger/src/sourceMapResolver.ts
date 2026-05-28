import type { RawSourceMap } from 'source-map-js'
import { SourceMapConsumer } from 'source-map-js'

export interface StackResolver {
  resolve(stack: string): string
}

export interface StackResolverCtx {
  sourceMapDir: string
  fallbackDirs?: string[]
  fs: {
    readdirSync: (path: string) => string[]
    readFileSync: (path: string, encoding: BufferEncoding) => string
  }
  path: {
    basename: (path: string) => string
    join: (...paths: string[]) => string
  }
}

export function createStackResolver(ctx: StackResolverCtx): StackResolver {
  const { sourceMapDir, fallbackDirs = [], fs, path } = ctx
  // Lazy-load: parse source maps on first use, not at startup
  let consumers: Map<string, SourceMapConsumer> | undefined

  function loadFromDir(dir: string, target: Map<string, SourceMapConsumer>): void {
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.map'))
      for (const file of files) {
        const jsFile = file.replace(/\.map$/, '')
        if (target.has(jsFile)) {
          continue
        } // first dir wins
        const mapContent = fs.readFileSync(path.join(dir, file), 'utf-8')
        const rawMap = JSON.parse(mapContent) as RawSourceMap
        target.set(jsFile, new SourceMapConsumer(rawMap))
      }
    } catch {
      // Dir doesn't exist or isn't readable — skip
    }
  }

  function getConsumers(): Map<string, SourceMapConsumer> {
    if (consumers) {
      return consumers
    }
    consumers = new Map()
    loadFromDir(sourceMapDir, consumers)
    for (const dir of fallbackDirs) {
      loadFromDir(dir, consumers)
    }
    return consumers
  }

  // Parse stack frames like:
  // "    at functionName (https://host/assets/index-abc123.js:10:42)"
  // "    at https://host/assets/index-abc123.js:10:42"
  // oxlint-disable-next-line security/detect-unsafe-regex -- regex is applied to individual stack frame lines, not unbounded input
  const FRAME_RE = /^(\s+at\s+(?:.*?\s+\()?)(.+?):(\d+):(\d+)(\)?\s*)$/

  return {
    resolve(stack: string): string {
      const maps = getConsumers()
      if (maps.size === 0) {
        return stack
      }

      return stack
        .split('\n')
        .map((line) => {
          const match = FRAME_RE.exec(line)
          if (!match) {
            return line
          }

          const [, prefix, filePath, lineStr, colStr, suffix] = match
          if (!prefix || !filePath || !lineStr || !colStr || !suffix) {
            return line
          }
          const fileName = path.basename(filePath)
          const consumer = maps.get(fileName)
          if (!consumer) {
            return line
          }

          const pos = consumer.originalPositionFor({
            line: parseInt(lineStr, 10),
            column: parseInt(colStr, 10),
          })

          if (pos.source) {
            return `${prefix}${pos.source}:${pos.line}:${pos.column}${suffix}`
          }
          return line
        })
        .join('\n')
    },
  }
}
