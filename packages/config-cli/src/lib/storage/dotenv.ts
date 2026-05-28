import { readFile } from 'node:fs/promises'
import { Result } from 'better-result'
import dotenv from 'dotenv'
import { errorToString } from 'utilities/src/errors'
import { FileStorageError } from '../../errors'

/**
 * Read a dotenv file from disk and parse it. A missing file is treated as an empty
 * record so callers don't have to special-case the "no prior values" branch. Other
 * I/O errors are surfaced as a `FileStorageError` Result.
 */
export async function readDotenvFile(filePath: string): Promise<Result<Record<string, string>, FileStorageError>> {
  try {
    const contents = await readFile(filePath, 'utf8')
    return Result.ok(dotenv.parse(contents))
  } catch (cause) {
    if (cause instanceof Error && 'code' in cause && (cause as NodeJS.ErrnoException).code === 'ENOENT') {
      return Result.ok({})
    }
    return Result.err(new FileStorageError({ message: errorToString(cause) }))
  }
}
