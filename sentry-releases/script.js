const { exec } = require('child_process')
const fs = require('fs')

async function main() {
  console.log('Running release script...')

  const fileName = 'releases.json'
  const { releases } = require(`./${fileName}`)

  const version = `v1.${releases.length}`
  console.log('Starting building flow for new version: ', version)
  releases.push(version)

  await new Promise((success, failure) => {
    const command = 'git rev-parse --abbrev-ref HEAD'
    exec(command, (error, stdout) => {
      if (!!error || stdout.trim() !== 'master') {
        const message = 'You must be on the master branch to build and deploy!'
        failure(message)
      } else {
        success()
      }
    })
  })

  await new Promise((success, failure) => {
    const untrackedMessage = 'untracked'
    const commands = `git diff-index --quiet HEAD -- || echo "${untrackedMessage}";`
    exec(commands, (error, stdout) => {
      if (!!error || stdout.trim().toString() === untrackedMessage) {
        const message = 'There are untracked changes in the repository that must be committed first! Run \`git status\` to see what changed.'
        failure(message)
      } else {
        success()
      }
    })
  })

  await new Promise((success, failure) => {
    const command = 'git push origin master'
    exec(command, (error, stdout) => {
      if (!!error || stdout.contains('[rejected]')) {
        const message = 'You must fast forward local/master to be in-line with origin/master'
        failure(message)
      } else {
        success()
      }
    })
  })

  throw Error('hello')

  const envFilePath = '.env.local'
  const oldEnvFileContent = fs.readFileSync(envFilePath).toString('utf8')
  const newEnvFileContent = oldEnvFileContent.replace(/(v\d\.\d+)/, version)
  fs.writeFileSync(envFilePath, newEnvFileContent)
  console.log(`Successfully wrote new version to ${envFilePath} file`)

  console.log('Building project for production deployment. This may take a couple moments.')
  await new Promise((success, failure) => {
    exec(`npm run build`, (error, stdout) => {
      console.log('Build output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  await new Promise((success, failure) => {
    const command1 = `sentry-cli releases --project dmm-dao-web-app new ${version}`
    const command2 = `sentry-cli releases --project dmm-dao-web-app files ${version} upload-sourcemaps ./build`
    const command3 = `sentry-cli releases --project dmm-dao-web-app finalize ${version}`
    const commands = `${command1}; ${command2}; ${command3}`
    exec(commands, (error, stdout) => {
      console.log('sentry-cli output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  console.log('Tagging most-recent commit to be version: ', version)
  await new Promise((success, failure) => {
    exec(`git tag -a ${version} -m "Releasing production version ${version}"`, (error, stdout) => {
      console.log('git tag output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  console.log('Pushing tags to repository')
  await new Promise((success, failure) => {
    exec('URL=`git remote get-url origin`; git push --tags ${URL}', (error, stdout) => {
      console.log('git push tag output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  console.log('Deploying to firebase')
  await new Promise((success, failure) => {
    exec('firebase deploy', (error, stdout) => {
      console.log('firebase deploy output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  console.log(`Writing new version to file ${fileName}`)
  fs.writeFileSync(`./sentry-releases/${fileName}`, JSON.stringify({ releases: releases }))

  console.log('Committing new release into repo')
  await new Promise((success, failure) => {
    const command = `git add --all; git commit -m "Incremented releases to ${version}"; git push origin master`
    exec(command, (error, stdout) => {
      console.log('git commit new release output: ', stdout)
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  })

  console.log('Saved new release: ', version)
}

main()
  .then(() => console.log('Successfully ran program'))
  .catch(error => console.error('Error when running script due to error: ', error))
