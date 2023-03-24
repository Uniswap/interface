/* eslint-disable no-template-curly-in-string */
module.exports = {
  branches: [{ name: 'main' }],
  analyzeCommits: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'feat!', release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix!', release: 'major' },
          { type: 'fix', release: 'patch' },
          { type: 'chore', release: 'patch' },
          { type: 'ci', release: false },
          { type: 'docs', release: false },
        ],
      },
    ],
  ],
  verifyConditions: ['@semantic-release/changelog', '@semantic-release/git'],
  generateNotes: [
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            {
              type: 'feat!',
              section: ':boom: BREAKING CHANGE',
              hidden: false,
            },
            {
              type: 'fix!',
              section: ':boom: BREAKING CHANGE',
              hidden: false,
            },
            {
              type: 'feat',
              section: ':sparkles: Features',
              hidden: false,
            },
            {
              type: 'fix',
              section: ':bug: Fixes',
              hidden: false,
            },
            {
              type: 'docs',
              section: ':memo: Documentation',
              hidden: false,
            },
            {
              type: 'ci',
              section: ':repeat: CI/CD',
              hidden: false,
            },
            {
              type: 'chore',
              section: ':broom: Chore',
              hidden: false,
            },
          ],
        },
      },
    ],
  ],
  prepare: [
    [
      '@google/semantic-release-replace-plugin',
      {
        replacements: [
          {
            files: ['package.json'],
						from: "\"version\": \".*\"", // eslint-disable-line
						to: "\"version\": \"${nextRelease.version}\"", // eslint-disable-line
          },
          {
            files: ['app.json'],
						from: "\"buildNumber\": \".*\"", // eslint-disable-line
						to: "\"buildNumber\": \"${nextRelease.version}\"", // eslint-disable-line
          },
          {
            files: ['app.json'],
						from: `"versionCode": [^\n]*`, // eslint-disable-line
						to: (match) => `"versionCode": ${parseInt(match.split(':')[1].trim()) + 1}`, // eslint-disable-line
          },
        ],
      },
    ],
    '@semantic-release/changelog',
    [
      '@dmeents/semantic-release-yarn',
      {
        npmPublish: false,
        changeVersion: true,
        tarballDir: 'dist',
      },
    ],
    {
      path: '@semantic-release/git',
      assets: ['CHANGELOG.md', 'package.json', 'yarn.lock', 'app.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    },
  ],
  publish: [['@semantic-release/github']],
  success: false,
  fail: false,
}
