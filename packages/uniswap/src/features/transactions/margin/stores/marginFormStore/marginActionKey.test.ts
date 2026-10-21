import { MARGIN_ACTION_KEYS, type MarginActionKey } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  resolveMarginActionKey,
  type MarginEquityChange,
  type MarginFormAction,
  type MarginLeverageIntent,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginActionKey'
import { describe, expect, it } from 'vitest'

// The full contract, one row per reachable (action, equity, leverage) combination. `adjust` stands in
// for the four manage actions — the four-action equivalence is asserted separately below.
const TRUTH_TABLE: Array<{
  formAction: MarginFormAction
  equityChange: MarginEquityChange
  leverageIntent: MarginLeverageIntent
  expected: MarginActionKey | undefined
}> = [
  { formAction: 'open', equityChange: 'add', leverageIntent: 'increase', expected: 'open' },
  { formAction: 'close', equityChange: 'none', leverageIntent: 'unchanged', expected: 'close' },

  { formAction: 'adjust', equityChange: 'none', leverageIntent: 'unchanged', expected: undefined },
  { formAction: 'adjust', equityChange: 'none', leverageIntent: 'hold', expected: undefined },
  { formAction: 'adjust', equityChange: 'none', leverageIntent: 'increase', expected: 'increaseLeverage' },
  { formAction: 'adjust', equityChange: 'none', leverageIntent: 'decrease', expected: 'decreaseLeverage' },

  { formAction: 'adjust', equityChange: 'add', leverageIntent: 'unchanged', expected: 'addEquity' },
  { formAction: 'adjust', equityChange: 'add', leverageIntent: 'hold', expected: 'addEquityAndIncreaseLeverage' },
  { formAction: 'adjust', equityChange: 'add', leverageIntent: 'increase', expected: 'addEquityAndIncreaseLeverage' },
  { formAction: 'adjust', equityChange: 'add', leverageIntent: 'decrease', expected: 'addEquityAndDecreaseLeverage' },

  { formAction: 'adjust', equityChange: 'withdraw', leverageIntent: 'unchanged', expected: 'withdrawEquity' },
  {
    formAction: 'adjust',
    equityChange: 'withdraw',
    leverageIntent: 'hold',
    expected: 'withdrawEquityAndDecreaseLeverage',
  },
  {
    formAction: 'adjust',
    equityChange: 'withdraw',
    leverageIntent: 'increase',
    expected: 'withdrawEquityAndIncreaseLeverage',
  },
  {
    formAction: 'adjust',
    equityChange: 'withdraw',
    leverageIntent: 'decrease',
    expected: 'withdrawEquityAndDecreaseLeverage',
  },
]

describe('resolveMarginActionKey', () => {
  it.each(TRUTH_TABLE)(
    '$formAction + equity $equityChange + leverage $leverageIntent -> $expected',
    ({ formAction, equityChange, leverageIntent, expected }) => {
      expect(resolveMarginActionKey({ formAction, equityChange, leverageIntent })).toBe(expected)
    },
  )

  it('reaches every one of the ten wire keys', () => {
    const reached = new Set(
      TRUTH_TABLE.map((row) => row.expected).filter((key): key is NonNullable<typeof key> => key !== undefined),
    )
    const byName = (a: string, b: string): number => a.localeCompare(b)
    expect([...reached].sort(byName)).toEqual([...MARGIN_ACTION_KEYS].sort(byName))
  })

  it('is total: no combination throws, and only the two no-op ones are unsubmittable', () => {
    const formActions: MarginFormAction[] = ['open', 'close', 'add', 'withdraw', 'leverage', 'adjust']
    const equityChanges: MarginEquityChange[] = ['none', 'add', 'withdraw']
    const leverageIntents: MarginLeverageIntent[] = ['unchanged', 'hold', 'increase', 'decrease']
    const unresolved: string[] = []
    for (const formAction of formActions) {
      for (const equityChange of equityChanges) {
        for (const leverageIntent of leverageIntents) {
          if (!resolveMarginActionKey({ formAction, equityChange, leverageIntent })) {
            unresolved.push(`${formAction}/${equityChange}/${leverageIntent}`)
          }
        }
      }
    }
    // Exactly the manage actions with neither axis moving.
    expect(unresolved).toEqual([
      'add/none/unchanged',
      'add/none/hold',
      'withdraw/none/unchanged',
      'withdraw/none/hold',
      'leverage/none/unchanged',
      'leverage/none/hold',
      'adjust/none/unchanged',
      'adjust/none/hold',
    ])
  })

  it('resolves the same key for every manage action given the same axes', () => {
    for (const equityChange of ['none', 'add', 'withdraw'] as const) {
      for (const leverageIntent of ['unchanged', 'hold', 'increase', 'decrease'] as const) {
        const keys = (['add', 'withdraw', 'leverage', 'adjust'] as const).map((formAction) =>
          resolveMarginActionKey({ formAction, equityChange, leverageIntent }),
        )
        expect(new Set(keys).size).toBe(1)
      }
    }
  })

  it('never resolves open or close off the axes — only the action names them', () => {
    expect(resolveMarginActionKey({ formAction: 'open', equityChange: 'none', leverageIntent: 'unchanged' })).toBe(
      'open',
    )
    expect(resolveMarginActionKey({ formAction: 'close', equityChange: 'add', leverageIntent: 'increase' })).toBe(
      'close',
    )
    const axisKeys = (['none', 'add', 'withdraw'] as const).flatMap((equityChange) =>
      (['unchanged', 'hold', 'increase', 'decrease'] as const).map((leverageIntent) =>
        resolveMarginActionKey({ formAction: 'adjust', equityChange, leverageIntent }),
      ),
    )
    expect(axisKeys).not.toContain('open')
    expect(axisKeys).not.toContain('close')
  })
})
