const { spawn } = require('child_process')

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args)

    // Log when the process starts
    console.log(`${command} ${args} initiated`)

    // Uncomment to see output of each command
    // process.stdout.on('data', (data) => {
    //   console.log(`${command}: ${data}`)
    // })

    // Log errors
    process.stderr.on('data', (data) => {
      console.error(`${command} ${args} error: ${data}`)
    })

    // Log when and how the command exited
    process.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`${command} ${args} exited with code ${code}`))
      }
      console.log(`${command} ${args} completed successfully`)
      resolve()
    })
  })
}

// Add setup commands to this array
const commands = ['ajv', 'contracts', 'graphql', 'i18n']

Promise.all(commands.map((command) => runCommand('yarn', [command])))
  .then(() => console.log('All commands finished'))
  .catch(console.error)
