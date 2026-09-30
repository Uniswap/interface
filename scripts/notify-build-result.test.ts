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
const PAYLOAD_PATH = '/tmp/slack-payload.json'

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
      steps: Array<{ id?: string; name?: string; uses?: string; with?: Record<string, string> }>
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
  const PUBLISH_COMPOSITE = './.github/actions/extension_publish'
  const NOTIFY_FAILURE_ACTION = './.github/actions/extension_notify_publish_failure'

  // Expected per workflow from one precondition rather than a hardcoded list: prod runs a step after the composite,
  // so it stays unguarded until that step moves out of the publish job.
  for (const [name, workflow] of [
    ['dev', DEV_WORKFLOW],
    ['beta', BETA_WORKFLOW],
    ['prod', PROD_WORKFLOW],
  ] as const) {
    test(`the ${name} notify-failure job gates on notified exactly when the composite notifies last`, () => {
      const steps = workflow.jobs.publish?.steps ?? []
      expect(steps.length).toBeGreaterThan(0)

      // The composite reads `job.status` as it stands when it runs, so a later step can fail and leave notified=true on a failed job.
      const guarded = steps.at(-1)?.uses === PUBLISH_COMPOSITE
      const condition = workflow.jobs['notify-failure']?.if ?? ''

      if (guarded) {
        expect(workflow.jobs.publish?.outputs?.notified).toContain('steps.publish.outputs.notified')
        expect(steps.some((step) => step.id === 'publish')).toBe(true)
        expect(condition).toContain("needs.publish.outputs.notified != 'true'")

        // On the guarded path this job is the only card left, so it must reuse the composite's classification rather than a literal.
        expect(workflow.jobs.publish?.outputs?.['error-hint']).toContain('steps.publish.outputs.error-hint')
        const notifier = workflow.jobs['notify-failure']?.steps.find((step) => step.uses === NOTIFY_FAILURE_ACTION)
        expect(notifier?.with?.['error-hint']).toContain('needs.publish.outputs.error-hint')
      } else {
        expect(condition).not.toContain('notified')
      }

      // Publish-skipped paths stay unguarded everywhere: the composite never runs there.
      expect(condition).toContain("needs.build.result == 'failure'")
    })
  }
})
