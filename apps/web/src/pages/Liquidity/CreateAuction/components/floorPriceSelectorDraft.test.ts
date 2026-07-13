import { CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import {
  commitDraftToFloorPrice,
  commitWouldNormalizeDraft,
  getDisplayValueForMode,
  getMinimumRepresentableFloorPrice,
  isDraftFloorBelowMinimumRepresentable,
  pickDisplayValueForToggleTarget,
  previewFloorPriceForFdvUsdDraft,
  resolveUnfocusedDraftSync,
  shouldRejectDraftBelowMinimum,
} from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraft'

const addr = (n: number): string => `0x${n.toString(16).padStart(40, '0')}`

const auction18 = new Token(UniverseChainId.Mainnet, addr(1), 18, 'AUC')
const auction6 = new Token(UniverseChainId.Mainnet, addr(2), 6, 'AUC6')
const ethRaise = new Token(UniverseChainId.Mainnet, addr(3), 18, 'ETH')
const usdcRaise = new Token(UniverseChainId.Mainnet, addr(4), 6, 'USDC')

/** 1e9 auction tokens (10^27 base wei with 18 decimals). */
const supply1e9 = CurrencyAmount.fromRawAmount(auction18, (10n ** 27n).toString())
/** 1e6 auction tokens (10^24 base wei). */
const supply1e6 = CurrencyAmount.fromRawAmount(auction18, (10n ** 24n).toString())

describe('getMinimumRepresentableFloorPrice', () => {
  it('is 1 wei of raise per full auction token (18 dec / 18 dec)', () => {
    const min = getMinimumRepresentableFloorPrice(auction18, ethRaise)
    const oneTok = CurrencyAmount.fromRawAmount(auction18, (10n ** 18n).toString())
    expect(min.quote(oneTok).quotient.toString()).toBe('1')
  })
  it('is 1 wei of raise per full auction token (18 dec / 6 dec USDC)', () => {
    const min = getMinimumRepresentableFloorPrice(auction18, usdcRaise)
    const oneTok = CurrencyAmount.fromRawAmount(auction18, (10n ** 18n).toString())
    expect(min.quote(oneTok).quotient.toString()).toBe('1')
  })
  it('is 1 wei of raise per full auction token (6 dec / 18 dec)', () => {
    const min = getMinimumRepresentableFloorPrice(auction6, ethRaise)
    const oneTok = CurrencyAmount.fromRawAmount(auction6, (10n ** 6n).toString())
    expect(min.quote(oneTok).quotient.toString()).toBe('1')
  })
})

// usdPriceNum carries the USD price of the raise token (e.g. 3000 for ETH, 1 for USDC).
const currencyCases = [
  { label: 'ETH (18 dec)', raise: ethRaise, usdOfOneRaiseToken: 3000 },
  { label: 'USDC (6 dec)', raise: usdcRaise, usdOfOneRaiseToken: 1 },
] as const

describe('isDraftFloorBelowMinimumRepresentable', () => {
  describe.each(currencyCases)('with $label raise', ({ raise, usdOfOneRaiseToken }) => {
    it('floorPrice+raise above min → false', () => {
      expect(
        isDraftFloorBelowMinimumRepresentable({
          localValue: '0.0001',
          denomination: 'floorPrice',
          inputCurrency: 'raise',
          usdPriceNum: null,
          tokenTotalSupply: supply1e9,
          raiseCurrency: raise,
        }),
      ).toBe(false)
    })

    it('floorPrice+usd convertible to valid floor → false', () => {
      expect(
        isDraftFloorBelowMinimumRepresentable({
          localValue: '1',
          denomination: 'floorPrice',
          inputCurrency: 'usd',
          usdPriceNum: usdOfOneRaiseToken,
          tokenTotalSupply: supply1e9,
          raiseCurrency: raise,
        }),
      ).toBe(false)
    })

    it('fdv+raise above min → false', () => {
      expect(
        isDraftFloorBelowMinimumRepresentable({
          localValue: '10000',
          denomination: 'fdv',
          inputCurrency: 'raise',
          usdPriceNum: null,
          tokenTotalSupply: supply1e9,
          raiseCurrency: raise,
        }),
      ).toBe(false)
    })

    it('fdv+usd above min → false', () => {
      expect(
        isDraftFloorBelowMinimumRepresentable({
          localValue: '1000',
          denomination: 'fdv',
          inputCurrency: 'usd',
          usdPriceNum: usdOfOneRaiseToken,
          tokenTotalSupply: supply1e9,
          raiseCurrency: raise,
        }),
      ).toBe(false)
    })
  })

  it('fdv+raise sub-wei FDV with ETH → true (1 wei FDV / 1e9 tokens supply)', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.000000000000000001',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(true)
  })

  it('fdv+usd sub-wei implied floor with ETH oracle → true', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.00000001',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 3000,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(true)
  })

  it('floorPrice+usd sub-wei implied floor with USDC → true', () => {
    // $0.0000001 / token with USDC@$1 → 0.0000001 USDC = 0.1 wei → rounds to 0 wei → sub-min
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.0000001',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('fdv+raise sub-wei FDV with USDC raise → true', () => {
    // 1 USDC wei FDV (10^-6) / 10^9 tokens supply → 10^-15 USDC per token, well below 10^-6 min
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.000001',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('empty localValue → false', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '   ',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(false)
  })

  it('non-positive localValue → false', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '-1',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(false)
  })

  it('zero supply → false (caller should treat as not-yet-validatable)', () => {
    const zeroSupply = CurrencyAmount.fromRawAmount(auction18, '0')
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '1',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: zeroSupply,
        raiseCurrency: ethRaise,
      }),
    ).toBe(false)
  })

  it('missing raiseCurrency → false', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.00000001',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 3000,
        tokenTotalSupply: supply1e9,
        raiseCurrency: undefined,
      }),
    ).toBe(false)
  })

  it('missing usdPriceNum on a USD draft → false (unvalidatable)', () => {
    expect(
      isDraftFloorBelowMinimumRepresentable({
        localValue: '0.00000001',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(false)
  })
})

describe('shouldRejectDraftBelowMinimum', () => {
  // Regression: USD FDV with USDC raise (6 decimals) and 1e9 supply has a $1000 minimum FDV.
  // Every intermediate prefix of a legitimate FDV ("1" → "1000000") is below that minimum, so
  // rejecting keystrokes on sub-minimum FDV drafts made the input swallow all typing.
  it('fdv+usd sub-minimum intermediate with USDC → false (typing the first digit of "1000000")', () => {
    expect(
      shouldRejectDraftBelowMinimum({
        localValue: '1',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(false)
  })

  it('fdv+raise sub-minimum intermediate with USDC → false', () => {
    expect(
      shouldRejectDraftBelowMinimum({
        localValue: '1',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(false)
  })

  it('fdv+usd sub-minimum with ETH → false (FDV drafts are clamped on commit, never blocked)', () => {
    expect(
      shouldRejectDraftBelowMinimum({
        localValue: '0.00000001',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 3000,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe(false)
  })

  // floorPrice drafts: appending digits can never grow the value past its prefix, so a
  // sub-minimum draft is a dead end and the keystroke rejection stays.
  it('floorPrice+usd sub-wei implied floor with USDC → true', () => {
    expect(
      shouldRejectDraftBelowMinimum({
        localValue: '0.0000001',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('floorPrice+usd valid floor → false', () => {
    expect(
      shouldRejectDraftBelowMinimum({
        localValue: '1',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(false)
  })
})

describe('commitWouldNormalizeDraft', () => {
  // The PR-feedback case: typed FDV `300` with USDC raise and 1e9 supply is below the $1000
  // minimum FDV — commit clamps it, so the input must re-sync its display after blur.
  it('fdv+usd below-minimum draft with USDC → true', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '300',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('fdv+usd at/above the minimum with USDC → false (typed string is kept)', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '5000',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(false)
  })

  it('fdv+raise below-minimum draft with USDC → true', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '300',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('floorPrice+usd sub-wei draft with USDC → true (e.g. left behind by a denomination toggle)', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '0.0000003',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(true)
  })

  it('empty draft → false', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '   ',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe(false)
  })

  it('missing raiseCurrency → false', () => {
    expect(
      commitWouldNormalizeDraft({
        localValue: '300',
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: undefined,
      }),
    ).toBe(false)
  })
})

describe('resolveUnfocusedDraftSync', () => {
  // FDV + USD with USDC raise and 1e9 supply: minimum FDV is $1000 (canonical floor 0.000001).
  const fdvUsdUsdc = {
    denomination: 'fdv' as const,
    inputCurrency: 'usd' as const,
    usdPriceNum: 1,
    tokenTotalSupply: supply1e9,
    raiseCurrency: usdcRaise,
    hasValidFloorPrice: true,
  }

  it('replaces a clamped draft with the display derived from the committed canonical', () => {
    // Typed `300`, commit clamped to the $1000-minimum canonical; snapshot holds the stale raw.
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '300',
      floorPrice: '0.000001',
      floorPriceInput: { floorPrice: '0.000001', rawValue: '300', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'replace', value: '1000' })
  })

  it('keeps a faithful draft that matches the persisted snapshot', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '5000',
      floorPrice: '0.000005',
      floorPriceInput: { floorPrice: '0.000005', rawValue: '5000', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'keep' })
  })

  it('restores the snapshot rawValue when the local draft drifted but the snapshot is faithful', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '',
      floorPrice: '0.000005',
      floorPriceInput: { floorPrice: '0.000005', rawValue: '5000', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'restoreSnapshot', value: '5000' })
  })

  it('keeps a snapshot-less draft that commits to the same canonical floor', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '5000',
      floorPrice: '0.000005',
      floorPriceInput: undefined,
    })
    expect(result).toEqual({ action: 'keep' })
  })

  it('replaces a stale draft that commits to a different canonical floor', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '5000',
      floorPrice: '0.002',
      floorPriceInput: undefined,
    })
    // Canonical 0.002 USDC/token × 1e9 supply × $1 = $2,000,000 FDV.
    expect(result).toEqual({ action: 'replace', value: '2000000' })
  })

  it('does not ping-pong: the replacement display resolves to keep on the next pass', () => {
    const replaced = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '300',
      floorPrice: '0.000001',
      floorPriceInput: { floorPrice: '0.000001', rawValue: '300', denomination: 'fdv', inputCurrency: 'usd' },
    })
    if (replaced.action !== 'replace') {
      throw new Error('expected replace')
    }
    // Even before the snapshot updates to the synced value, the new draft commits to the same
    // canonical and is not normalized, so it is kept as-is.
    const next = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: replaced.value,
      floorPrice: '0.000001',
      floorPriceInput: { floorPrice: '0.000001', rawValue: '300', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(next).toEqual({ action: 'keep' })
  })

  // With USDC raise and 1e9 supply the floor granularity is 1 USDC wei per token, so FDV is only
  // representable in $1000 steps: typed `23222` commits to the `23000`-equivalent canonical. The
  // unfocused display must always equal the committed canonical — granularity truncation is a
  // divergence just like the below-minimum clamp.
  it('replaces a sub-granularity draft with the canonical display (typed 23222 → shows 23000)', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '23222',
      floorPrice: '0.000023',
      floorPriceInput: { floorPrice: '0.000023', rawValue: '23222', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'replace', value: '23000' })
  })

  it('does not restore a snapshot whose rawValue numerically diverges from the canonical display', () => {
    // A persisted truncated value must not resurrect the stale typed string on remount.
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '',
      floorPrice: '0.000023',
      floorPriceInput: { floorPrice: '0.000023', rawValue: '23222', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'replace', value: '23000' })
  })

  it('does not ping-pong after a sub-granularity replace: the resync is canonical-preserving', () => {
    const replaced = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '23222',
      floorPrice: '0.000023',
      floorPriceInput: { floorPrice: '0.000023', rawValue: '23222', denomination: 'fdv', inputCurrency: 'usd' },
    })
    if (replaced.action !== 'replace') {
      throw new Error('expected replace')
    }
    // The replaced display string re-commits to the same canonical (the resync never moves the
    // floor) and is kept on the next pass, even before the snapshot catches up.
    expect(
      commitDraftToFloorPrice({
        localValue: replaced.value,
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: 1,
        tokenTotalSupply: supply1e9,
        raiseCurrency: usdcRaise,
      }),
    ).toBe('0.000023')
    const next = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: replaced.value,
      floorPrice: '0.000023',
      floorPriceInput: { floorPrice: '0.000023', rawValue: '23222', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(next).toEqual({ action: 'keep' })
  })

  it('formatting-only differences are not divergence (trailing zeros keep the typed string)', () => {
    const result = resolveUnfocusedDraftSync({
      ...fdvUsdUsdc,
      localValue: '5000.0',
      floorPrice: '0.000005',
      floorPriceInput: { floorPrice: '0.000005', rawValue: '5000.0', denomination: 'fdv', inputCurrency: 'usd' },
    })
    expect(result).toEqual({ action: 'keep' })
  })

  it('fdv+raise: replaces a typed raise FDV truncated to wei granularity (23222 USDC → 23000)', () => {
    const result = resolveUnfocusedDraftSync({
      denomination: 'fdv',
      inputCurrency: 'raise',
      usdPriceNum: null,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
      hasValidFloorPrice: true,
      localValue: '23222',
      floorPrice: '0.000023',
      floorPriceInput: { floorPrice: '0.000023', rawValue: '23222', denomination: 'fdv', inputCurrency: 'raise' },
    })
    expect(result).toEqual({ action: 'replace', value: '23000' })
  })

  it('floorPrice+usd: replaces a typed USD/token value truncated to wei granularity', () => {
    // $0.0000015/token with USDC@$1 truncates to 1 wei (0.000001 USDC) — above the minimum, so the
    // keystroke is accepted, but the committed canonical reads back as 0.000001.
    const result = resolveUnfocusedDraftSync({
      denomination: 'floorPrice',
      inputCurrency: 'usd',
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
      hasValidFloorPrice: true,
      localValue: '0.0000015',
      floorPrice: '0.000001',
      floorPriceInput: {
        floorPrice: '0.000001',
        rawValue: '0.0000015',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
      },
    })
    expect(result).toEqual({ action: 'replace', value: '0.000001' })
  })
})

describe('blur resync pipeline (commit clamp → display from canonical)', () => {
  // End-to-end over the pure functions backing the FloorPriceSelector hydrate effect:
  // a clamped draft must be replaced by the display derived from the committed canonical,
  // while a faithful draft is kept as typed.
  it('typed FDV "300" (USD, USDC raise) commits to the $1000-FDV minimum and re-displays as "1000"', () => {
    const params = {
      localValue: '300',
      denomination: 'fdv' as const,
      inputCurrency: 'usd' as const,
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    }
    const committed = commitDraftToFloorPrice(params)
    expect(committed).toBe('0.000001') // 1 USDC wei per token — the clamped minimum

    // The hydrate effect must NOT keep "300": commit normalized it.
    expect(commitWouldNormalizeDraft(params)).toBe(true)

    const display = getDisplayValueForMode({
      denomination: 'fdv',
      inputCurrency: 'usd',
      floorPrice: committed,
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
      usdPriceNum: 1,
    })
    expect(display).toBe('1000')

    // The synced display is now a faithful draft: it round-trips to the same canonical and is
    // not normalized again, so the resync settles (no ping-pong with the snapshot restore).
    expect(commitDraftToFloorPrice({ ...params, localValue: display })).toBe(committed)
    expect(commitWouldNormalizeDraft({ ...params, localValue: display })).toBe(false)
  })

  it('typed FDV "23222" (USD, USDC raise) commits to the $1000-granularity floor and re-displays as "23000"', () => {
    const params = {
      localValue: '23222',
      denomination: 'fdv' as const,
      inputCurrency: 'usd' as const,
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    }
    // 23222 / 1e9 supply = 23.222 USDC wei per token → truncates to 23 wei.
    const committed = commitDraftToFloorPrice(params)
    expect(committed).toBe('0.000023')

    // NOT a below-minimum clamp — the clamp predicate alone cannot catch this divergence; the
    // resync compares the draft against the canonical's display numerically.
    expect(commitWouldNormalizeDraft(params)).toBe(false)

    const display = getDisplayValueForMode({
      denomination: 'fdv',
      inputCurrency: 'usd',
      floorPrice: committed,
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
      usdPriceNum: 1,
    })
    expect(display).toBe('23000')

    // The synced display round-trips stably: it re-commits to the same canonical (the resync
    // never moves the floor) and is itself displayed unchanged.
    expect(commitDraftToFloorPrice({ ...params, localValue: display })).toBe(committed)
  })

  it('a valid typed FDV commits and is kept as typed (no resync)', () => {
    const params = {
      localValue: '5000',
      denomination: 'fdv' as const,
      inputCurrency: 'usd' as const,
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    }
    expect(commitDraftToFloorPrice(params)).toBe('0.000005')
    expect(commitWouldNormalizeDraft(params)).toBe(false)
  })

  it('retyping a valid value after a resync commits the new value (refocus + retype)', () => {
    const params = {
      localValue: '2000000',
      denomination: 'fdv' as const,
      inputCurrency: 'usd' as const,
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    }
    expect(commitDraftToFloorPrice(params)).toBe('0.002')
    expect(commitWouldNormalizeDraft(params)).toBe(false)
  })
})

describe('commitDraftToFloorPrice', () => {
  describe.each(currencyCases)('with $label raise', ({ raise, usdOfOneRaiseToken }) => {
    it('floorPrice+raise round-trips "0.01"', () => {
      const result = commitDraftToFloorPrice({
        localValue: '0.01',
        denomination: 'floorPrice',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: raise,
      })
      expect(result).toBe('0.01')
    })

    it('floorPrice+usd "30" with oracle → "30" raise per token', () => {
      const result = commitDraftToFloorPrice({
        localValue: String(30 * usdOfOneRaiseToken),
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        usdPriceNum: usdOfOneRaiseToken,
        tokenTotalSupply: supply1e9,
        raiseCurrency: raise,
      })
      // 30 * usd / usd = 30 raise per token; existing test patterns use exact-Price arithmetic.
      expect(result).toBe('30')
    })

    it('fdv+raise "10000" with 10^9 supply → "0.00001" raise per token (no float drift)', () => {
      const result = commitDraftToFloorPrice({
        localValue: '10000',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: raise,
      })
      expect(result).toBe('0.00001')
      expect(result).not.toMatch(/9999/)
    })

    it('fdv+usd combined → derives canonical floor', () => {
      // FDV of (3 * supply * usdPerRaise) USD with supply=1e9 → floor = 3 raise per token
      const result = commitDraftToFloorPrice({
        localValue: String(3 * 1e9 * usdOfOneRaiseToken),
        denomination: 'fdv',
        inputCurrency: 'usd',
        usdPriceNum: usdOfOneRaiseToken,
        tokenTotalSupply: supply1e9,
        raiseCurrency: raise,
      })
      expect(result).toBe('3')
    })
  })

  it('clamps fdv+raise when implied floor is below 1 wei per token (ETH)', () => {
    const result = commitDraftToFloorPrice({
      localValue: '0.000000000000000001',
      denomination: 'fdv',
      inputCurrency: 'raise',
      usdPriceNum: null,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
    })
    expect(result).toBe('0.000000000000000001')
    // Confirm the clamped string round-trips to 1 wei per full token.
    const parsed = getCurrencyAmount({ value: result, valueType: ValueType.Exact, currency: ethRaise })
    if (!parsed) {
      throw new Error('expected currency amount')
    }
    const oneTok = CurrencyAmount.fromRawAmount(auction18, (10n ** 18n).toString())
    const price = new Price({ baseAmount: oneTok, quoteAmount: parsed })
    expect(price.quote(oneTok).quotient.toString()).toBe('1')
  })

  it('clamps fdv+raise when implied floor is below 1 wei per token (USDC)', () => {
    const result = commitDraftToFloorPrice({
      localValue: '0.000001',
      denomination: 'fdv',
      inputCurrency: 'raise',
      usdPriceNum: null,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    })
    expect(result).toBe('0.000001')
  })

  it('clamps floorPrice+usd when implied raise per token rounds to zero wei (USDC)', () => {
    const result = commitDraftToFloorPrice({
      localValue: '0.0000001',
      denomination: 'floorPrice',
      inputCurrency: 'usd',
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    })
    expect(result).toBe('0.000001')
  })

  it('fdv+usd "1000000" with USDC raise and 1e9 supply → "0.001" (typed USD FDV commits exactly)', () => {
    const result = commitDraftToFloorPrice({
      localValue: '1000000',
      denomination: 'fdv',
      inputCurrency: 'usd',
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    })
    expect(result).toBe('0.001')
  })

  it('clamps fdv+usd sub-minimum draft with USDC raise to 1 wei per token (left-behind "1")', () => {
    // $1 FDV / 1e9 supply implies 1e-9 USDC per token — below the 1e-6 minimum → clamps to min.
    const result = commitDraftToFloorPrice({
      localValue: '1',
      denomination: 'fdv',
      inputCurrency: 'usd',
      usdPriceNum: 1,
      tokenTotalSupply: supply1e9,
      raiseCurrency: usdcRaise,
    })
    expect(result).toBe('0.000001')
  })

  it('clamps fdv+usd when implied floor is below 1 wei per token (ETH)', () => {
    const result = commitDraftToFloorPrice({
      localValue: '0.00000001',
      denomination: 'fdv',
      inputCurrency: 'usd',
      usdPriceNum: 3000,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
    })
    expect(result).toBe('0.000000000000000001')
  })

  it('returns "" for empty localValue', () => {
    expect(
      commitDraftToFloorPrice({
        localValue: '   ',
        denomination: 'floorPrice',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
      }),
    ).toBe('')
  })

  it('returns "" when tokenTotalSupply is zero', () => {
    const zeroSupply = CurrencyAmount.fromRawAmount(auction18, '0')
    expect(
      commitDraftToFloorPrice({
        localValue: '1',
        denomination: 'fdv',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: zeroSupply,
        raiseCurrency: ethRaise,
      }),
    ).toBe('')
  })

  it('returns "" when raiseCurrency is undefined', () => {
    expect(
      commitDraftToFloorPrice({
        localValue: '1',
        denomination: 'floorPrice',
        inputCurrency: 'raise',
        usdPriceNum: null,
        tokenTotalSupply: supply1e9,
        raiseCurrency: undefined,
      }),
    ).toBe('')
  })
})

describe('getDisplayValueForMode', () => {
  describe.each(currencyCases)('with $label raise', ({ raise, usdOfOneRaiseToken }) => {
    it('floorPrice+usd drift-free: 0.01 × oracle = expected USD', () => {
      const result = getDisplayValueForMode({
        denomination: 'floorPrice',
        inputCurrency: 'usd',
        floorPrice: '0.01',
        hasValidFloorPrice: true,
        tokenTotalSupply: supply1e9,
        raiseCurrency: raise,
        usdPriceNum: usdOfOneRaiseToken,
      })
      // 0.01 raise × usdOfOneRaiseToken
      const expected = 0.01 * usdOfOneRaiseToken
      expect(parseFloat(result)).toBeCloseTo(expected, 10)
      expect(result).not.toMatch(/9999/)
    })

    it('fdv+raise drift-free: 0.01 × 10^6 supply = 10000', () => {
      const result = getDisplayValueForMode({
        denomination: 'fdv',
        inputCurrency: 'raise',
        floorPrice: '0.01',
        hasValidFloorPrice: true,
        tokenTotalSupply: supply1e6,
        raiseCurrency: raise,
        usdPriceNum: null,
      })
      expect(result).toBe('10000')
    })

    it('fdv+usd drift-free: combined', () => {
      const result = getDisplayValueForMode({
        denomination: 'fdv',
        inputCurrency: 'usd',
        floorPrice: '0.01',
        hasValidFloorPrice: true,
        tokenTotalSupply: supply1e6,
        raiseCurrency: raise,
        usdPriceNum: usdOfOneRaiseToken,
      })
      // 0.01 × 1e6 × usd
      const expected = 10000 * usdOfOneRaiseToken
      expect(parseFloat(result)).toBeCloseTo(expected, 6)
    })
  })

  it('derives FDV in raise from canonical floor without float drift (existing case)', () => {
    const fdvDraft = getDisplayValueForMode({
      denomination: 'fdv',
      inputCurrency: 'raise',
      floorPrice: '0.00000001',
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
      usdPriceNum: null,
    })
    expect(fdvDraft).toBe('10')
    expect(fdvDraft).not.toMatch(/99999/)
  })

  it('returns "" when !hasValidFloorPrice', () => {
    expect(
      getDisplayValueForMode({
        denomination: 'fdv',
        inputCurrency: 'raise',
        floorPrice: '0.01',
        hasValidFloorPrice: false,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
        usdPriceNum: null,
      }),
    ).toBe('')
  })

  it('returns "" when raiseCurrency is undefined', () => {
    expect(
      getDisplayValueForMode({
        denomination: 'fdv',
        inputCurrency: 'raise',
        floorPrice: '0.01',
        hasValidFloorPrice: true,
        tokenTotalSupply: supply1e9,
        raiseCurrency: undefined,
        usdPriceNum: null,
      }),
    ).toBe('')
  })

  it('returns "" for empty floorPrice', () => {
    expect(
      getDisplayValueForMode({
        denomination: 'fdv',
        inputCurrency: 'raise',
        floorPrice: '   ',
        hasValidFloorPrice: true,
        tokenTotalSupply: supply1e9,
        raiseCurrency: ethRaise,
        usdPriceNum: null,
      }),
    ).toBe('')
  })
})

describe('previewFloorPriceForFdvUsdDraft', () => {
  const baseParams = {
    denomination: 'fdv' as const,
    inputCurrency: 'usd' as const,
    usdPriceNum: 3000,
    tokenTotalSupply: supply1e9,
    raiseCurrency: ethRaise,
  }

  it('returns the floorPrice prop when parent-controlled', () => {
    expect(
      previewFloorPriceForFdvUsdDraft({
        ...baseParams,
        isParentControlled: true,
        floorPrice: '0.5',
        localValue: '900000',
      }),
    ).toBe('0.5')
  })

  it('returns the floorPrice prop for non-FDV-USD modes', () => {
    expect(
      previewFloorPriceForFdvUsdDraft({
        ...baseParams,
        denomination: 'floorPrice',
        isParentControlled: false,
        floorPrice: '0.5',
        localValue: '900000',
      }),
    ).toBe('0.5')
  })

  it('returns the floorPrice prop when localValue is empty', () => {
    expect(
      previewFloorPriceForFdvUsdDraft({
        ...baseParams,
        isParentControlled: false,
        floorPrice: '0.5',
        localValue: '   ',
      }),
    ).toBe('0.5')
  })

  it('returns the floorPrice prop when draft would clamp below the minimum (no clamp propagation)', () => {
    expect(
      previewFloorPriceForFdvUsdDraft({
        ...baseParams,
        isParentControlled: false,
        floorPrice: '0.5',
        localValue: '0.00000001',
      }),
    ).toBe('0.5')
  })

  it('returns the floorPrice prop when usdPriceNum is missing', () => {
    expect(
      previewFloorPriceForFdvUsdDraft({
        ...baseParams,
        usdPriceNum: null,
        isParentControlled: false,
        floorPrice: '0.5',
        localValue: '900000',
      }),
    ).toBe('0.5')
  })

  it('returns derived canonical floor for a valid FDV-in-USD draft', () => {
    // FDV $ 3e12 with usd=3000, supply=1e9 → fdv_raise = 1e9 raise tokens → floor = 1 raise per token
    const result = previewFloorPriceForFdvUsdDraft({
      ...baseParams,
      isParentControlled: false,
      floorPrice: '0.5',
      localValue: String(3e12),
    })
    expect(result).toBe('1')
  })
})

describe('pickDisplayValueForToggleTarget', () => {
  const baseDerivationParams = {
    floorPrice: '0.01',
    hasValidFloorPrice: true,
    tokenTotalSupply: supply1e9,
    raiseCurrency: ethRaise,
    usdPriceNum: 3000,
  } as const

  it('returns the snapshot rawValue when the snapshot matches the target mode and canonical', () => {
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'usd',
      ...baseDerivationParams,
      floorPriceInput: {
        floorPrice: '0.01',
        rawValue: '1000',
        denomination: 'fdv',
        inputCurrency: 'usd',
      },
    })
    expect(result).toBe('1000')
  })

  it('falls back to derivation when the snapshot is undefined', () => {
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'raise',
      ...baseDerivationParams,
      floorPriceInput: undefined,
    })
    // 0.01 ETH × 1e9 supply = 10000000 raise FDV
    expect(result).toBe('10000000')
  })

  it('converts the snapshot across denominations when only denomination differs (fdv → floorPrice)', () => {
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'floorPrice',
      targetInputCurrency: 'usd',
      ...baseDerivationParams,
      floorPriceInput: {
        floorPrice: '0.01',
        rawValue: '1000',
        denomination: 'fdv',
        inputCurrency: 'usd',
      },
    })
    // 1000 USD FDV ÷ 1e9 supply = 0.000001 USD per token (exact, no canonical roundtrip)
    expect(result).toBe('0.000001')
  })

  it('falls back to derivation when the snapshot is for a different input currency', () => {
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'raise',
      ...baseDerivationParams,
      floorPriceInput: {
        floorPrice: '0.01',
        rawValue: '1000',
        denomination: 'fdv',
        inputCurrency: 'usd',
      },
    })
    expect(result).toBe('10000000')
  })

  it('falls back to derivation when the snapshot floorPrice does not match the canonical floor', () => {
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'usd',
      ...baseDerivationParams,
      // Different canonical → snapshot is stale.
      floorPriceInput: {
        floorPrice: '0.00000001',
        rawValue: '1000',
        denomination: 'fdv',
        inputCurrency: 'usd',
      },
    })
    // 0.01 ETH × 1e9 × 3000 = 3e10 USD FDV → not "1000"
    expect(result).not.toBe('1000')
  })

  it('preserves a USD-rounded snapshot across a derivation that would drift via float math', () => {
    // Simulate the user's report: USD FDV $1000 with usd=3000 stores a canonical with truncated
    // precision. A pure derivation through `0.333333333 × 3000` lands on 999.999… in JS float.
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'usd',
      floorPrice: '0.000000000333333333',
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
      usdPriceNum: 3000,
      floorPriceInput: {
        floorPrice: '0.000000000333333333',
        rawValue: '1000',
        denomination: 'fdv',
        inputCurrency: 'usd',
      },
    })
    expect(result).toBe('1000')
    expect(result).not.toMatch(/999\.999/)
  })

  it('converts a typed $1 USD floor-price snapshot to $1B FDV via × supply (no float drift)', () => {
    // User's reported case: typed "1" USD/token with supply 1e9, then toggled through ETH/token,
    // ETH FDV, USD FDV. Without this path the USD FDV derivation goes ETH → USD via float and
    // lands on 999,999,999.… instead of 1,000,000,000.
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'usd',
      floorPrice: '0.000333333333',
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
      usdPriceNum: 3000,
      floorPriceInput: {
        floorPrice: '0.000333333333',
        rawValue: '1',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
      },
    })
    expect(result).toBe('1000000000')
    expect(result).not.toMatch(/999/)
  })

  it('converts a typed raise-currency floor-price snapshot to FDV in the same currency', () => {
    // 0.5 ETH/token snapshot × 1e9 supply = 5e8 ETH FDV. inputCurrency matches; denomination differs.
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'raise',
      floorPrice: '0.5',
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
      usdPriceNum: 3000,
      floorPriceInput: {
        floorPrice: '0.5',
        rawValue: '0.5',
        denomination: 'floorPrice',
        inputCurrency: 'raise',
      },
    })
    expect(result).toBe('500000000')
  })

  it('does not use the denomination-conversion path when the canonical floor has drifted', () => {
    // Snapshot canonical no longer matches current canonical → snapshot is stale, fall through to
    // `getDisplayValueForMode`.
    const result = pickDisplayValueForToggleTarget({
      targetDenomination: 'fdv',
      targetInputCurrency: 'usd',
      floorPrice: '0.000333333333',
      hasValidFloorPrice: true,
      tokenTotalSupply: supply1e9,
      raiseCurrency: ethRaise,
      usdPriceNum: 3000,
      floorPriceInput: {
        floorPrice: '0.999',
        rawValue: '1',
        denomination: 'floorPrice',
        inputCurrency: 'usd',
      },
    })
    // Should NOT be "1000000000" (denomination conversion) — falls through to derivation.
    expect(result).not.toBe('1000000000')
  })
})
