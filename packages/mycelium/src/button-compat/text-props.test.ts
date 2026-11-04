import { describe, expect, it } from 'vitest'
import { buttonTextCallerColor, buttonTextDroppedStyleNames } from './text-props'

const ENABLED = { isDisabled: false, customTextClass: undefined }

describe('buttonTextCallerColor', () => {
  it('returns nothing to apply when no color is set', () => {
    expect(buttonTextCallerColor(undefined, ENABLED)).toEqual({ tokenClassName: '', pin: undefined })
  })

  it('hands a theme token to the class resolver, in every state', () => {
    const expected = { tokenClassName: '[color:var(--stext-neutral2)]', pin: undefined }
    expect(buttonTextCallerColor('$neutral2', ENABLED)).toEqual(expected)
    expect(buttonTextCallerColor('$neutral2', { isDisabled: true, customTextClass: 'text-white' })).toEqual(expected)
  })

  it('pins a hex color unless the disabled palette or a custom background contrast class owns the label', () => {
    expect(buttonTextCallerColor('#FF00AA', ENABLED)).toEqual({ tokenClassName: '', pin: '#FF00AA' })
    expect(buttonTextCallerColor('#FF00AA', { isDisabled: true, customTextClass: undefined }).pin).toBeUndefined()
    expect(buttonTextCallerColor('#FF00AA', { isDisabled: false, customTextClass: 'text-white' }).pin).toBeUndefined()
  })
})

describe('buttonTextDroppedStyleNames', () => {
  it('never reports the props the native leg wires or treats as inert', () => {
    expect(
      buttonTextDroppedStyleNames({
        variant: 'critical',
        color: '$neutral2',
        fontSize: 14,
        animation: 'fast',
        opacity: 0.5,
      }),
    ).toEqual(['opacity'])
  })
})
