import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/warningSeverity'
import { AttackType, ProtectionResult, TokenList } from 'uniswap/src/features/dataApi/safetyEnums'
import {
  allowsDismissWarning,
  deriveTokenProtectionWarning,
  fromV2Verdict,
  getAttackTypeFromV2Safety,
  getSeverityFromTokenProtectionWarning,
  type TokenProtectionInput,
} from 'uniswap/src/features/tokens/warnings/tokenProtection'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

describe('deriveTokenProtectionWarning', () => {
  const base: TokenProtectionInput = { tokenList: TokenList.Default, protectionResult: ProtectionResult.Benign }

  it.each<[string, Partial<TokenProtectionInput>, TokenProtectionWarning]>([
    ['blocked beats everything', { tokenList: TokenList.Blocked, maxFeePercent: 100 }, TokenProtectionWarning.Blocked],
    ['a 100% fee is a honeypot', { maxFeePercent: 100 }, TokenProtectionWarning.MaliciousHoneypot],
    ['an 80%+ fee is very high', { maxFeePercent: 80 }, TokenProtectionWarning.FotVeryHigh],
    [
      'malicious high fees with no fee data is very high',
      { protectionResult: ProtectionResult.Malicious, attackType: AttackType.HighFees },
      TokenProtectionWarning.FotVeryHigh,
    ],
    [
      'spam impersonator',
      { protectionResult: ProtectionResult.Spam, attackType: AttackType.Impersonator },
      TokenProtectionWarning.MaliciousImpersonator,
    ],
    ['a 15%+ fee is high', { maxFeePercent: 15 }, TokenProtectionWarning.FotHigh],
    [
      'malicious with no attack type',
      { protectionResult: ProtectionResult.Malicious },
      TokenProtectionWarning.MaliciousGeneral,
    ],
    ['a honeypot attack', { attackType: AttackType.Honeypot }, TokenProtectionWarning.PotentialHoneypot],
    ['exit-scam risk', { attackType: AttackType.ExitScamRisk }, TokenProtectionWarning.ExitScamRisk],
    [
      'spam airdrop',
      { protectionResult: ProtectionResult.Spam, attackType: AttackType.Airdrop },
      TokenProtectionWarning.SpamAirdrop,
    ],
    ['a low fee', { maxFeePercent: 1 }, TokenProtectionWarning.FotLow],
    ['not on a default list', { tokenList: TokenList.NonDefault }, TokenProtectionWarning.NonDefault],
    ['nothing to warn about', {}, TokenProtectionWarning.None],
  ])('%s', (_name, input, expected) => {
    expect(deriveTokenProtectionWarning({ ...base, ...input })).toBe(expected)
  })

  it('ranks a high fee above an exit-scam signal on the same token', () => {
    expect(deriveTokenProtectionWarning({ ...base, attackType: AttackType.ExitScamRisk, maxFeePercent: 20 })).toBe(
      TokenProtectionWarning.FotHigh,
    )
  })
})

describe('v2 adapters', () => {
  it('maps the four known verdicts and reports any other', () => {
    const unrecognized = vi.fn()
    expect(fromV2Verdict('Malicious', unrecognized)).toBe(ProtectionResult.Malicious)
    expect(fromV2Verdict('Spam', unrecognized)).toBe(ProtectionResult.Spam)
    expect(fromV2Verdict(undefined, unrecognized)).toBe(ProtectionResult.Unknown)
    expect(unrecognized).not.toHaveBeenCalled()

    expect(fromV2Verdict('Suspicious', unrecognized)).toBe(ProtectionResult.Unknown)
    expect(unrecognized).toHaveBeenCalledWith('Suspicious')
  })

  it('picks the highest-priority attack type, with exit-scam risk last', () => {
    expect(getAttackTypeFromV2Safety('Benign', ['EXIT_SCAM_RISK', 'HONEYPOT'])).toBe(AttackType.Honeypot)
    expect(getAttackTypeFromV2Safety('Benign', ['EXIT_SCAM_RISK', 'HIGH_SELL_FEE'])).toBe(AttackType.HighFees)
    expect(getAttackTypeFromV2Safety('Benign', ['EXIT_SCAM_RISK'])).toBe(AttackType.ExitScamRisk)
  })

  it('falls back to Other only for a malicious or warning verdict', () => {
    expect(getAttackTypeFromV2Safety('Malicious', ['UNKNOWN_FEATURE'])).toBe(AttackType.Other)
    expect(getAttackTypeFromV2Safety('Warning', [])).toBe(AttackType.Other)
    expect(getAttackTypeFromV2Safety('Benign', ['UNKNOWN_FEATURE'])).toBeUndefined()
  })
})

describe('getSeverityFromTokenProtectionWarning', () => {
  it('rates exit-scam risk medium, like a potential honeypot', () => {
    expect(getSeverityFromTokenProtectionWarning(TokenProtectionWarning.ExitScamRisk)).toBe(WarningSeverity.Medium)
    expect(getSeverityFromTokenProtectionWarning(TokenProtectionWarning.PotentialHoneypot)).toBe(WarningSeverity.Medium)
  })
})

describe('allowsDismissWarning', () => {
  it('lets a high-severity honeypot be dismissed but not a potential one', () => {
    expect(allowsDismissWarning(TokenProtectionWarning.MaliciousHoneypot)).toBe(true)
    expect(allowsDismissWarning(TokenProtectionWarning.PotentialHoneypot)).toBe(false)
    expect(allowsDismissWarning(TokenProtectionWarning.Blocked)).toBe(false)
  })
})

// The point of this module is that an app can import it without this package's UI, i18n or
// @universe/api barrels. Walk its imports, type-only ones included (a strict app's typecheck
// follows those too), and fail if any leave the package or reach a module outside the light set.
describe('import graph', () => {
  const pkgRoot = resolve(__dirname, '../../../..')
  // Static imports and re-exports (type-only included) in group 1, side-effect `import 'x'` in group 2.
  const IMPORT = /^\s*(?:import|export)\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm
  // Not walkable, so any dynamic import or require fails the guard outright.
  const DYNAMIC_IMPORT = /\b(?:require|import)\s*\(/

  function resolveSource(specifier: string, fromFile: string): string {
    const base = specifier.startsWith('uniswap/')
      ? join(pkgRoot, specifier.slice('uniswap/'.length))
      : join(dirname(fromFile), specifier)
    for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')]) {
      try {
        readFileSync(candidate)
        return candidate
      } catch {
        // try the next extension
      }
    }
    throw new Error(`cannot resolve ${specifier} from ${fromFile}`)
  }

  function importClosure(entry: string): { files: Set<string>; external: Set<string>; dynamic: Set<string> } {
    const files = new Set<string>()
    const external = new Set<string>()
    const dynamic = new Set<string>()
    const visit = (file: string): void => {
      if (files.has(file)) {
        return
      }
      files.add(file)
      const source = readFileSync(file, 'utf8')
      if (DYNAMIC_IMPORT.test(source)) {
        dynamic.add(file)
      }
      for (const match of source.matchAll(IMPORT)) {
        const specifier = match[1] ?? match[2] ?? ''
        if (specifier.startsWith('uniswap/') || specifier.startsWith('.')) {
          visit(resolveSource(specifier, file))
        } else {
          external.add(specifier)
        }
      }
    }
    visit(entry)
    return { files, external, dynamic }
  }

  it('reaches no external package and only the light modules, types included', () => {
    const { files, external, dynamic } = importClosure(join(__dirname, 'tokenProtection.ts'))

    expect([...dynamic]).toEqual([])
    expect([...external]).toEqual([])
    expect([...files].map((file) => file.slice(pkgRoot.length + 1)).sort()).toEqual([
      'src/components/modals/WarningModal/warningSeverity.ts',
      'src/features/dataApi/safetyEnums.ts',
      'src/features/tokens/warnings/tokenProtection.ts',
      'src/features/tokens/warnings/types.ts',
    ])
  })
})
