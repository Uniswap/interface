/**
 * Class-emission pin for `buttonCompatVisualClasses` (INFRA-3709/3750/3754).
 * `dimensions.test.ts` only pins which keys are wired vs. dropped on native;
 * this pins the actual Tailwind class strings each prop emits.
 */
import { describe, expect, it } from 'vitest'
import { buttonCompatVisualClasses } from './visual-props'

describe('buttonCompatVisualClasses', () => {
  it('emits nothing for an empty props object', () => {
    expect(buttonCompatVisualClasses({})).toEqual([])
  })

  it('alignItems maps through the shared enum lane', () => {
    expect(buttonCompatVisualClasses({ alignItems: 'center' })).toEqual(['items-center'])
  })

  it('alignItems falls back to the arbitrary-property twin for an unmapped value', () => {
    expect(buttonCompatVisualClasses({ alignItems: 'unset' as never })).toEqual(['[align-items:unset]'])
  })

  it('position and top compile via the shared position/top pair', () => {
    expect(buttonCompatVisualClasses({ position: 'absolute', top: 0 })).toEqual(['absolute', 'top-[0px]'])
  })

  it('opacity and flexShrink emit plain arbitrary-value classes, unscaled', () => {
    expect(buttonCompatVisualClasses({ opacity: 0.4 })).toEqual(['opacity-[0.4]'])
    expect(buttonCompatVisualClasses({ flexShrink: 1 })).toEqual(['shrink-[1]'])
  })

  it('flexGrow emits a lone grow utility and overflow the shared overflow utility', () => {
    expect(buttonCompatVisualClasses({ flexGrow: 1 })).toEqual(['grow-[1]'])
    expect(buttonCompatVisualClasses({ overflow: 'hidden' })).toEqual(['overflow-hidden'])
    expect(buttonCompatVisualClasses({ overflow: 'unset' })).toEqual(['[overflow:unset]'])
  })

  it('the shadow trio delegates to the shared universal-surface compiler', () => {
    expect(buttonCompatVisualClasses({ shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 10 })).toEqual([
      '[box-shadow:0px_0px_10px_color-mix(in_srgb,_#000000_4%,_transparent)]',
    ])
  })

  it('composes every prop together in declaration order', () => {
    expect(
      buttonCompatVisualClasses({
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        opacity: 0.4,
        flexShrink: 1,
      }),
    ).toEqual(['items-center', 'absolute', 'top-[0px]', 'opacity-[0.4]', 'shrink-[1]'])
  })
})
