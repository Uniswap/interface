import { renderHook } from '@testing-library/react'
import { AnimatedFlex as MyceliumAnimatedFlex, Flex as MyceliumFlex, Text } from '@universe/mycelium'
import { useIsStringOrTransTag } from 'ui/src/components/buttons/Button/hooks/useIsStringOrTransTag'
import { AnimatedFlex as UiAnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { Trans } from 'ui/src/i18n/Trans'

describe('useIsStringOrTransTag', () => {
  it('is true for a plain string child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag('Swap'))
    expect(result.current).toBe(true)
  })

  it('is true for a single Trans child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag(<Trans i18nKey="common.button.swap" />))
    expect(result.current).toBe(true)
  })

  it('is false for a mycelium Flex child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag(<MyceliumFlex />))
    expect(result.current).toBe(false)
  })

  // AnimatedFlex is a Flex in Reanimated clothing — a converted call site that
  // swaps Flex for AnimatedFlex (e.g. the mobile TDP CTA fade) must not flip
  // the Button render path into CustomButtonText.
  it('is false for the ui/src AnimatedFlex child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag(<UiAnimatedFlex />))
    expect(result.current).toBe(false)
  })

  it('is false for a mycelium AnimatedFlex child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag(<MyceliumAnimatedFlex />))
    expect(result.current).toBe(false)
  })

  it('is true for any other element child', () => {
    const { result } = renderHook(() => useIsStringOrTransTag(<Text>label</Text>))
    expect(result.current).toBe(true)
  })

  it('is false for multiple children', () => {
    const { result } = renderHook(() => useIsStringOrTransTag([<Text key="a">a</Text>, <Text key="b">b</Text>]))
    expect(result.current).toBe(false)
  })
})
