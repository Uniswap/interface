import { danger, fail, markdown, message, warn } from 'danger'

// Other ideas:
//  - verify TODO have work items linked

/* Keep Lockfile up to date  */
// TODO: CI job to run `yarn install` and confirm no changes
const packageChanged = danger.git.modified_files.includes('package.json')
const lockfileChanged = danger.git.modified_files.includes('yarn.lock')
if (packageChanged && !lockfileChanged) {
  const msg = 'Changes were made to package.json, but not to yarn.lock'
  const idea = 'Perhaps you need to run `yarn install`?'
  warn(`${msg} - <i>${idea}</i>`)
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
    '> Pull Request size seems relatively large. If PR contains multiple changes, split each into separate PR will helps faster, easier review.'
  )
}

// No PR is too small to warrant a paragraph or two of summary
if (danger.github.pr.body.length === 0) {
  warn('There is no PR description. Get faster and better reviews by explaining what changed.')
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
