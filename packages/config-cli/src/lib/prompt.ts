import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { Errors as IncurErrors } from 'incur'

export async function promptForConfirmation(message: string): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = await rl.question(`${message} (y/N): `)
  rl.close()
  if (answer.trim().toLowerCase() !== 'y') {
    throw new IncurErrors.IncurError({
      code: 'Cancelled',
      message: 'Cancelled by user',
      retryable: false,
    })
  }
}
