import { danger, fail, markdown, message, warn } from 'danger'
import * as fs from 'fs'
import { dirname } from 'path'

function getIndicesOf(searchStr: string, str: string): number[] {
  var searchStrLen = searchStr.length
  if (searchStrLen == 0) {
    return []
  }
  var startIndex = 0,
    index,
    indices: number[] = []
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index)
    startIndex = index + searchStrLen
  }
  return indices
}

async function getLinesAddedByFile(files: string[], { exclude = [] }: { exclude?: string[] } = {}) {
  return await Promise.all(
    files.flatMap(async (file) => {
      if (exclude.some((name) => file.endsWith(name))) {
        return []
      }

      const structuredDiff = await danger.git.structuredDiffForFile(file)

      return (structuredDiff?.chunks || []).flatMap((chunk) => {
        return chunk.changes.filter((change) => change.type === 'add')
      })
    }),
  )
}

// Put any files here that we explicitly want to ignore!
const IGNORED_SPLIT_RULE_FILES: string[] = []

function checkSplitFiles() {
  const touchedFiles = danger.git.modified_files.concat(danger.git.created_files)

  touchedFiles.forEach((file) => {
    const isWebFile = file.endsWith('.web.ts') || file.endsWith('.web.tsx')
    const isNativeFile = file.endsWith('.native.ts') || file.endsWith('.native.tsx')

    if ((!isWebFile && !isNativeFile) || IGNORED_SPLIT_RULE_FILES.includes(file)) {
      return
    }

    const baseFile = file.substring(0, file.indexOf(isWebFile ? '.web.ts' : '.native.ts'))
    const extension = file.indexOf('.tsx') !== -1 ? 'tsx' : 'ts'

    if (isWebFile && !fs.existsSync(`${dirname(__filename)}/${baseFile}.native.${extension}`)) {
      fail(`\`${baseFile}.web.${extension}\` must also have a \`${baseFile}.native.${extension}\` file.`)
    }

    if (isNativeFile && !fs.existsSync(`${dirname(__filename)}/${baseFile}.web.${extension}`)) {
      fail(`\`${baseFile}.native.${extension}\` must also have a \`${baseFile}.web.${extension}\` file.`)
    }

    if (!fs.existsSync(`${dirname(__filename)}/${baseFile}.${extension}`)) {
      fail(`\`${file}\` must have base stub file \`${baseFile}.${extension}\``)
    }
  })
}

async function processAddChanges() {
  const updatedTsFiles = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('dangerfile.ts'))

  const updatedNonUITsFiles = updatedTsFiles.filter((file) => !file.includes('packages/ui'))

  const linesAddedByFile = await getLinesAddedByFile(updatedTsFiles)
  const allLinesAdded = linesAddedByFile.flatMap((x) => x)

  // Check for non-UI package lines for tamagui imports
  const allNonUILinesAddedByFile = await getLinesAddedByFile(updatedNonUITsFiles, {
    exclude: ['env.d.ts', 'tamaguiProvider.tsx'],
  })
  const allNonUILinesAdded = allNonUILinesAddedByFile.flatMap((x) => x)
  allNonUILinesAdded.forEach((change) => {
    if (change.content.includes(`from 'tamagui`)) {
      fail(`Please import any tamagui exports via the ui package. Found an import at ${change.content}`)
    }
  })

  // Checks for any logging and reminds the developer not to log sensitive data
  if (allLinesAdded.some((change) => change.content.includes('logMessage') || change.content.includes('logger.'))) {
    warn('You are logging data. Please confirm that nothing sensitive is being logged!')
  }

  // Check for usage of FlatList, FlashList, VirtualizedList, or ScrollView in modals
  allLinesAdded.forEach((change) => {
    if (
      change.content.includes('FlatList') ||
      change.content.includes('FlashList') ||
      change.content.includes('VirtualizedList') ||
      change.content.includes('ScrollView')
    ) {
      warn(
        `Detected usage of ${change.content.match(/FlatList|FlashList|VirtualizedList|ScrollView/g)?.join(', ')}. If it's used in a modal, please use the appropriate import from '@gorhom/bottom-sheet' instead.`,
      )
    }
  })

  // Check for imports from @gorhom/bottom-sheet
  allLinesAdded.forEach((change) => {
    if (
      change.content.includes('@gorhom/bottom-sheet') &&
      (change.content.includes('BottomSheetScrollView') ||
        change.content.includes('BottomSheetFlatList') ||
        change.content.includes('BottomSheetFlashList'))
    ) {
      warn(
        `Detected import from '@gorhom/bottom-sheet' for ${change.content.match(/BottomSheetScrollView|BottomSheetFlatList|BottomSheetFlashList/g)?.join(', ')}. Consider adding the focus hook from 'useBottomSheetFocusHook' to ensure scrollables work correctly, especially on Android.`,
      )
    }
  })

  // Check for UI package imports that are longer than needed
  const validLongerImports = [
    `'ui/src'`,
    `'ui/src/theme'`,
    `'ui/src/loading'`,
    `'ui/src/assets'`,
    `'ui/src/components/icons'`,
    `'ui/src/components/logos'`,
    `'ui/src/icons'`,
    `'ui/src/animations'`,
    `'ui/src/hooks/useDeviceDimensions'`,
    `'ui/src/components/layout/AnimatedFlex'`,
    `'ui/src/components/text/AnimatedText'`,
    `'ui/src/components/AnimatedFlashList/AnimatedFlashList'`,
  ]
  const longestImportLength = Math.max(...validLongerImports.map((i) => i.length))
  allNonUILinesAdded.forEach((change) => {
    const indices = getIndicesOf(`from 'ui/src/`, change.content)

    indices.forEach((idx) => {
      const potentialSubstring = change.content.substring(
        idx,
        Math.min(change.content.length, idx + longestImportLength + 6 + 1),
      )
      if (!validLongerImports.some((validImport) => potentialSubstring.includes(validImport))) {
        const endOfImport = change.content.indexOf(`'`, idx + 6) // skipping the "from '"
        warn(
          `It looks like you have a longer import from 'ui/src' than needed ('${change.content.substring(idx + 6, endOfImport)}'). Please use one of [${validLongerImports.join(', ')}] when possible!`,
        )
      }
    })
  })

  linesAddedByFile.forEach((linesAdded) => {
    const concatenatedAddedLines = linesAdded.reduce((acc, curr) => acc + curr.content, '')

    // In this section we concatenate all the added lines by file in order to account for multiline changes.

    // Check for non-recommended sentry usage
    if (/logger\.error\(\s*new Error\(/.test(concatenatedAddedLines)) {
      warn(
        `It appears you may be manually logging a Sentry error. Please log the error directly if possible. If you need to use a custom error message, ensure the error object is added to the 'cause' property.`,
      )
    }
    if (/logger\.error\(\s*['`"]/.test(concatenatedAddedLines)) {
      warn(`Please log an error, not a string!`)
    }

    // Check for incorrect usage of `createSelector`
    if (concatenatedAddedLines.includes(`createSelector(`)) {
      warn(
        "You've added a new call to `createSelector()`. This is Ok, but please make sure you're using it correctly and you're not creating a new selector on every render. See PR #5172 for details.",
      )
    }
    if (/(useSelector|appSelect|select)\(\s*makeSelect/.test(concatenatedAddedLines)) {
      fail(
        `It appears you may be creating a new selector on every render. See PR #5172 for details on how to fix this.`,
      )
    }
  })
}

async function checkCocoaPodsVersion() {
  const updatedPodFileLock = danger.git.modified_files.find((file) => file.includes('ios/Podfile.lock'))
  if (updatedPodFileLock) {
    const structuredDiff = await danger.git.structuredDiffForFile(updatedPodFileLock)
    const changedLines = (structuredDiff?.chunks || []).flatMap((chunk) => {
      return chunk.changes.filter((change) => change.type === 'add')
    })
    const changedCocoaPodsVersion = changedLines.some((change) => change.content.includes('COCOAPODS: '))
    if (changedCocoaPodsVersion) {
      warn(
        `You're changing the Podfile version! Ensure you are using the correct version. If this change is intentional, you should ignore this check and merge anyways.`,
      )
    }
  }
}

async function checkApostrophes() {
  const updatedTranslations = danger.git.modified_files.find((file) => file.includes('en-US.json'))
  if (updatedTranslations) {
    const structuredDiff = await danger.git.structuredDiffForFile(updatedTranslations)
    const changedLines = (structuredDiff?.chunks || []).flatMap((chunk) => {
      return chunk.changes.filter((change) => change.type === 'add')
    })
    changedLines.forEach((line, index) => {
      if (line.content.includes("'")) {
        fail(
          "You added a string to the translations file using the ' character. Please use the ’ character instead!. Issue in line: " +
            index,
        )
      }
    })
  }
}

async function checkPRSize() {
  // Warn when there is a big PR
  const bigPRThreshold = 500
  const linesCount = await danger.git.linesOfCode('**/*')
  // exclude fixtures and auto generated files
  const excludeLinesCount = await danger.git.linesOfCode('{**/*.snap}')
  const totalLinesCount = (linesCount ?? 0) - (excludeLinesCount ?? 0)
  if (totalLinesCount > bigPRThreshold) {
    warn(':exclamation: Big PR')
    markdown(
      '> Pull Request size seems relatively large. If PR contains multiple changes, split each into separate PRs for faster, easier reviews.',
    )
  }
}

/* Warn about storing credentials in GH and uploading env.local to 1Password */
const envChanged = danger.git.modified_files.includes('.env.defaults')
if (envChanged) {
  warn(
    'Changes were made to .env.defaults. Confirm that no sensitive data is in the .env.defaults file. Sensitive data must go in .env (web) or .env.defaults.local (mobile) and then run `yarn upload-env-local` to store it in 1Password.',
  )
}

// Check native and web file splits
checkSplitFiles()

// Run checks on added changes
processAddChanges()

// Check for cocoapods version change
checkCocoaPodsVersion()

// check translations use the correct apostrophes
checkApostrophes()

// check the PR size
checkPRSize()

// No PR is too small to warrant a paragraph or two of summary
if (danger.github.pr.body.length < 50) {
  warn(
    'The PR description is looking sparse. Please consider explaining more about this PRs goal and implementation decisions.',
  )
}

// Congratulate when code was deleted
if (danger.github.pr.additions < danger.github.pr.deletions) {
  message(`✂️ Thanks for removing  ${danger.github.pr.deletions - danger.github.pr.additions} lines!`)
}

// GraphQL update warnings
const updatedGraphQLfile = danger.git.modified_files.find((file) => file.endsWith('.graphql'))

if (updatedGraphQLfile) {
  warn(
    'You have updated the GraphQL schema. Please ensure that the Swift GraphQL Schema generation is valid by running `yarn mobile ios` and rebuilding for iOS. ' +
      'You may need to add or remove generated files to the project.pbxproj. For more information see `apps/mobile/ios/WidgetsCore/MobileSchema/README.md`',
  )
}

// Migrations + schema warnings
const updatedMobileSchemaFile = danger.git.modified_files.find((file) => file.includes('mobile/src/app/schema.ts'))

const updatedMobileMigrationsFile = danger.git.modified_files.find((file) =>
  file.includes('mobile/src/app/migrations.ts'),
)

const updatedMobileMigrationsTestFile = danger.git.modified_files.find((file) =>
  file.includes('mobile/src/app/migrations.test.ts'),
)

const updatedExtensionSchemaFile = danger.git.modified_files.find((file) =>
  file.includes('extension/src/app/schema.ts'),
)

const updatedExtensionMigrationsFile = danger.git.modified_files.find((file) =>
  file.includes('extension/src/store/migrations.ts'),
)

const updatedExtensionMigrationsTestFile = danger.git.modified_files.find((file) =>
  file.includes('extension/src/store/migrations.test.ts'),
)

const createdSliceFile = danger.git.created_files.find((file) => file.toLowerCase().includes('slice'))

const modifiedSliceFile = danger.git.modified_files.find((file) => file.toLowerCase().includes('slice'))

const deletedSliceFile = danger.git.deleted_files.find((file) => file.toLowerCase().includes('slice'))

if (
  modifiedSliceFile &&
  (!updatedMobileSchemaFile ||
    !updatedMobileMigrationsFile ||
    !updatedExtensionSchemaFile ||
    !updatedExtensionMigrationsFile)
) {
  warn(
    'You modified a slice file. If you added, renamed, or deleted required properties from state, then make sure to define a new schema and a create a migration.',
  )
}

if (updatedMobileSchemaFile && !updatedMobileMigrationsFile) {
  warn('You updated the mobile schema file but not the migrations file. Make sure to also define a migration.')
}

if (updatedExtensionSchemaFile && !updatedExtensionMigrationsFile) {
  warn('You updated the extension schema file but not the migrations file. Make sure to also define a migration.')
}

if (!updatedMobileSchemaFile && updatedMobileMigrationsFile) {
  warn(
    'You updated the mobile migrations file but not the schema. Schema always needs to be updated when a new migration is defined.',
  )
}

if (!updatedExtensionSchemaFile && updatedExtensionMigrationsFile) {
  warn(
    'You updated the extension migrations file but not the schema. Schema always needs to be updated when a new migration is defined.',
  )
}

if (
  (createdSliceFile || deletedSliceFile) &&
  (!updatedMobileSchemaFile ||
    !updatedMobileMigrationsFile ||
    !updatedExtensionSchemaFile ||
    !updatedExtensionMigrationsFile)
) {
  warn('You created or deleted a slice file. Make sure to update the schema and create migration if needed.')
}

if (
  (updatedMobileMigrationsFile && !updatedMobileMigrationsTestFile) ||
  (updatedExtensionMigrationsFile && !updatedExtensionMigrationsTestFile)
) {
  fail('You updated the migrations file but did not write any new tests. Each migration must have a test!')
}

if (updatedMobileMigrationsFile !== updatedExtensionMigrationsFile) {
  warn(
    'You updated the migrations file in one app but not the other. Make sure to update both migration files if needed.',
  )
}
