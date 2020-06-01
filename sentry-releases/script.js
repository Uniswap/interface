const { exec } = require('child_process')
const fs = require('fs')

async function main() {
  console.log('Running release script...');

  const fileName = 'releases.json'
  const { releases } = require(`./${fileName}`)

  const version = `v1.${releases.length}`
  releases.push(version)

  console.log('Tagging most-recent commit to be version ', version);
  await new Promise((success, failure) => {
    exec(`git tag -a ${version} -m "Releasing production version ${version}"`, (error, stdout) => {
      console.log('git tag output: ', stdout);
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  });

  await new Promise((success, failure) => {
    const command1 = `sentry-cli releases --project dmm-dao-web-app new ${version}`
    const command2 = `sentry-cli releases --project dmm-dao-web-app files ${version} upload-sourcemaps ./build`
    const command3 = `sentry-cli releases --project dmm-dao-web-app finalize ${version}`
    const commands = `${command1}; ${command2}; ${command3}`
    exec(commands, (error, stdout) => {
      console.log('sentry-cli output: ', stdout);
      if (!!error) {
        failure(error.message)
      } else {
        success()
      }
    })
  });

  fs.writeFileSync(`./sentry-releases/${fileName}`, JSON.stringify({ releases: releases }));

  console.log('Saved new release: ', version)
}

main()
  .then(() => console.log('Successfully ran program'))
  .catch(error => console.error('Error when running script: ', error));
