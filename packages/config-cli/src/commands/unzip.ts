import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import dotenv from 'dotenv'
import { strFromU8, unzipSync } from 'fflate'
import { Cli, z } from 'incur'
import { errorToString } from 'utilities/src/errors'
import { unwrap } from '../errors'
import { serializeParams } from '../lib/format/format'
import { readDotenvFile } from '../lib/storage/dotenv'
import { findWorkspaceRoot } from '../lib/workspace'

// Match `apps/<app>/<filename>` with a strict app-name shape. The app-name slot
// rejects path-traversal segments; the filename slot is checked separately below.
const ENTRY_PATH = /^apps\/([a-z][a-z0-9-]*)\/([^/]+)$/

export const unzip = Cli.create('unzip', {
  description: "Unpack a config zip into each app's env file location.",
  args: z.object({
    file: z.string().describe('Path to the config zip file'),
  }),
  options: z.object({
    overwrite: z
      .boolean()
      .default(true)
      .describe('Replace existing env files. When false, merge values from the zip with existing (zip wins).'),
  }),
  async run(c) {
    let archive: Record<string, Uint8Array>
    try {
      const bytes = await readFile(c.args.file)
      archive = unzipSync(bytes)
    } catch (cause) {
      return c.error({ code: 'ReadFailed', message: `Cannot read zip file: ${errorToString(cause)}` })
    }

    const written: { file: string; keysWritten: number }[] = []
    const merged: { file: string; keysWritten: number; keysFromZip: number; keysPreserved?: string[] }[] = []
    const skipped: { app: string; reason: string }[] = []

    const workspaceRoot = findWorkspaceRoot()

    for (const [entryPath, entryBytes] of Object.entries(archive)) {
      const match = ENTRY_PATH.exec(entryPath)
      if (!match) {
        continue
      }
      const app = match[1] as string
      const filename = match[2] as string
      if (filename === '..') {
        continue
      }

      const appDir = join(workspaceRoot, 'apps', app)
      if (!(await isDirectory(appDir))) {
        skipped.push({ app, reason: `Directory apps/${app}/ does not exist` })
        continue
      }

      const targetPath = join(workspaceRoot, entryPath)
      const incomingText = strFromU8(entryBytes)

      let outputText: string
      let mergedInfo: { keysWritten: number; keysFromZip: number; keysPreserved?: string[] } | undefined
      if (c.options.overwrite) {
        outputText = incomingText
      } else {
        const existing = await unwrap(readDotenvFile(targetPath))
        const incoming = dotenv.parse(incomingText)
        // Zip values win on conflict; existing-only keys are preserved.
        const mergedRecord = { ...existing, ...incoming }
        const preserved = Object.keys(existing).filter((k) => !(k in incoming))
        outputText = serializeParams(mergedRecord)
        mergedInfo = {
          keysWritten: Object.keys(mergedRecord).length,
          keysFromZip: Object.keys(incoming).length,
          ...(preserved.length > 0 && { keysPreserved: preserved }),
        }
      }

      try {
        await writeFile(targetPath, outputText, 'utf8')
      } catch (cause) {
        return c.error({ code: 'WriteFailed', message: errorToString(cause) })
      }

      if (mergedInfo) {
        merged.push({ file: targetPath, ...mergedInfo })
      } else {
        written.push({ file: targetPath, keysWritten: Object.keys(dotenv.parse(incomingText)).length })
      }
    }

    if (written.length === 0 && merged.length === 0 && skipped.length === 0) {
      return c.error({
        code: 'NoEntries',
        message: `Zip file "${c.args.file}" contained no recognizable app config entries`,
      })
    }

    return {
      ...(written.length > 0 && { written }),
      ...(merged.length > 0 && { merged }),
      ...(skipped.length > 0 && { skipped }),
    }
  },
})

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}
