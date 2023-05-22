/* eslint-env node */
const { spawn } = require('child_process')

// Add yarn setup commands to this array
const COMMANDS = ['ajv', 'contracts', 'graphql', 'i18n']

// Check if --verbose flag is set
const isVerbose = process.argv.includes('--verbose')

/**
 * Run a single command using the yarn package manager.
 * @param {string} command - The yarn command to run.
 * @returns {Promise<void>} A promise that resolves when the command completes successfully, and rejects when the command fails.
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('yarn', [command])

    // Log when the childProcess starts
    console.log(`[${command}] initiated`)

    // verbose mode enables logging to stdout of all command data.
    // This can get pretty noisy.
    if (isVerbose) {
      childProcess.stdout.on('data', (data) => {
        data
          .split('\n')
          .map((line) => `[${command}] ${line}`)
          .forEach(console.log)
      })
    }

    // Log errors
    childProcess.stderr.on('data', (data) => {
      console.error(`Error during execution of [${command}]:\n${data}`)
    })

    // Log when and how the yarn exited
    childProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`[${command}] exited with non-zero code: ${code}`))
      }
      console.timeLog('prepare', `[${command}] completed`)
      resolve()
    })
  })
}

console.time('prepare')
Promise.all(COMMANDS.map(runCommand))
  .then(() => {
    console.timeEnd('prepare')
  })
  .catch(console.error)
