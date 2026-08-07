import * as fs from 'fs'
import { danger, fail, markdown, message, schedule, warn } from 'danger'
import { findRatchetViolations, parseRatchetConfig } from './scripts/tamagui-migration/ratchet/check.ts'

// Danger runs from the repo root. Resolve file checks against it instead of
// `__dirname`/`__filename`, which are undefined now that this file loads as an ES module.
const repoRoot = process.cwd()

function getIndicesOf(searchStr: string, str: string): number[] {
  const searchStrLen = searchStr.length
  if (searchStrLen === 0) {
    return []
  }
  let startIndex = 0,
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

async function checkLockedDependencies() {
  const packageJSONFiles = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((file) => file.includes('package.json'))

  const allLinesAdded = (await getLinesAddedByFile(packageJSONFiles)).flatMap((x) => x)

  allLinesAdded.forEach((change) => {
    const stringChange = change.content
    if (stringChange.includes(': "^') || stringChange.includes(': "*') || stringChange.includes(': "~')) {
      fail(
        `Detected a non-locked dependency at \`${stringChange}\`. Please lock all dependency versions for security purposes!`,
      )
    }
  })
}

function checkGeneralizedHookFiles() {
  const touchedFiles = danger.git.modified_files.concat(danger.git.created_files)

  touchedFiles.forEach((file) => {
    const isGeneralHookFile = file.endsWith('hooks.ts') || file.endsWith('hooks.tsx')
    const isNonSpecificHookFile = file.includes('/hooks/') && !file.includes('/use')

    const sharedWarningExampleExplanation = `e.g. \`hooks/useXXX.ts{x}\`. This helps in development for discovery and navigation purposes.`

    if (isGeneralHookFile) {
      warn(
        `\`${file}\` should be split out into a \`hooks/*\` folder with a hook per file, ${sharedWarningExampleExplanation}`,
      )
    }

    if (isNonSpecificHookFile) {
      warn(
        `\`${file}\` should only have one exported hook per file and be named accordingly, ${sharedWarningExampleExplanation}`,
      )
    }
  })
}

// Put any files here that we explicitly want to ignore!
const IGNORED_SPLIT_RULE_FILES: string[] = ['packages/gating/src/sdk/statsig.native.ts']

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

    if (isWebFile && !fs.existsSync(`${repoRoot}/${baseFile}.native.${extension}`)) {
      fail(`\`${baseFile}.web.${extension}\` must also have a \`${baseFile}.native.${extension}\` file.`)
    }

    if (isNativeFile && !fs.existsSync(`${repoRoot}/${baseFile}.web.${extension}`)) {
      fail(`\`${baseFile}.native.${extension}\` must also have a \`${baseFile}.web.${extension}\` file.`)
    }

    if (!fs.existsSync(`${repoRoot}/${baseFile}.${extension}`)) {
      fail(`\`${file}\` must have base stub file \`${baseFile}.${extension}\``)
    }
  })
}

function checkHookFilesHaveTests() {
  const touchedFiles = danger.git.modified_files.concat(danger.git.created_files)

  touchedFiles.forEach((file) => {
    // skip non-hook files
    if (!file.includes('/hooks/') && !file.includes('/hooks.ts')) {
      return
    }

    // skip test files
    if (file.includes('.test.')) {
      return
    }

    const baseFile = file.substring(0, file.indexOf('.ts'))
    const extension = file.indexOf('.tsx') !== -1 ? 'tsx' : 'ts'

    const assumedTestFile = `${repoRoot}/${baseFile}.test.${extension}`

    if (!fs.existsSync(assumedTestFile)) {
      warn(
        `\`${file}\` doesn't appear to have an accompanying test file (assumed \`${assumedTestFile}\`). Consider adding tests for this hook!`,
      )
    }
  })
}

async function processAddChanges() {
  const updatedTsFiles = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && !file.includes('dangerfile.ts'))

  // Shared exemption: tooling paths legitimately contain the tamagui import strings these checks match
  const migrationToolingPrefixes = loadMigrationToolingPrefixes()
  const updatedNonUITsFiles = updatedTsFiles.filter(
    (file) => !file.includes('packages/ui') && !isTamaguiExemptPath(file, migrationToolingPrefixes),
  )

  const linesAddedByFile = await getLinesAddedByFile(updatedTsFiles)
  const allLinesAdded = linesAddedByFile.flatMap((x) => x)

  // Check for non-UI package lines for tamagui imports
  const allNonUILinesAddedByFile = await getLinesAddedByFile(updatedNonUITsFiles, {
    exclude: ['env.d.ts', 'tamaguiProvider.tsx', 'setupTests.ts', 'oxlint.config.ts'],
  })
  const allNonUILinesAdded = allNonUILinesAddedByFile.flatMap((x) => x)
  allNonUILinesAdded.forEach((change) => {
    if (change.content.includes(`from 'tamagui`)) {
      fail(`Please import any tamagui exports via the ui package. Found an import at ${change.content}`)
    }
  })

  // Tamagui→Mycelium migration ratchet: directories listed in ratchet.json are
  // fully converted and must not reintroduce ui/src or tamagui imports
  let convertedDirectories: string[] = []
  try {
    convertedDirectories = parseRatchetConfig(
      fs.readFileSync(`${repoRoot}/scripts/tamagui-migration/ratchet/ratchet.json`, 'utf8'),
    ).convertedDirectories
  } catch (error) {
    fail(
      `Could not load \`scripts/tamagui-migration/ratchet/ratchet.json\`, so the converted-directory ratchet did not run. ` +
        `Fix the file and re-push. Parse error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  linesAddedByFile.forEach((linesAdded, fileIndex) => {
    const filePath = updatedTsFiles[fileIndex]
    if (!filePath) {
      return
    }
    findRatchetViolations({
      filePath,
      addedLines: linesAdded.map((change) => change.content),
      convertedDirectories,
    }).forEach((violation) => fail(violation))
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
        `Detected import from '@gorhom/bottom-sheet' for ${change.content.match(/BottomSheetScrollView|BottomSheetFlatList|BottomSheetFlashList/g)?.join(', ')}. Consider setting focusHook to 'useFocusEffect' to ensure scrollables work within bottom sheets, especially on Android.`,
      )
    }
  })

  // Check for UI package imports that are longer than needed
  const validLongerImports = [
    `'ui/src'`,
    `'ui/src/storybook'`,
    `'ui/src/theme'`,
    `'ui/src/loading'`,
    `'ui/src/assets'`,
    `'ui/src/components/icons'`,
    `'ui/src/icons'`,
    `'ui/src/animations'`,
    `'ui/src/hooks/useDeviceDimensions'`,
    `'ui/src/hooks/useDeviceInsets'`,
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

      // Skip warning on specific icon imports, needed for web to avoid pulling in all icons
      if (change.content.includes('ui/src/components/icons/')) {
        return
      }

      if (!validLongerImports.some((validImport) => potentialSubstring.includes(validImport))) {
        const endOfImport = change.content.indexOf(`'`, idx + 6) // skipping the "from '"
        warn(
          `It looks like you have a longer import from 'ui/src' than needed ('${change.content.substring(idx + 6, endOfImport)}'). Please use one of [${validLongerImports.join(', ')}] when possible!`,
        )
      }
    })
  })

  linesAddedByFile.forEach((linesAdded, fileIndex) => {
    const concatenatedAddedLines = linesAdded.reduce((acc, curr) => acc + curr.content, '')
    const filePath = updatedTsFiles[fileIndex]

    // In this section we concatenate all the added lines by file in order to account for multiline changes.

    // Check for non-recommended logger usage
    if (/logger\.error\(\s*new Error\(/.test(concatenatedAddedLines)) {
      warn(
        `It appears you may be manually logging an error. Please log the error directly if possible. If you need to use a custom error message, ensure the error object is added to the 'cause' property.`,
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

    // Check for direct string cache key usage with react query (skip mission-control app and test files, where fixture keys are arbitrary)
    if (
      concatenatedAddedLines.includes(`queryKey: ['`) &&
      !filePath?.startsWith('apps/mission-control/') &&
      !filePath?.endsWith('.test.ts') &&
      !filePath?.endsWith('.test.tsx')
    ) {
      fail(
        `It appears you're using a direct string cache key with react query. Please use the ReactQueryCacheKey enum instead!`,
      )
    }
  })

  // Warn if any changed file contains TouchableArea (entire file, not just diff)
  const changedFiles = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
  const filesWithTouchableArea: string[] = []
  for (const file of changedFiles) {
    try {
      const fileContent = fs.readFileSync(file, 'utf8')
      if (fileContent.includes('TouchableArea')) {
        filesWithTouchableArea.push(file)
      }
    } catch {
      // Ignore files that can't be read (e.g., deleted or binary)
    }
  }
  if (filesWithTouchableArea.length > 0) {
    warn(
      `Detected usage of \`TouchableArea\` in the following file(s):\n\n${filesWithTouchableArea.map((f) => `- ${f}`).join('\n')}\n\nIn each of these files, please audit the usage of \`TouchableArea\` and consider migrating to the new implementation! Examples of new variants and API usage can be found in the \`TouchableArea.stories.tsx\` file.`,
    )
  }
}

// ── New Tamagui styling ban (INFRA-2958) ──────────────────────────────
// Diff-level backstop for the `universe-custom/no-tamagui-styling` oxlint
// rule (which only runs under full lint — jsPlugins are disabled in fast
// lint). Unlike the lint rule, which ratchets against the generated baseline,
// this check is strict on ADDED lines: any added Tamagui styling fails, even
// in grandfathered files. Keep the detection shapes in sync with
// config/oxlint-plugins/universe-custom.js.
// Shapes mirror the lint rule: `styled(`, `animation=` / `animateEnter=` /
// `animateExit=` (JSX), and `$group-*` as a JSX prop or object key.
const TAMAGUI_STYLED_RE = /\bstyled\s*\(/
const TAMAGUI_ANIMATION_RE = /\b(?:animation|animateEnter|animateExit)\s*=[^=]/
const TAMAGUI_GROUP_RE = /['"]?\$group-[\w-]+['"]?\s*[=:]/
const TAMAGUI_STYLED_IMPORT_RE =
  /import\s*(?:type\s+)?\{[^}]*\bstyled\b[^}]*\}\s*from\s*'(?:ui\/src|tamagui|@tamagui\/[^']+)'/
// Paths outside the migration lint surface: labs/, config/, and top-level
// scripts/ are never linted by the rule. Deliberately NOT exempting nested
// package scripts/ dirs — real code there must not slip the gate; specific
// tooling paths belong in the shared exemption list below.
const TAMAGUI_EXEMPT_PATH_RE = /^(?:labs\/|scripts\/|config\/)|(?:^|\/)dangerfile\.ts$/
// Migration tooling (codemod/census fixtures, ratchet probes) legitimately
// contains Tamagui styling text. Shared list, also consumed by the oxlint
// rule and the baseline generator.
const TAMAGUI_EXEMPT_LIST_PATH = 'config/oxlint-plugins/tamagui-migration-exempt-paths.json'

function isTamaguiExemptPath(file: string, migrationToolingPrefixes: string[]): boolean {
  return TAMAGUI_EXEMPT_PATH_RE.test(file) || migrationToolingPrefixes.some((prefix) => file.startsWith(prefix))
}

function loadMigrationToolingPrefixes(): string[] {
  // Missing/unreadable/malformed list degrades to no exemptions (keep
  // checking), matching the rule module. Entries are normalized to directory
  // prefixes (trailing `/`) so `scripts/tamagui-census` never exempts
  // siblings like `scripts/tamagui-census-foo/` — same semantics in all
  // three legs.
  try {
    const { pathPrefixes } = JSON.parse(fs.readFileSync(`${repoRoot}/${TAMAGUI_EXEMPT_LIST_PATH}`, 'utf8')) as {
      pathPrefixes?: unknown
    }
    if (!Array.isArray(pathPrefixes)) {
      throw new Error(`pathPrefixes is missing or not an array in ${TAMAGUI_EXEMPT_LIST_PATH}`)
    }
    return pathPrefixes
      .filter((prefix): prefix is string => typeof prefix === 'string')
      .map((prefix) => (prefix.endsWith('/') ? prefix : `${prefix}/`))
  } catch {
    warn(`Could not read \`${TAMAGUI_EXEMPT_LIST_PATH}\` — the Tamagui checks ran without tooling exemptions.`)
    return []
  }
}

async function checkNewTamaguiStyling() {
  const migrationToolingPrefixes = loadMigrationToolingPrefixes()

  const touchedFiles = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter(
      (file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && !isTamaguiExemptPath(file, migrationToolingPrefixes),
    )

  for (const file of touchedFiles) {
    const structuredDiff = await danger.git.structuredDiffForFile(file)
    const addedLines = (structuredDiff?.chunks || []).flatMap((chunk) =>
      chunk.changes.filter((change) => change.type === 'add'),
    )
    if (addedLines.length === 0) {
      continue
    }

    // `styled(` only counts when the file actually pulls the Tamagui factory.
    let hasTamaguiStyledImport = false
    try {
      hasTamaguiStyledImport = TAMAGUI_STYLED_IMPORT_RE.test(fs.readFileSync(`${repoRoot}/${file}`, 'utf8'))
    } catch {
      // deleted/unreadable — leave the styled() gate closed
    }

    const categories = [
      { re: TAMAGUI_STYLED_RE, label: 'Tamagui `styled()` call', enabled: hasTamaguiStyledImport },
      { re: TAMAGUI_ANIMATION_RE, label: 'Tamagui animation preset prop', enabled: true },
      { re: TAMAGUI_GROUP_RE, label: 'Tamagui `$group-*` prop', enabled: true },
    ]

    for (const { re, label, enabled } of categories) {
      if (!enabled) {
        continue
      }
      const offendingLines = addedLines.filter((change) => re.test(change.content))
      if (offendingLines.length === 0) {
        continue
      }
      fail(
        `Added ${label} in \`${file}\` — new Tamagui styling is banned (Tamagui → Tailwind migration, INFRA-2958). ` +
          `Use Tailwind via \`@universe/mycelium\` (web) or plain Flex/Text/View layout props instead.\n\n` +
          offendingLines.map((change) => `\`\`\`\n${change.content}\n\`\`\``).join('\n') +
          `\n\nIf this diff only moves already-grandfathered code, say so in the PR and a reviewer can override this check.`,
      )
    }
  }
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

/* Warn about storing credentials in GH  */
const modified_files = danger.git.modified_files.concat(danger.git.created_files)
const envChanged = modified_files.includes('.env')
if (envChanged) {
  warn(
    'No .env files should be committed to the repo. Store configs in the backend Config Service via the parameter manager in Mission Control',
  )
}

// Check locked dependencies
checkLockedDependencies()

// Check native and web file splits
checkSplitFiles()

// Check hook file pattern
checkGeneralizedHookFiles()

// Check hook tests
checkHookFilesHaveTests()

// Run checks on added changes
processAddChanges()

// Check for added Tamagui styling (INFRA-2958). schedule() guarantees Danger
// awaits the async fail()s before reporting.
schedule(checkNewTamaguiStyling)

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
    'You have updated the GraphQL schema. Please ensure that the Swift GraphQL Schema generation is valid by running `bun mobile ios` and rebuilding for iOS. ' +
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
  warn('You updated the migrations file but did not write any new tests. Each migration must have a test!')
}

if (updatedMobileMigrationsFile !== updatedExtensionMigrationsFile) {
  warn(
    'You updated the migrations file in one app but not the other. Make sure to update both migration files if needed.',
  )
}
