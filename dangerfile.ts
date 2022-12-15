import { danger, fail, markdown, message, warn } from 'danger'

// Other ideas:
//  - verify TODO have work items linked

/* Keep Lockfile up to date  */
// TODO: [MOB-3860] CI job to run `yarn install` and confirm no changes
const packageChanged = danger.git.modified_files.includes('package.json')
const lockfileChanged = danger.git.modified_files.includes('yarn.lock')
if (packageChanged && !lockfileChanged) {
  const msg = 'Changes were made to package.json, but not to yarn.lock'
  const idea = 'Perhaps you need to run `yarn install`?'
  warn(`${msg} - <i>${idea}</i>`)
}

/* Warn about storing credentials in GH and uploading env.local to 1Password */
const envChanged = danger.git.modified_files.includes('.env')
if (envChanged) {
  warn(
    'Changes were made to .env. Confirm that no sensitive data is in the .env file. Sensitive data must go in .env.local and then run `yarn upload-env-local` to store it in 1Password.'
  )
}

// Checks for any logging and reminds the developer not to log sensitive data
const updatedTsFiles = danger.git.modified_files
  .concat(danger.git.created_files)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
for (const file of updatedTsFiles) {
  danger.git.structuredDiffForFile(file).then((diff) => {
    for (const chunk of diff?.chunks || []) {
      for (const change of chunk.changes) {
        if (change.type !== 'add') {
          return
        }
        if (change.content.includes('logMessage') || change.content.includes('logger.')) {
          warn('You are logging data. Please confirm that nothing sensitive is being logged!')
        }
      }
    }
  })
}

// More tests
const modifiedAppFiles = danger.git.modified_files.filter(
  (f) =>
    f.includes('src/') &&
    (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx'))
)
/* Encourage more testing */
const hasAppChanges = modifiedAppFiles.length > 0
const testChanges = modifiedAppFiles.filter((filepath) => filepath.includes('.test.'))
const hasTestChanges = testChanges.length > 0

// Warn if there are library changes, but not tests
if (hasAppChanges && !hasTestChanges) {
  warn(
    "There are ts changes, but not tests. That's OK as we're iterating fast right now, but consider unit tests for isolated logic, Storybook stories for primitive components, or snapshot tests for more complex components."
  )
}

// Stories for new components
const createdComponents = danger.git.created_files.filter(
  (f) =>
    f.includes('components/buttons') ||
    f.includes('components/input') ||
    f.includes('components/layout/') ||
    f.includes('components/text')
)
const hasCreatedComponent = createdComponents.length > 0
const createdStories = createdComponents.filter((filepath) => filepath.includes('stories/'))
const hasCreatedStories = createdStories.length > 0
if (hasCreatedComponent && !hasCreatedStories) {
  warn(
    'There are new primitive components, but not stories. Consider documenting the new component with Storybook'
  )
}

// Warn when there is a big PR
const bigPRThreshold = 500
if (danger.github.pr.additions + danger.github.pr.deletions > bigPRThreshold) {
  warn(':exclamation: Big PR')
  markdown(
    '> Pull Request size seems relatively large. If PR contains multiple changes, split each into separate PRs for faster, easier reviews.'
  )
}

// No PR is too small to warrant a paragraph or two of summary
if (danger.github.pr.body.length < 50) {
  warn(
    'The PR description is looking sparse. Please consider explaining more about this PRs goal and implementation decisions.'
  )
}

// Congratulate when code was deleted
if (danger.github.pr.additions < danger.github.pr.deletions) {
  message(
    `✂️ Thanks for removing  ${danger.github.pr.deletions - danger.github.pr.additions} lines!`
  )
}

const stories = danger.git.fileMatch('**/*stories*')
if (stories.edited) {
  message('🙌 Thanks for keeping stories up to date!')
}

// Migrations + schema warnings
const updatedSchemaFile = danger.git.modified_files.find((file) =>
  file.includes('src/app/schema.ts')
)

const updatedMigrationsFile = danger.git.modified_files.find((file) =>
  file.includes('src/app/migrations.ts')
)

const updatedMigrationsTestFile = danger.git.modified_files.find((file) =>
  file.includes('src/app/migrations.test.ts')
)

const createdSliceFile = danger.git.created_files.find((file) =>
  file.toLowerCase().includes('slice')
)

const modifiedSliceFile = danger.git.modified_files.find((file) =>
  file.toLowerCase().includes('slice')
)

const deletedSliceFile = danger.git.deleted_files.find((file) =>
  file.toLowerCase().includes('slice')
)

if (modifiedSliceFile && (!updatedSchemaFile || !updatedMigrationsFile)) {
  warn(
    'You modified a slice file. If you added, renamed, or deleted required properties from state, then make sure to define a new schema and a create a migration.'
  )
}

if (updatedSchemaFile && !updatedMigrationsFile) {
  warn(
    'You updated the schema file but not the migrations file. Make sure to also define a migration.'
  )
}

if (!updatedSchemaFile && updatedMigrationsFile) {
  warn(
    'You updated the migrations file but not the schema. Schema always needs to be updated when a new migration is defined.'
  )
}

if (createdSliceFile && (!updatedMigrationsFile || !updatedSchemaFile)) {
  fail(
    'You created a new slice file. Please write a migration, update initialState in the `migrations.test.ts` file, and create a new schema.'
  )
}

if (deletedSliceFile && (!updatedSchemaFile || !updatedMigrationsFile)) {
  fail('You deleted a slice file. Make sure to define a new schema and and create a migration.')
}

if (updatedMigrationsFile && !updatedMigrationsTestFile) {
  fail(
    'You updated the migrations file but did not write any new tests. Each migration must have a test!'
  )
}
