import { describe, expect, test } from 'bun:test'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const NOTIFY_ACTION_PATH = join(REPO_ROOT, '.github', 'actions', 'notify_build_result', 'action.yml')
const PUBLISH_ACTION_PATH = join(REPO_ROOT, '.github', 'actions', 'extension_publish', 'action.yml')
const DEV_WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'extension_publish_dev.yml')
const BETA_WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'extension_publish_beta.yml')
const PROD_WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'extension_publish_prod.yml')
const PUBLISH_FAILURE_ACTION_PATH = join(
  REPO_ROOT,
  '.github',
  'actions',
  'extension_notify_publish_failure',
  'action.yml',
)

const ONCALL_SUBTEAM = '<!subteam^S096XP6BGV7>'
const PUBLISH_COMPOSITE = './.github/actions/extension_publish'
const NOTIFY_FAILURE_ACTION = './.github/actions/extension_notify_publish_failure'
const PAYLOAD_PATH = '/tmp/slack-payload.json'
// Deliberately a literal, not read from the workflow: the prod hint and the classifier case must each match it.
const SOFT_UPGRADE_HINT_PREFIX =
  'Chrome Web Store publish succeeded; only the Statsig force_upgrade soft-upgrade config update failed'

interface CompositeAction {
  outputs?: Record<string, { value: string }>
  runs: {
    steps: Array<{
      'continue-on-error'?: boolean
      env?: Record<string, string>
      id?: string
      if?: string
      name?: string
      run?: string
      uses?: string
      with?: Record<string, string>
    }>
  }
}

interface StepResult {
  conclusion?: string
  outcome?: string
  outputs?: Record<string, string>
}

interface Workflow {
  jobs: Record<
    string,
    {
      if?: string
      outputs?: Record<string, string>
      steps: Array<{
        id?: string
        if?: string
        name?: string
        run?: string
        uses?: string
        with?: Record<string, string>
      }>
    }
  >
}

interface SlackBlock {
  elements?: Array<{ text?: string }>
  fields?: Array<{ text?: string }>
  text?: { text?: string }
  type: string
}

interface SlackPayload {
  blocks: SlackBlock[]
  text: string
}

const NOTIFY_ACTION = Bun.YAML.parse(readFileSync(NOTIFY_ACTION_PATH, 'utf8')) as CompositeAction
const PUBLISH_ACTION = Bun.YAML.parse(readFileSync(PUBLISH_ACTION_PATH, 'utf8')) as CompositeAction
const DEV_WORKFLOW = Bun.YAML.parse(readFileSync(DEV_WORKFLOW_PATH, 'utf8')) as Workflow
const BETA_WORKFLOW = Bun.YAML.parse(readFileSync(BETA_WORKFLOW_PATH, 'utf8')) as Workflow
const PROD_WORKFLOW = Bun.YAML.parse(readFileSync(PROD_WORKFLOW_PATH, 'utf8')) as Workflow
const PUBLISH_FAILURE_ACTION = Bun.YAML.parse(readFileSync(PUBLISH_FAILURE_ACTION_PATH, 'utf8')) as CompositeAction
const PROD_DISPATCH_INPUTS =
  (
    Bun.YAML.parse(readFileSync(PROD_WORKFLOW_PATH, 'utf8')) as {
      on?: { workflow_dispatch?: { inputs?: Record<string, { default?: unknown }> } }
    }
  ).on?.workflow_dispatch?.inputs ?? {}
const PUBLISH_FAILURE_INPUTS =
  (
    Bun.YAML.parse(readFileSync(PUBLISH_FAILURE_ACTION_PATH, 'utf8')) as {
      inputs?: Record<string, { default?: string }>
    }
  ).inputs ?? {}

function payloadScript(): string {
  const step = NOTIFY_ACTION.runs.steps.find((candidate) => candidate.name === 'Build Slack payload')
  if (!step?.run) {
    throw new Error('notify_build_result no longer has a "Build Slack payload" step with a run: script')
  }
  if (!step.run.includes(PAYLOAD_PATH)) {
    throw new Error(`the "Build Slack payload" step no longer writes ${PAYLOAD_PATH}`)
  }
  return step.run
}

function buildPayload(env: Record<string, string>): SlackPayload {
  const dir = mkdtempSync(join(tmpdir(), 'notify-build-result-'))
  try {
    const scriptPath = join(dir, 'build-payload.sh')
    const outputPath = join(dir, 'slack-payload.json')
    writeFileSync(scriptPath, payloadScript().replaceAll(PAYLOAD_PATH, outputPath))

    const result = Bun.spawnSync({
      cmd: ['bash', '-eo', 'pipefail', scriptPath],
      env: { PATH: process.env.PATH ?? '', ...env },
      stderr: 'pipe',
      stdout: 'pipe',
    })
    if (result.exitCode !== 0) {
      throw new Error(`classifier exited ${result.exitCode}: ${result.stderr.toString()}`)
    }
    return JSON.parse(readFileSync(outputPath, 'utf8')) as SlackPayload
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}

function devPublishFailureEnv(errorHint: string): Record<string, string> {
  return {
    ACTOR_MENTION: '<@U000000000>',
    ERROR_HINT: errorHint,
    GH_ACTOR: 'hello-happy-puppy',
    GH_JOB: 'publish',
    GH_PR_URL: 'https://github.com/Uniswap/universe/commit/deadbeef',
    GH_REF_NAME: 'releases/extension/dev',
    GH_RUN_ATTEMPT: '1',
    GH_TRIGGERING_ACTOR: 'hello-happy-puppy',
    GH_WORKFLOW_URL: 'https://github.com/Uniswap/universe/actions/runs/1',
    INPUT_ACTION_NAME: 'Publish',
    INPUT_APP_EMOJI: '🔌',
    INPUT_APP_NAME: 'Extension',
    INPUT_BUILD_NUMBER: '42',
    INPUT_ENVIRONMENT: 'dev',
    INPUT_STATUS: 'failed',
    INPUT_VERSION: '1.2.3.42',
  }
}

function headerText(payload: SlackPayload): string {
  return payload.blocks.find((block) => block.type === 'header')?.text?.text ?? ''
}

function allText(payload: SlackPayload): string {
  return JSON.stringify(payload)
}

describe('notify_build_result classification', () => {
  test('a pending CWS review is a known issue and does not page oncall', () => {
    const payload = buildPayload(devPublishFailureEnv('ITEM_NOT_UPDATABLE - pending CWS review'))

    expect(headerText(payload)).toContain('[CWS REVIEW]')
    expect(allText(payload)).toContain('Known issue — likely does not need investigation')
    expect(allText(payload)).not.toContain(ONCALL_SUBTEAM)
  })

  // Pins the other half: without it the case above would also pass if nothing paged any more.
  test('an unclassified hint on the same run still pages oncall', () => {
    const payload = buildPayload(devPublishFailureEnv('Dev publish job failure.'))

    expect(headerText(payload)).toContain('[BUILD]')
    expect(allText(payload)).toContain(ONCALL_SUBTEAM)
  })

  test('a soft-upgrade failure after a successful upload is labelled as such and still pages', () => {
    const payload = buildPayload({
      ...devPublishFailureEnv(
        `${SOFT_UPGRADE_HINT_PREFIX}: Error: force_upgrade rule not found: "Soft Upgrade - Mobile Prod/Beta"`,
      ),
      GH_REF_NAME: 'releases/extension/1.86.0',
      INPUT_ACTION_NAME: 'Statsig Config Update',
      INPUT_ENVIRONMENT: 'prod',
    })

    expect(headerText(payload)).toBe('❌ Extension Statsig Config Update Failed [SOFT UPGRADE]')
    expect(allText(payload)).toContain('*Action:* Statsig Config Update')
    expect(allText(payload)).not.toContain('Publish Failed')
    expect(allText(payload)).toContain(
      'only the post-publish Statsig force_upgrade soft-upgrade threshold update failed',
    )
    expect(allText(payload)).not.toContain('Known issue')
    expect(allText(payload)).toContain(ONCALL_SUBTEAM)
  })

  test('CLI error text inside the soft-upgrade hint cannot reclassify it', () => {
    const payload = buildPayload(devPublishFailureEnv(`${SOFT_UPGRADE_HINT_PREFIX}: ITEM_NOT_UPDATABLE pending review`))

    expect(headerText(payload)).toContain('[SOFT UPGRADE]')
    expect(allText(payload)).not.toContain('Known issue')
  })

  test('the soft-upgrade class needs the hint to start with the prefix, not merely contain it', () => {
    const payload = buildPayload(devPublishFailureEnv(`upload log: ${SOFT_UPGRADE_HINT_PREFIX}`))

    expect(headerText(payload)).toContain('[BUILD]')
  })
})

describe('extension dev publish notification wiring', () => {
  // The hint is attacker-influenceable CWS output; interpolated into a run: body it becomes a command-injection sink.
  test('the error hint reaches the classifier via env:, not run: interpolation', () => {
    const step = NOTIFY_ACTION.runs.steps.find((candidate) => candidate.name === 'Build Slack payload')

    expect(step?.env?.ERROR_HINT).toBe('${{ inputs.error-hint }}')
    expect(step?.run).toContain('"$ERROR_HINT"')

    // Every run: body, so a step added here later cannot reintroduce the sink.
    for (const candidate of NOTIFY_ACTION.runs.steps) {
      if (candidate.run === undefined) {
        continue
      }
      expect(candidate.run).not.toContain('${{')
    }
  })

  // Same payload, second consumer: notify-failure now forwards the captured CWS output through this action.
  test('extension_notify_publish_failure forwards the hint without interpolating it into a run:', () => {
    const steps = PUBLISH_FAILURE_ACTION.runs.steps

    const forwarder = steps.find((candidate) => candidate.uses === './.github/actions/notify_build_result')
    expect(forwarder?.with?.['error-hint']).toBe('${{ inputs.error-hint }}')
    // A `uses:` step has no shell, so the value cannot reach a command line.
    expect(forwarder?.run).toBeUndefined()

    for (const candidate of steps) {
      if (candidate.run === undefined) {
        continue
      }
      expect(candidate.run).not.toContain('inputs.error-hint')
      expect(candidate.run).not.toContain('${{')
    }
  })

  test('extension_publish keeps the captured CWS output out of every run: body', () => {
    const shellSteps = PUBLISH_ACTION.runs.steps.filter((candidate) => candidate.run !== undefined)

    expect(shellSteps.length).toBeGreaterThan(0)
    for (const candidate of shellSteps) {
      expect(candidate.run).not.toContain('${{')
    }
  })

  test('extension_publish reports notified last, so the flag means a card was posted', () => {
    const steps = PUBLISH_ACTION.runs.steps
    const reportIndex = steps.findIndex((step) => step.id === 'notification-result')
    const notifierIds = steps
      .filter((step) => step.uses === './.github/actions/notify_build_result')
      .map((step) => step.id ?? '')

    expect(reportIndex).toBe(steps.length - 1)
    expect(notifierIds.length).toBeGreaterThan(0)
    expect(steps[reportIndex]?.if).toContain('!cancelled()')
    expect(PUBLISH_ACTION.outputs?.notified?.value).toContain('steps.notification-result.outputs.notified')
    expect(PUBLISH_ACTION.outputs?.['error-hint']?.value).toContain('steps.notification-result.outputs.error-hint')

    // The notifier's own outcome is success even when Slack rejected the card (continue-on-error on its send step),
    // so only `sent` can report a delivery that did not happen and keep the caller's fallback alerting.
    const notified = steps[reportIndex]?.env?.NOTIFIED ?? ''
    for (const id of notifierIds) {
      expect(notified).toContain(`steps.${id}.outputs.sent == 'success'`)
      expect(notified).not.toContain(`steps.${id}.outcome == 'success'`)
    }
  })
})

function resolveStepsReference(path: string, steps: Record<string, StepResult>): string {
  const [root, stepId, field, outputName] = path.split('.')
  if (root !== 'steps' || stepId === undefined) {
    throw new Error(`unsupported reference '${path}'`)
  }

  // A step that never ran resolves to the empty string, not an error.
  const step = steps[stepId]
  if (step === undefined) {
    return ''
  }
  if (field === 'outcome') {
    return step.outcome ?? ''
  }
  if (field === 'conclusion') {
    return step.conclusion ?? ''
  }
  if (field === 'outputs' && outputName !== undefined) {
    return step.outputs?.[outputName] ?? ''
  }
  throw new Error(`unsupported reference '${path}'`)
}

function expressionBody(expression: string): string {
  const match = /^\$\{\{(.*)\}\}$/s.exec(expression.trim())
  if (!match?.[1]) {
    throw new Error(`not a single GitHub expression: '${expression}'`)
  }
  return match[1].trim()
}

function evaluateNotified(expression: string, steps: Record<string, StepResult>): boolean {
  return expressionBody(expression)
    .split('||')
    .some((clause) => {
      const [left, right, ...rest] = clause.split('==').map((side) => side.trim())
      if (left === undefined || right === undefined || rest.length > 0) {
        throw new Error(`unsupported clause '${clause}' — the notified derivation changed shape`)
      }
      const literal = /^'(.*)'$/.exec(right)
      if (!literal) {
        throw new Error(`expected a quoted literal in '${clause}'`)
      }
      return resolveStepsReference(left, steps) === literal[1]
    })
}

function slackSendStep(): CompositeAction['runs']['steps'][number] {
  const step = NOTIFY_ACTION.runs.steps.find((candidate) => candidate.uses?.startsWith('slackapi/slack-github-action'))
  if (!step) {
    throw new Error('notify_build_result no longer posts via slackapi/slack-github-action')
  }
  return step
}

// continue-on-error masks the send failure, so the caller always sees a successful step and only the declared outputs carry the real result.
function notifierStepResult(sendOutcome: string): StepResult {
  const sendId = slackSendStep().id
  const sendContext: Record<string, StepResult> =
    sendId === undefined ? {} : { [sendId]: { conclusion: 'success', outcome: sendOutcome } }

  const outputs: Record<string, string> = {}
  for (const [name, output] of Object.entries(NOTIFY_ACTION.outputs ?? {})) {
    if (!output.value.includes('steps.')) {
      continue
    }
    outputs[name] = resolveStepsReference(expressionBody(output.value), sendContext)
  }

  return { conclusion: 'success', outcome: 'success', outputs }
}

describe('extension_publish notified survives a rejected Slack post', () => {
  function notified(results: Record<string, StepResult>): boolean {
    const report = PUBLISH_ACTION.runs.steps.find((step) => step.id === 'notification-result')
    const expression = report?.env?.NOTIFIED
    if (expression === undefined) {
      throw new Error('extension_publish no longer derives NOTIFIED on the notification-result step')
    }
    return evaluateNotified(expression, results)
  }

  test('a webhook that rejects the post reports notified=false, so the caller still alerts', () => {
    expect(notified({ 'notify-build-result': notifierStepResult('failure') })).toBe(false)
    expect(notified({ 'notify-cws-pending': notifierStepResult('failure') })).toBe(false)
  })

  test('an accepted post reports notified=true, so the caller posts no second card', () => {
    expect(notified({ 'notify-build-result': notifierStepResult('success') })).toBe(true)
    expect(notified({ 'notify-cws-pending': notifierStepResult('success') })).toBe(true)
  })

  test('a notifier that reported nothing reports notified=false', () => {
    // A skipped notifier and a vanished output must both cost a duplicate card, never silence.
    expect(notified({})).toBe(false)
    expect(notified({ 'notify-build-result': { conclusion: 'success', outcome: 'success', outputs: {} } })).toBe(false)
  })

  test('the notifier exposes the send step outcome, not the conclusion continue-on-error rewrites', () => {
    const sendStep = slackSendStep()

    expect(sendStep['continue-on-error']).toBe(true)
    expect(sendStep.id).toBeDefined()
    expect(NOTIFY_ACTION.outputs?.sent?.value).toBe(`\${{ steps.${sendStep.id}.outcome }}`)
    expect(notifierStepResult('failure').outputs?.sent).toBe('failure')
  })
})

function cwsUploadScript(): string {
  const step = PUBLISH_ACTION.runs.steps.find((candidate) => candidate.name === 'Upload build to chrome webstore')
  if (!step?.run) {
    throw new Error('extension_publish no longer has an "Upload build to chrome webstore" step with a run: script')
  }
  return step.run
}

function parseGithubEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {}
  const lines = contents.split('\n')
  if (lines.at(-1) === '') {
    lines.pop()
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (line === '') {
      continue
    }

    const heredoc = line.indexOf('<<')
    if (heredoc > 0) {
      const key = line.slice(0, heredoc)
      const delimiter = line.slice(heredoc + 2)
      const body: string[] = []
      let closed = false
      for (index = index + 1; index < lines.length; index++) {
        if (lines[index] === delimiter) {
          closed = true
          break
        }
        body.push(lines[index] ?? '')
      }
      if (!closed) {
        // The runner's own failure: "Invalid value. Matching delimiter not found".
        throw new Error(`Matching delimiter not found '${delimiter}'`)
      }
      parsed[key] = body.join('\n')
      continue
    }

    const equals = line.indexOf('=')
    if (equals < 0) {
      throw new Error(`Invalid format '${line}'`)
    }
    parsed[line.slice(0, equals)] = line.slice(equals + 1)
  }

  return parsed
}

function runCwsUploadStep(stubOutput: string): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), 'cws-upload-'))
  try {
    const stubDir = join(dir, 'bin')
    mkdirSync(stubDir)

    // The payload goes through a file so nothing is re-escaped on the way in.
    const payloadPath = join(dir, 'cws-output')
    writeFileSync(payloadPath, stubOutput)

    const stubPath = join(stubDir, 'chrome-webstore-upload')
    // Fail, so the step takes the generic non-zero branch that writes the heredoc.
    writeFileSync(stubPath, `#!/bin/bash\ncat ${JSON.stringify(payloadPath)} >&2\nexit 1\n`)
    chmodSync(stubPath, 0o755)

    const scriptPath = join(dir, 'cws-upload.sh')
    writeFileSync(scriptPath, cwsUploadScript())
    const envPath = join(dir, 'github-env')
    writeFileSync(envPath, '')

    const result = Bun.spawnSync({
      cmd: ['bash', '-eo', 'pipefail', scriptPath],
      env: {
        GITHUB_ENV: envPath,
        GITHUB_SHA: 'deadbeef',
        PATH: `${stubDir}:${process.env.PATH ?? ''}`,
      },
      stderr: 'pipe',
      stdout: 'pipe',
    })
    // The stub always fails, so the step must propagate exactly that; any other code is the script dying before it wrote the hint.
    if (result.exitCode !== 1) {
      throw new Error(`cws upload step exited ${result.exitCode}: ${result.stderr.toString()}`)
    }

    return parseGithubEnvFile(readFileSync(envPath, 'utf8'))
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}

describe('extension_publish CWS_ERROR_HINT writer', () => {
  test('a payload truncated mid-line still produces a parseable heredoc block', () => {
    // No newline anywhere near byte 1000, so head -c cuts inside the line — what used to leave the delimiter unterminated.
    const payload = `Upload failed: ${'A'.repeat(1200)}\nITEM_ERROR: trailing line\n`

    const parsed = runCwsUploadStep(payload)

    expect(parsed.CWS_ERROR_HINT).toBeDefined()
    expect(parsed.CWS_ERROR_HINT).toBe(payload.slice(0, 1000))
    expect(parsed.CWS_ERROR_HINT).not.toContain('EOFHINT')
  })

  test('a short multiline payload round-trips unchanged', () => {
    const payload = 'Upload failed: quota exceeded\nITEM_ERROR: try again later'

    const parsed = runCwsUploadStep(payload)

    expect(parsed.CWS_ERROR_HINT).toBe(payload)
  })

  test('the writer guards the delimiter the payload could otherwise close', () => {
    // The delimiter is randomized per invocation, so no payload can contain it — only the script can show the case is handled.
    expect(cwsUploadScript()).toContain('*"$HINT_DELIM"*)')
  })
})

describe('extension publish notified contract across callers', () => {
  // Expected per workflow from one precondition rather than a hardcoded list. The composite reads `job.status` as it
  // stands when it runs, so a later step (or a post step) can fail and leave notified=true on a failed job; the
  // notified guard is only safe where the composite is last, or where a successful composite re-opens the gate.
  for (const [name, workflow] of [
    ['dev', DEV_WORKFLOW],
    ['beta', BETA_WORKFLOW],
    ['prod', PROD_WORKFLOW],
  ] as const) {
    test(`the ${name} notify-failure job gates on notified only when a failure after the composite still alerts`, () => {
      const publishJob = workflow.jobs.publish
      const steps = publishJob?.steps ?? []
      expect(steps.length).toBeGreaterThan(0)

      const compositeIndex = steps.findIndex((step) => step.uses === PUBLISH_COMPOSITE)
      expect(compositeIndex).toBeGreaterThanOrEqual(0)
      const condition = workflow.jobs['notify-failure']?.if ?? ''

      const compositeLast = compositeIndex === steps.length - 1
      const reopensOnCompositeSuccess =
        publishJob?.outputs?.['publish-outcome'] === '${{ steps.publish.outcome }}' &&
        condition.includes("needs.publish.outputs.publish-outcome == 'success'")

      if (compositeLast || reopensOnCompositeSuccess) {
        expect(publishJob?.outputs?.notified).toContain('steps.publish.outputs.notified')
        expect(steps[compositeIndex]?.id).toBe('publish')
        expect(condition).toContain("needs.publish.outputs.notified != 'true'")

        // On the guarded path this job is the only card left, so it must reuse the composite's classification rather than a literal.
        expect(publishJob?.outputs?.['error-hint']).toContain('steps.publish.outputs.error-hint')
        const notifier = workflow.jobs['notify-failure']?.steps.find((step) => step.uses === NOTIFY_FAILURE_ACTION)
        expect(notifier?.with?.['error-hint']).toContain('needs.publish.outputs.error-hint')
      } else {
        expect(condition).not.toContain('notified')
      }

      // Publish-skipped paths stay unguarded everywhere: the composite never runs there.
      expect(condition).toContain("needs.build.result == 'failure'")
    })
  }

  test('dev and beta keep the Publish title', () => {
    for (const workflow of [DEV_WORKFLOW, BETA_WORKFLOW]) {
      const other = workflow.jobs['notify-failure']?.steps.find((step) => step.uses === NOTIFY_FAILURE_ACTION)
      expect(other?.with?.['action-name']).toBeUndefined()
    }
  })

  test('extension_notify_publish_failure forwards action-name and defaults it to Publish', () => {
    const forwarder = PUBLISH_FAILURE_ACTION.runs.steps.find(
      (step) => step.uses === './.github/actions/notify_build_result',
    )

    expect(forwarder?.with?.['action-name']).toBe('${{ inputs.action-name }}')
    expect(PUBLISH_FAILURE_INPUTS['action-name']?.default).toBe('Publish')
  })

  test('the composite cards are still titled Publish', () => {
    const notifiers = PUBLISH_ACTION.runs.steps.filter((step) => step.uses === './.github/actions/notify_build_result')

    expect(notifiers.length).toBeGreaterThan(0)
    for (const step of notifiers) {
      expect(step.with?.['action-name']).toBe('Publish')
    }
  })

  test('the classifier matches the prefix the prod soft-upgrade hint starts with', () => {
    expect(payloadScript()).toContain(`"${SOFT_UPGRADE_HINT_PREFIX}"*)`)
  })
})

// --- A small evaluator for the GitHub expression subset these workflows use, so the scenario table below runs the
// real `if:` / `with:` expressions instead of matching their text.

type ExprValue = string | number | boolean | null
type ExprContext = Record<string, unknown>

function exprTruthy(value: ExprValue): boolean {
  return value !== null && value !== false && value !== '' && value !== 0 && !Number.isNaN(value)
}

function exprNumber(value: ExprValue): number {
  if (value === null) {
    return 0
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  if (typeof value === 'number') {
    return value
  }
  return value.trim() === '' ? 0 : Number(value)
}

// Strings compare case-insensitively; mixed types coerce to numbers.
function exprEquals(left: ExprValue, right: ExprValue): boolean {
  if (typeof left === 'string' && typeof right === 'string') {
    return left.toLowerCase() === right.toLowerCase()
  }
  if (typeof left === typeof right) {
    return left === right
  }
  return exprNumber(left) === exprNumber(right)
}

function exprToString(value: ExprValue): string {
  return value === null ? '' : String(value)
}

function tokenizeExpression(source: string): string[] {
  const tokens: string[] = []
  let index = 0
  while (index < source.length) {
    const char = source[index] ?? ''
    if (/\s/.test(char)) {
      index++
      continue
    }
    const two = source.slice(index, index + 2)
    if (['&&', '||', '==', '!='].includes(two)) {
      tokens.push(two)
      index += 2
      continue
    }
    if ('()!,'.includes(char)) {
      tokens.push(char)
      index++
      continue
    }
    if (char === "'") {
      let end = index + 1
      let text = ''
      while (end < source.length) {
        if (source[end] === "'" && source[end + 1] === "'") {
          text += "'"
          end += 2
          continue
        }
        if (source[end] === "'") {
          break
        }
        text += source[end]
        end++
      }
      if (end >= source.length) {
        throw new Error(`unterminated string in '${source}'`)
      }
      tokens.push(`'${text}`)
      index = end + 1
      continue
    }
    const word = /^[A-Za-z_][\w.-]*/.exec(source.slice(index))
    if (!word) {
      throw new Error(`unexpected '${char}' in '${source}'`)
    }
    tokens.push(word[0])
    index += word[0].length
  }
  return tokens
}

function evaluateExpression(source: string, context: ExprContext): ExprValue {
  const tokens = tokenizeExpression(source)
  let position = 0
  const peek = (): string | undefined => tokens[position]
  const take = (expected?: string): string => {
    const token = tokens[position++]
    if (token === undefined || (expected !== undefined && token !== expected)) {
      throw new Error(`expected '${expected ?? 'a token'}' at ${position} in '${source}'`)
    }
    return token
  }

  const resolve = (path: string): ExprValue => {
    let current: unknown = context
    for (const part of path.split('.')) {
      if (current === null || typeof current !== 'object') {
        return null
      }
      current = (current as Record<string, unknown>)[part]
    }
    if (current === undefined) {
      return null
    }
    if (
      typeof current === 'string' ||
      typeof current === 'number' ||
      typeof current === 'boolean' ||
      current === null
    ) {
      return current
    }
    throw new Error(`'${path}' resolves to an object`)
  }

  const call = (name: string, args: ExprValue[]): ExprValue => {
    const status = exprToString(resolve('job.status'))
    switch (name) {
      case 'always':
        return true
      case 'cancelled':
        return status === 'cancelled'
      case 'success':
        return status === 'success'
      case 'failure':
        return status === 'failure'
      case 'format': {
        const [template, ...rest] = args
        return exprToString(template ?? null).replace(/\{(\d+)\}/g, (_, i: string) =>
          exprToString(rest[Number(i)] ?? null),
        )
      }
      default:
        throw new Error(`unsupported function ${name}()`)
    }
  }

  const primary = (): ExprValue => {
    const token = take()
    if (token === '(') {
      const value = or()
      take(')')
      return value
    }
    if (token.startsWith("'")) {
      return token.slice(1)
    }
    if (token === 'true' || token === 'false') {
      return token === 'true'
    }
    if (token === 'null') {
      return null
    }
    if (peek() === '(') {
      take('(')
      const args: ExprValue[] = []
      while (peek() !== ')') {
        args.push(or())
        if (peek() === ',') {
          take(',')
        }
      }
      take(')')
      return call(token, args)
    }
    return resolve(token)
  }
  const unary = (): ExprValue => {
    if (peek() === '!') {
      take('!')
      return !exprTruthy(unary())
    }
    return primary()
  }
  const equality = (): ExprValue => {
    const left = unary()
    const operator = peek()
    if (operator === '==' || operator === '!=') {
      take()
      const equal = exprEquals(left, unary())
      return operator === '==' ? equal : !equal
    }
    return left
  }
  const and = (): ExprValue => {
    let left = equality()
    while (peek() === '&&') {
      take()
      const right = equality()
      left = exprTruthy(left) ? right : left
    }
    return left
  }
  const or = (): ExprValue => {
    let left = and()
    while (peek() === '||') {
      take()
      const right = and()
      left = exprTruthy(left) ? left : right
    }
    return left
  }

  const value = or()
  if (position !== tokens.length) {
    throw new Error(`trailing tokens in '${source}'`)
  }
  return value
}

/** A `with:`/`env:`/`outputs:` value: a single `${{ }}` keeps its type, anything else interpolates to a string. */
function evaluateValue(raw: string | undefined, context: ExprContext): ExprValue {
  if (raw === undefined) {
    return null
  }
  const whole = /^\s*\$\{\{([\s\S]*)\}\}\s*$/.exec(raw)
  if (whole && !whole[1]?.includes('}}')) {
    return evaluateExpression(whole[1] ?? '', context)
  }
  return raw.replace(/\$\{\{([\s\S]*?)\}\}/g, (_, body: string) => exprToString(evaluateExpression(body, context)))
}

/** An `if:` — the runner prepends success() when no status function is present. */
function evaluateIf(raw: string | undefined, context: ExprContext): boolean {
  if (raw === undefined) {
    return exprTruthy(evaluateExpression('success()', context))
  }
  const body = /^\s*\$\{\{([\s\S]*)\}\}\s*$/.exec(raw)?.[1] ?? raw
  const guarded = /\b(always|success|failure|cancelled)\(\)/.test(body) ? body : `success() && (${body})`
  return exprTruthy(evaluateExpression(guarded, context))
}

describe('GitHub expression evaluator', () => {
  test('follows the runner semantics the workflows rely on', () => {
    const context = { needs: { a: { result: 'failure', outputs: {} } }, job: { status: 'success' } }

    expect(evaluateExpression("needs.a.result == 'FAILURE'", context)).toBe(true)
    expect(evaluateExpression("needs.a.outputs.missing != 'true'", context)).toBe(true)
    expect(evaluateExpression("needs.a.outputs.missing || 'fallback'", context)).toBe('fallback')
    expect(evaluateExpression("false && 'x' || 'y'", context)).toBe('y')
    expect(evaluateExpression("format('a {0} c', 'b')", context)).toBe('a b c')
    expect(evaluateExpression("'it''s'", context)).toBe("it's")
    expect(evaluateIf('${{ true }}', { job: { status: 'failure' } })).toBe(false)
    expect(evaluateIf('${{ always() }}', { job: { status: 'failure' } })).toBe(true)
  })
})

// --- Scenario table: every way the prod publish workflow can end, simulated through the real YAML.

type CompositeFailure = 'none' | 'before-notify' | 'cws-upload' | 'pending-review' | 'report-step'

interface PublishScenario {
  build?: 'success' | 'failure' | 'cancelled'
  e2eGate?: 'success' | 'failure' | 'cancelled'
  /** checkout / install, before the composite runs */
  beforeComposite?: 'success' | 'failure' | 'cancelled'
  composite?: CompositeFailure
  slackAccepts?: boolean
  updateSoftUpgrade?: boolean
  softUpgrade?: 'success' | 'failure' | 'cancelled'
  postStepFails?: boolean
}

interface Card {
  title: string
  action: string
  hint: string
  pagesOncall: boolean
  delivered: boolean
}

const CWS_UPLOAD_ERROR = 'Upload failed: 500 Internal Server Error'
const SOFT_UPGRADE_ERROR = 'Error: force_upgrade rule not found: "Soft Upgrade - Mobile Prod / Beta"'

function renderCard(input: { status: string; action: string; hint: string; job: string; delivered: boolean }): Card {
  const payload = buildPayload({
    ...devPublishFailureEnv(input.hint),
    GH_JOB: input.job,
    GH_REF_NAME: 'releases/extension/1.86.0',
    GH_TRIGGERING_ACTOR: 'release-owner',
    INPUT_ACTION_NAME: input.action,
    INPUT_ENVIRONMENT: 'prod',
    INPUT_STATUS: input.status,
  })
  return {
    title: headerText(payload),
    action: input.action,
    hint: input.hint,
    pagesOncall: allText(payload).includes(ONCALL_SUBTEAM),
    delivered: input.delivered,
  }
}

function step<T extends { id?: string; name?: string; uses?: string }>(steps: T[], predicate: (step: T) => boolean): T {
  const found = steps.find(predicate)
  if (!found) {
    throw new Error('expected step is missing')
  }
  return found
}

function simulateProdPublish(scenario: PublishScenario): Card[] {
  const {
    build = 'success',
    e2eGate = 'success',
    beforeComposite = 'success',
    composite = 'none',
    slackAccepts = true,
    updateSoftUpgrade = true,
    softUpgrade = 'success',
    postStepFails = false,
  } = scenario
  const cards: Card[] = []
  const publishJob = PROD_WORKFLOW.jobs.publish
  if (!publishJob) {
    throw new Error('prod workflow has no publish job')
  }

  const e2eResult = build === 'success' ? e2eGate : 'skipped'
  const publishRuns = build === 'success' && e2eResult === 'success'
  const steps: Record<string, StepResult> = {}
  let publishResult = 'skipped'

  if (publishRuns) {
    let jobStatus = beforeComposite
    const compositeStep = step(publishJob.steps, (candidate) => candidate.uses === PUBLISH_COMPOSITE)
    const compositeRuns = evaluateIf(compositeStep.if, { job: { status: jobStatus } })

    if (compositeRuns) {
      // Inside the composite: failure modes set the status its notifiers read.
      const env: Record<string, string> = {}
      if (composite === 'pending-review') {
        env.CWS_PENDING_REVIEW = 'true'
        env.CWS_ERROR_HINT = 'ITEM_NOT_UPDATABLE - pending CWS review'
      } else if (composite === 'cws-upload') {
        env.CWS_ERROR_HINT = CWS_UPLOAD_ERROR
      }
      const compositeStatus = composite === 'none' || composite === 'report-step' ? 'success' : 'failure'
      const inner = PUBLISH_ACTION.runs.steps
      const innerResults: Record<string, StepResult> = {}
      for (const notifier of inner.filter((candidate) => candidate.uses === './.github/actions/notify_build_result')) {
        const context = { env, inputs: { 'build-env': 'prod' }, job: { status: compositeStatus } }
        if (!evaluateIf(notifier.if, context)) {
          continue
        }
        cards.push(
          renderCard({
            status: exprToString(evaluateValue(notifier.with?.status, context)),
            action: exprToString(evaluateValue(notifier.with?.['action-name'], context)),
            hint: exprToString(evaluateValue(notifier.with?.['error-hint'], context)),
            job: 'publish',
            delivered: slackAccepts,
          }),
        )
        innerResults[notifier.id ?? ''] = { outputs: { sent: slackAccepts ? 'success' : 'failure' } }
      }

      const report = step(inner, (candidate) => candidate.id === 'notification-result')
      const compositeOutputs: Record<string, string> = {}
      if (composite !== 'report-step' && evaluateIf(report.if, { job: { status: compositeStatus } })) {
        compositeOutputs.notified = exprToString(
          evaluateValue(report.env?.NOTIFIED, { steps: innerResults, job: { status: compositeStatus } }),
        )
        compositeOutputs['error-hint'] = env.CWS_ERROR_HINT ?? ''
      }
      const compositeOutcome = composite === 'none' ? 'success' : 'failure'
      steps.publish = { outcome: compositeOutcome, conclusion: compositeOutcome, outputs: compositeOutputs }
      jobStatus = compositeOutcome
    }

    const softUpgradeStep = step(publishJob.steps, (candidate) => candidate.id === 'soft-upgrade')
    const softUpgradeContext = { inputs: { update_soft_upgrade: updateSoftUpgrade }, job: { status: jobStatus } }
    if (jobStatus !== 'cancelled' && evaluateIf(softUpgradeStep.if, softUpgradeContext)) {
      steps['soft-upgrade'] = {
        outcome: softUpgrade,
        conclusion: softUpgrade,
        outputs: softUpgrade === 'failure' ? { error: SOFT_UPGRADE_ERROR } : {},
      }
      jobStatus = softUpgrade
    } else {
      steps['soft-upgrade'] = { outcome: 'skipped', conclusion: 'skipped', outputs: {} }
    }

    if (postStepFails && jobStatus === 'success') {
      jobStatus = 'failure'
    }
    publishResult = jobStatus
  }

  // Job outputs are evaluated when the job ends, against whatever its steps produced.
  const publishOutputs: Record<string, string> = {}
  if (publishRuns) {
    for (const [name, raw] of Object.entries(publishJob.outputs ?? {})) {
      publishOutputs[name] = exprToString(
        evaluateValue(raw, {
          steps: Object.fromEntries(
            Object.entries(steps).map(([id, result]) => [id, { ...result, outputs: result.outputs ?? {} }]),
          ),
        }),
      )
    }
  }

  const needs = {
    build: { result: build, outputs: {} },
    'e2e-gate': { result: e2eResult, outputs: {} },
    publish: { result: publishResult, outputs: publishOutputs },
  }
  const notifyJob = PROD_WORKFLOW.jobs['notify-failure']
  const runStatus = [build, e2eResult, publishResult].includes('cancelled') ? 'cancelled' : 'success'
  if (evaluateIf(notifyJob?.if, { needs, job: { status: runStatus } })) {
    const notifier = step(notifyJob?.steps ?? [], (candidate) => candidate.uses === NOTIFY_FAILURE_ACTION)
    const context = { needs, vars: {}, secrets: {} }
    const inputs: Record<string, string> = {}
    for (const [name, spec] of Object.entries(PUBLISH_FAILURE_INPUTS)) {
      const raw = notifier.with?.[name]
      inputs[name] = raw === undefined ? (spec.default ?? '') : exprToString(evaluateValue(raw, context))
    }
    const forwarder = step(
      PUBLISH_FAILURE_ACTION.runs.steps,
      (candidate) => candidate.uses === './.github/actions/notify_build_result',
    )
    cards.push(
      renderCard({
        status: exprToString(evaluateValue(forwarder.with?.status, { inputs })),
        action: exprToString(evaluateValue(forwarder.with?.['action-name'], { inputs })),
        hint: exprToString(evaluateValue(forwarder.with?.['error-hint'], { inputs })),
        job: 'notify-failure',
        delivered: true,
      }),
    )
  }
  return cards
}

describe('extension_publish_prod: the cards every outcome produces', () => {
  const SKIPPED_UPLOAD = 'the Chrome Web Store upload was SKIPPED'
  const cases: Array<{ name: string; scenario: PublishScenario; cards: Array<Partial<Card>> }> = [
    {
      name: '1. build fails',
      scenario: { build: 'failure' },
      cards: [
        {
          title: '❌ Extension Publish Failed [BUILD]',
          hint: `Build failed — ${SKIPPED_UPLOAD}, no prod build shipped.`,
          pagesOncall: true,
        },
      ],
    },
    {
      name: '2. e2e publish gate fails',
      scenario: { e2eGate: 'failure' },
      cards: [{ title: '❌ Extension Publish Failed [BUILD]', pagesOncall: true }],
    },
    {
      name: '3. a step before the composite fails',
      scenario: { beforeComposite: 'failure' },
      cards: [{ title: '❌ Extension Publish Failed [BUILD]', hint: 'Prod publish job failure.', pagesOncall: true }],
    },
    {
      name: '4. CWS upload fails',
      scenario: { composite: 'cws-upload' },
      cards: [{ title: '❌ Extension Publish Failed [BUILD]', hint: CWS_UPLOAD_ERROR, pagesOncall: true }],
    },
    {
      name: '4b. CWS upload fails and Slack rejects the composite card',
      scenario: { composite: 'cws-upload', slackAccepts: false },
      cards: [
        { title: '❌ Extension Publish Failed [BUILD]', delivered: false },
        { title: '❌ Extension Publish Failed [BUILD]', hint: CWS_UPLOAD_ERROR, pagesOncall: true, delivered: true },
      ],
    },
    {
      name: '5. CWS has a pending review',
      scenario: { composite: 'pending-review' },
      cards: [{ title: 'ℹ️ Extension Publish Info [CWS REVIEW]', pagesOncall: false }],
    },
    {
      name: '6a. a composite step before its notifier fails',
      scenario: { composite: 'before-notify' },
      cards: [{ title: '❌ Extension Publish Failed', hint: '', pagesOncall: true }],
    },
    {
      name: '6b. the composite fails after posting Success',
      scenario: { composite: 'report-step' },
      cards: [
        { title: '✅ Extension Publish Success', pagesOncall: false },
        { title: '❌ Extension Publish Failed [BUILD]', hint: 'Prod publish job failure.', pagesOncall: true },
      ],
    },
    {
      name: '7. soft-upgrade fails after a successful upload',
      scenario: { softUpgrade: 'failure' },
      cards: [
        { title: '✅ Extension Publish Success', pagesOncall: false },
        {
          title: '❌ Extension Statsig Config Update Failed [SOFT UPGRADE]',
          action: 'Statsig Config Update',
          hint: `${SOFT_UPGRADE_HINT_PREFIX}: ${SOFT_UPGRADE_ERROR}`,
          pagesOncall: true,
        },
      ],
    },
    {
      name: '7b. soft-upgrade fails and Slack rejected the Success card',
      scenario: { softUpgrade: 'failure', slackAccepts: false },
      cards: [
        { title: '✅ Extension Publish Success', delivered: false },
        { title: '❌ Extension Statsig Config Update Failed [SOFT UPGRADE]', pagesOncall: true },
      ],
    },
    {
      name: '8. soft-upgrade unchecked, everything green',
      scenario: { updateSoftUpgrade: false },
      cards: [{ title: '✅ Extension Publish Success', pagesOncall: false }],
    },
    {
      name: '8b. soft-upgrade succeeds',
      scenario: {},
      cards: [{ title: '✅ Extension Publish Success', pagesOncall: false }],
    },
    {
      name: '9. a post step fails after a successful publish',
      scenario: { postStepFails: true },
      cards: [
        { title: '✅ Extension Publish Success', pagesOncall: false },
        {
          title: '❌ Extension Post-publish Step Failed [BUILD]',
          action: 'Post-publish Step',
          hint: 'Chrome Web Store publish succeeded; a later step in the publish job failed — see the job log.',
          pagesOncall: true,
        },
      ],
    },
    {
      name: '9b. a post step fails with soft-upgrade unchecked',
      scenario: { postStepFails: true, updateSoftUpgrade: false },
      cards: [{ title: '✅ Extension Publish Success' }, { title: '❌ Extension Post-publish Step Failed [BUILD]' }],
    },
    {
      name: '10a. cancelled before the composite',
      scenario: { beforeComposite: 'cancelled' },
      cards: [],
    },
    {
      name: '10b. cancelled during soft-upgrade',
      scenario: { softUpgrade: 'cancelled' },
      cards: [{ title: '✅ Extension Publish Success' }],
    },
    {
      name: '10c. build cancelled',
      scenario: { build: 'cancelled' },
      cards: [],
    },
  ]

  for (const { name, scenario, cards } of cases) {
    test(name, () => {
      const actual = simulateProdPublish(scenario)
      expect(actual.length).toBe(cards.length)
      cards.forEach((expected, index) => {
        expect(actual[index]).toMatchObject(expected)
      })
    })
  }

  test('the soft-upgrade bump is opt-in: a dispatch with the defaults writes nothing to Statsig', () => {
    const dispatchDefault = PROD_DISPATCH_INPUTS.update_soft_upgrade?.default

    expect(dispatchDefault).toBe(false)
    const cards = simulateProdPublish({ updateSoftUpgrade: dispatchDefault === true, softUpgrade: 'failure' })
    expect(cards.map((card) => card.title)).toEqual(['✅ Extension Publish Success'])
  })

  // 11: the soft-upgrade step carries an implicit success(), so it never runs after the composite failed.
  test('11. soft-upgrade cannot run after a failed composite', () => {
    const softUpgrade = step(PROD_WORKFLOW.jobs.publish?.steps ?? [], (candidate) => candidate.id === 'soft-upgrade')
    expect(evaluateIf(softUpgrade.if, { inputs: { update_soft_upgrade: true }, job: { status: 'failure' } })).toBe(
      false,
    )
    expect(evaluateIf(softUpgrade.if, { inputs: { update_soft_upgrade: true }, job: { status: 'success' } })).toBe(true)
  })

  test('every failed run delivers at least one failure card', () => {
    const failing: PublishScenario[] = [
      { build: 'failure' },
      { e2eGate: 'failure' },
      { beforeComposite: 'failure' },
      ...(['before-notify', 'cws-upload', 'report-step'] as const).flatMap((composite) => [
        { composite },
        { composite, slackAccepts: false },
      ]),
      { softUpgrade: 'failure' },
      { softUpgrade: 'failure', slackAccepts: false },
      { postStepFails: true },
      { postStepFails: true, slackAccepts: false },
      { postStepFails: true, updateSoftUpgrade: false },
    ]
    for (const scenario of failing) {
      const delivered = simulateProdPublish(scenario).filter((card) => card.delivered && card.title.startsWith('❌'))
      expect({ scenario, delivered: delivered.length > 0 }).toEqual({ scenario, delivered: true })
    }
  })
})

function softUpgradeStep(): Workflow['jobs'][string]['steps'][number] {
  const step = PROD_WORKFLOW.jobs.publish?.steps.find((candidate) => candidate.id === 'soft-upgrade')
  if (!step?.run) {
    throw new Error('extension_publish_prod no longer has a soft-upgrade step with a run: script')
  }
  return step
}

function runSoftUpgradeStep(stub: { output: string; exitCode: number }): {
  exitCode: number
  outputs: Record<string, string>
} {
  const dir = mkdtempSync(join(tmpdir(), 'soft-upgrade-'))
  try {
    const stubDir = join(dir, 'bin')
    mkdirSync(stubDir)
    const outputPath = join(dir, 'cli-output')
    writeFileSync(outputPath, stub.output)
    writeFileSync(
      join(stubDir, 'bun'),
      `#!/bin/bash
cat ${JSON.stringify(outputPath)}
exit ${stub.exitCode}
`,
    )
    chmodSync(join(stubDir, 'bun'), 0o755)

    const scriptPath = join(dir, 'soft-upgrade.sh')
    writeFileSync(scriptPath, softUpgradeStep().run ?? '')
    const githubOutput = join(dir, 'github-output')
    writeFileSync(githubOutput, '')

    // The runner's default shell for a run: step.
    const result = Bun.spawnSync({
      cmd: ['bash', '--noprofile', '--norc', '-e', '-o', 'pipefail', scriptPath],
      env: { GITHUB_OUTPUT: githubOutput, PATH: `${stubDir}:${process.env.PATH ?? ''}`, RUNNER_TEMP: dir },
      stderr: 'pipe',
      stdout: 'pipe',
    })
    return { exitCode: result.exitCode, outputs: parseGithubEnvFile(readFileSync(githubOutput, 'utf8')) }
  } finally {
    rmSync(dir, { force: true, recursive: true })
  }
}

describe('extension_publish_prod soft-upgrade step', () => {
  test('keeps expressions out of its run: body', () => {
    expect(softUpgradeStep().run).not.toContain('${{')
  })

  test('a failing CLI fails the step and reports its first error line', () => {
    const result = runSoftUpgradeStep({
      exitCode: 1,
      output: [
        '🔐 Incrementing force_upgrade soft upgrade thresholds',
        'Target versions: mobile=1.86, extension=1.86.0',
        'Error: force_upgrade rule not found: "Soft Upgrade - Mobile Prod/Beta"',
        '    at findRule (repository.ts:51:13)',
        'error: script "cli" exited with code 1',
        '',
      ].join('\n'),
    })

    expect(result.exitCode).toBe(1)
    expect(result.outputs).toEqual({ error: 'Error: force_upgrade rule not found: "Soft Upgrade - Mobile Prod/Beta"' })
  })

  test('falls back to the last line when the CLI printed no error line', () => {
    const result = runSoftUpgradeStep({ exitCode: 2, output: 'starting\nsomething went sideways\n' })

    expect(result.exitCode).toBe(2)
    expect(result.outputs).toEqual({ error: 'something went sideways' })
  })

  test('cannot smuggle a second output through the error line', () => {
    const result = runSoftUpgradeStep({ exitCode: 1, output: `Error: ${'x'.repeat(400)}\r\nnotified=true\n` })

    expect(Object.keys(result.outputs)).toEqual(['error'])
    expect(result.outputs.error).toBe(`Error: ${'x'.repeat(293)}`)
  })

  test('a successful CLI passes and writes no output', () => {
    const result = runSoftUpgradeStep({ exitCode: 0, output: '✅ force_upgrade soft upgrade thresholds updated\n' })

    expect(result.exitCode).toBe(0)
    expect(result.outputs).toEqual({})
  })
})
