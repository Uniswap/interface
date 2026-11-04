/**
 * The native leg's dimension pick (INFRA-3661 review): the wired slice is
 * DERIVED — `DIMENSION_PROP_KEYS` minus `NATIVE_DROPPED_DIMENSION_PROP_KEYS` —
 * so the only way a dimension prop can miss the native lane is by being listed
 * in the exclusion set. This file pins that set to the exact web-only keys the
 * leg dev-warns: growing it is a deliberate, test-visible act, and a prop
 * added to `ButtonCompatDimensionProps` lands in the wired pick automatically.
 */
import { describe, expect, it } from 'vitest'
import { DIMENSION_PROP_KEYS, type ButtonCompatDimensionProps } from './dimensions'
import {
  buttonCompatNativeDimensions,
  buttonCompatNativeDroppedDimensionNames,
  NATIVE_DIMENSION_PROP_KEYS,
  NATIVE_DROPPED_DIMENSION_PROP_KEYS,
} from './native-dimensions'

/** Every dimension prop set at once, with a type-valid value per lane. */
function everyDimensionSet(): ButtonCompatDimensionProps {
  const props: ButtonCompatDimensionProps = {
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderColor: '$neutral3',
    display: 'none',
    alignItems: 'center',
    position: 'absolute',
    shadowColor: '#000000',
    overflow: 'hidden',
  }
  for (const key of DIMENSION_PROP_KEYS) {
    // Chained `!==` rather than a Set: only the comparisons narrow the key
    // union, and the numeric write needs `props[key]` narrowed to the lanes
    // that actually accept a number.
    if (
      key !== 'justifyContent' &&
      key !== 'alignSelf' &&
      key !== 'borderColor' &&
      key !== 'display' &&
      key !== 'alignItems' &&
      key !== 'position' &&
      key !== 'shadowColor' &&
      key !== 'overflow'
    ) {
      props[key] = 1
    }
  }
  return props
}

describe('the native dimension pick derives from DIMENSION_PROP_KEYS minus a pinned exclusion set', () => {
  it('excludes exactly the web-only props the leg dev-warns — nothing more', () => {
    // Growing this set is how a prop stops painting on native with no warning
    // beyond the ledger, so it must never grow as a side effect of another edit.
    // `width`/`flex` (INFRA-3750) and `borderRadius` (the SwapFormDecimalPad
    // presets) moved OUT of this set: their native call sites need them to render.
    expect([...NATIVE_DROPPED_DIMENSION_PROP_KEYS].sort()).toEqual(
      ['alignItems', 'alignSelf', 'display', 'flexBasis', 'height', 'justifyContent', 'position', 'top'].sort(),
    )
  })

  it('wired + dropped partition the full key set with no overlap and no gap', () => {
    expect(NATIVE_DIMENSION_PROP_KEYS.length + NATIVE_DROPPED_DIMENSION_PROP_KEYS.length).toBe(
      DIMENSION_PROP_KEYS.length,
    )
    expect([...NATIVE_DIMENSION_PROP_KEYS, ...NATIVE_DROPPED_DIMENSION_PROP_KEYS].sort()).toEqual(
      [...DIMENSION_PROP_KEYS].sort(),
    )
  })

  it('picks every wired key — the fourteen margin spellings included — and none of the dropped ones', () => {
    const picked = buttonCompatNativeDimensions(everyDimensionSet())
    expect(Object.keys(picked).sort()).toEqual([...NATIVE_DIMENSION_PROP_KEYS].sort())
  })

  it('reports exactly the dropped keys actually set, for the dev-warn ledger', () => {
    expect(buttonCompatNativeDroppedDimensionNames(everyDimensionSet()).sort()).toEqual(
      [...NATIVE_DROPPED_DIMENSION_PROP_KEYS].sort(),
    )
    // `width` is now WIRED (INFRA-3750); `height` stays the pinned web-only case.
    expect(buttonCompatNativeDroppedDimensionNames({ mt: 8, height: 100 })).toEqual(['height'])
  })

  it('skips unset keys entirely rather than carrying undefined entries', () => {
    expect(buttonCompatNativeDimensions({ mt: 8, width: 100 })).toEqual({ mt: 8, width: 100 })
  })
})

describe('non-token borderColor on the native pick (resolve-or-drop, the overflow/shadowColor doctrine)', () => {
  it('drops CSS-only keyword colours RN cannot parse and reports them for the dev-warn ledger', () => {
    expect(buttonCompatNativeDimensions({ borderColor: 'unset' })).toEqual({})
    expect(buttonCompatNativeDroppedDimensionNames({ borderColor: 'unset' })).toEqual(['borderColor'])
  })

  it('keeps semantic tokens (class lane) and RN-parseable colours (style lane)', () => {
    expect(buttonCompatNativeDimensions({ borderColor: '$neutral3' })).toEqual({ borderColor: '$neutral3' })
    expect(buttonCompatNativeDimensions({ borderColor: '#123456' })).toEqual({ borderColor: '#123456' })
    expect(buttonCompatNativeDroppedDimensionNames({ borderColor: '$neutral3' })).toEqual([])
  })
})
