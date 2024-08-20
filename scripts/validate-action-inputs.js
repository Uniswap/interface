const core = require('@actions/core')
const fs = require('fs')
const yaml = require('js-yaml')

try {
  // Read the current action.yml file
  const actionYml = yaml.load(fs.readFileSync(`${process.env.GITHUB_ACTION_PATH}/action.yml`, 'utf8'))

  const definedInputs = actionYml.inputs || {}
  const passedInputs = JSON.parse(process.argv[2])

  const passedInputsKeys = Object.keys(passedInputs)

  // Check for missing required inputs and unexpected inputs
  for (const [name, _] of Object.entries(definedInputs)) {
    const validName = passedInputsKeys.includes(name.trim())
    const validValue = passedInputs[name] && passedInputs[name] !== '' ? true : false
    if (!validName || !validValue) {
      console.log('Missing required input: ', name)
      core.setFailed(`Missing required input: ${name}`)
    }
  }
} catch (error) {
  core.setFailed(`Input validation failed: ${error.message}`)
}
