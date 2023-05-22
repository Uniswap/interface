/* eslint-env node */
const { spawn } = require('child_process')

// Add yarn setup commands to this array
const commands = ['ajv', 'contracts', 'graphql', 'i18n']

// Check if --verbose flag is set
const verbose = process.argv.includes('--verbose')

/**
 * Run a single command using the yarn package manager.
 * @param {string} command - The yarn command to run.
 * @returns {Promise<void>} A promise that resolves when the command completes successfully, and rejects when the command fails.
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('yarn', [command])

    // Log when the childProcess starts
    console.log(`yarn ${command} initiated`)

    // Uncomment to see output of each yarn
    if (verbose) {
      childProcess.stdout.on('data', (data) => {
        console.log(`Output from yarn ${command}:\n${data}`)
      })
    }

    // Log errors
    childProcess.stderr.on('data', (data) => {
      console.error(`Error during execution of yarn ${command}:\n${data}`)
    })

    // Log when and how the yarn exited
    childProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Command "yarn ${command}" exited with non-zero code: ${code}`))
      }
      console.timeLog('prepare-commands', `yarn ${command} completed`)
      resolve()
    })
  })
}

console.time('prepare-commands')
Promise.all(commands.map(runCommand))
  .then(() => {
    console.log('All commands finished')
    console.timeEnd('prepare-commands')
  })
  .catch(console.error)
