const core = require('@actions/core')
const replaceDomain = require('./replace-domain')

replaceDomain({
  teamName: core.getInput('team-name'),
  token: core.getInput('token'),
  recordType: core.getInput('record-type'),
  domain: core.getInput('domain'),
  subdomain: core.getInput('subdomain'),
  value: core.getInput('value'),
})
  .catch(error => {
    core.setFailed(error)
  })