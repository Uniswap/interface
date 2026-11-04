import { fireEvent, render } from '@testing-library/react'
import { type ReactElement, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { colorsLight } from '../theme-hooks-compat/palette'
import { InputCompat as Input } from './InputCompat'
import { resolveTamaguiSpaceVars } from './resolve'

/**
 * Behavior of the Input compat's web leg: RN prop surface → DOM mapping, the
 * ::placeholder/::selection runtime rule delivery, $sm/$md breakpoint activation on the
 * exact queries Tamagui compiled to, the `groupHoverStyle` DOM-listener path against the
 * real call sites' `t_group` markup, and the Tamagui styled(Input) wrapper delivery contract.
 */

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

function normalizedColor(value: string): string {
  const trimmed = value.trim()
  const hex = /^#([0-9a-fA-F]{6})$/.exec(trimmed)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    // oxlint-disable-next-line no-bitwise -- hex channel unpacking
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
  }
  const match = /^rgba?\(([^)]+)\)$/.exec(trimmed)
  if (!match || !match[1]) {
    return trimmed
  }
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()))
  return parts.slice(0, 3).join(',')
}

describe('RN prop surface → DOM mapping', () => {
  it('renders a textarea only for multiline, with numberOfLines mapped to rows (RNW parity)', () => {
    const { getByTestId } = render(
      <>
        <Input multiline numberOfLines={3} testID="multi" />
        <Input numberOfLines={3} testID="lines" />
        <Input testID="single" />
        <Input multiline secureTextEntry testID="multi-secure" />
      </>,
    )
    const multi = getByTestId('multi')
    expect(multi.tagName).toBe('TEXTAREA')
    expect((multi as HTMLTextAreaElement).rows).toBe(3)
    // numberOfLines alone never switched RNW to a textarea.
    expect(getByTestId('lines').tagName).toBe('INPUT')
    expect(getByTestId('single').tagName).toBe('INPUT')
    // Pinned RNW divergence-free behavior: multiline wins over secureTextEntry (unmasked textarea).
    expect(getByTestId('multi-secure').tagName).toBe('TEXTAREA')
  })

  it('derives type and inputMode from keyboardType/secureTextEntry exactly as RNW did', () => {
    const { getByTestId } = render(
      <>
        <Input secureTextEntry testID="secret" />
        <Input keyboardType="decimal-pad" testID="decimal" />
        <Input keyboardType="numeric" testID="numeric" />
        <Input keyboardType="email-address" testID="email" />
        <Input keyboardType="phone-pad" testID="tel" />
        <Input keyboardType="url" testID="url" />
        <Input keyboardType="web-search" testID="search" />
        <Input testID="plain" />
      </>,
    )
    expect((getByTestId('secret') as HTMLInputElement).type).toBe('password')
    // Numeric family: inputMode only, no type attribute (RNW left type undefined).
    expect(getByTestId('decimal').getAttribute('inputmode')).toBe('decimal')
    expect(getByTestId('decimal').hasAttribute('type')).toBe(false)
    expect(getByTestId('numeric').getAttribute('inputmode')).toBe('numeric')
    expect((getByTestId('email') as HTMLInputElement).type).toBe('email')
    expect((getByTestId('tel') as HTMLInputElement).type).toBe('tel')
    expect((getByTestId('url') as HTMLInputElement).type).toBe('url')
    expect((getByTestId('search') as HTMLInputElement).type).toBe('search')
    // No keyboardType/inputMode/secureTextEntry: no type attribute, matching the legacy render.
    expect(getByTestId('plain').hasAttribute('type')).toBe(false)
  })

  it('exposes clear() and isFocused() on the forwarded ref like RNW (SearchTextInput cancel path)', () => {
    let ref: { clear?: () => void; isFocused?: () => boolean } | null = null
    const { getByTestId } = render(
      <Input
        defaultValue="uni"
        testID="clearable"
        ref={(r) => {
          ref = r as unknown as { clear?: () => void; isFocused?: () => boolean }
        }}
      />,
    )
    const el = getByTestId('clearable') as HTMLInputElement
    const host = ref as unknown as { clear: () => void; isFocused: () => boolean }
    expect(typeof host.clear).toBe('function')
    expect(host.isFocused()).toBe(false)
    el.focus()
    expect(host.isFocused()).toBe(true)
    host.clear()
    expect(el.value).toBe('')
  })

  it('maps disabled to readOnly, never to the DOM disabled attribute (legacy contract)', () => {
    const { getByTestId } = render(
      <>
        <Input disabled testID="disabled" />
        <Input editable={false} testID="uneditable" />
        <Input testID="enabled" />
        <Input {...({ readOnly: true } as Record<string, unknown>)} testID="dom-readonly" />
      </>,
    )
    const disabled = getByTestId('disabled') as HTMLInputElement
    expect(disabled.readOnly).toBe(true)
    expect(disabled.disabled).toBe(false)
    expect((getByTestId('uneditable') as HTMLInputElement).readOnly).toBe(true)
    expect((getByTestId('enabled') as HTMLInputElement).readOnly).toBe(false)
    // A consumer-passed DOM readOnly is not clobbered by the editable/disabled derivation.
    expect((getByTestId('dom-readonly') as HTMLInputElement).readOnly).toBe(true)
  })

  it('fires onChangeText with the new string and onChange with the event', () => {
    const onChangeText = vi.fn()
    const onChange = vi.fn()
    const { getByTestId } = render(
      <Input defaultValue="" testID="typed" onChange={onChange} onChangeText={onChangeText} />,
    )
    fireEvent.change(getByTestId('typed'), { target: { value: 'hayden.eth' } })
    expect(onChangeText).toHaveBeenCalledWith('hayden.eth')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('fires onSubmitEditing on Enter with RN event shape, transcribing RNW guards', () => {
    const onSubmitEditing = vi.fn()
    const { getByTestId } = render(
      <>
        <Input defaultValue="0x123" testID="submit" onSubmitEditing={onSubmitEditing} />
        <Input multiline defaultValue="para" testID="noSubmit" onSubmitEditing={onSubmitEditing} />
        <Input blurOnSubmit multiline defaultValue="para" testID="blurSubmit" onSubmitEditing={onSubmitEditing} />
      </>,
    )
    // preventDefault must fire before onSubmitEditing (no wrapping-<form> submit, no newline);
    // fireEvent returns false when the event was defaultPrevented.
    expect(fireEvent.keyDown(getByTestId('submit'), { key: 'Enter' })).toBe(false)
    expect(onSubmitEditing).toHaveBeenCalledTimes(1)
    expect(onSubmitEditing.mock.calls[0]?.[0]?.nativeEvent?.text).toBe('0x123')
    // Shift+Enter and IME confirmation (keyCode 229) never submit.
    fireEvent.keyDown(getByTestId('submit'), { key: 'Enter', shiftKey: true })
    fireEvent.keyDown(getByTestId('submit'), { key: 'Enter', keyCode: 229 })
    expect(onSubmitEditing).toHaveBeenCalledTimes(1)
    // Multiline without blurOnSubmit inserts a newline instead of submitting…
    fireEvent.keyDown(getByTestId('noSubmit'), { key: 'Enter' })
    expect(onSubmitEditing).toHaveBeenCalledTimes(1)
    // …but multiline with blurOnSubmit submits, exactly as RNW did.
    fireEvent.keyDown(getByTestId('blurSubmit'), { key: 'Enter' })
    expect(onSubmitEditing).toHaveBeenCalledTimes(2)
  })

  it('populates nativeEvent.text on change/focus/blur the way RNW did', () => {
    const texts: Array<string | undefined> = []
    const read = (e: unknown): void => {
      texts.push((e as { nativeEvent: { text?: string } }).nativeEvent.text)
    }
    const { getByTestId } = render(
      <Input defaultValue="junk" testID="native-text" onBlur={read} onChange={read} onFocus={read} />,
    )
    const el = getByTestId('native-text')
    fireEvent.change(el, { target: { value: 'junk word' } })
    fireEvent.focus(el)
    fireEvent.blur(el)
    expect(texts).toEqual(['junk word', 'junk word', 'junk word'])
  })

  it('propagates typing through a controlled RN-shaped onChange consumer (extension seed-phrase import path)', () => {
    // Mirrors ImportMnemonic's RecoveryPhraseWord: controlled value + an onChange handler
    // that reads event.nativeEvent.text and gates the Next button on the committed state.
    function SeedWord(): ReactElement {
      const [word, setWord] = useState('')
      return (
        <>
          <Input
            testID="seed-word"
            value={word}
            onChange={(e) => {
              const text = (e as unknown as { nativeEvent: { text: string } }).nativeEvent.text
              setWord(text.trim())
            }}
          />
          <button data-testid="next" disabled={word.length === 0} type="button" />
        </>
      )
    }
    const { getByTestId } = render(<SeedWord />)
    fireEvent.change(getByTestId('seed-word'), { target: { value: 'junk' } })
    expect((getByTestId('seed-word') as HTMLInputElement).value).toBe('junk')
    expect((getByTestId('next') as HTMLButtonElement).disabled).toBe(false)
  })

  it('onKeyPress handlers read nativeEvent.key as on RN', () => {
    const seen: string[] = []
    const { getByTestId } = render(
      <Input
        testID="keys"
        onKeyPress={(e) => {
          seen.push((e as { nativeEvent: { key: string } }).nativeEvent.key)
        }}
      />,
    )
    fireEvent.keyDown(getByTestId('keys'), { key: 'Backspace' })
    expect(seen).toEqual(['Backspace'])
  })

  it('forwards the DOM element on ref like the legacy web Input did', () => {
    let node: unknown
    render(
      <Input
        testID="reffed"
        ref={(r) => {
          node = r
        }}
      />,
    )
    expect((node as HTMLElement).tagName).toBe('INPUT')
  })

  it('does not leak style-surface props onto the DOM element as attributes', () => {
    const { getByTestId } = render(<Input fontSize={16} lineHeight={24} minWidth={0} testID="clean" width="100%" />)
    const el = getByTestId('clean')
    for (const attr of ['fontsize', 'font-size', 'lineheight', 'minwidth', 'width']) {
      expect(el.hasAttribute(attr), attr).toBe(false)
    }
  })

  it('keeps testID → data-testid and accessibilityLabel → aria-label', () => {
    const { getByTestId } = render(<Input accessibilityLabel="Amount" testID="a11y" />)
    expect(getByTestId('a11y').getAttribute('aria-label')).toBe('Amount')
  })

  it('falls back to the frame defaults when a font token is unknown for the family in effect', () => {
    // $subHeading has no $medium size; an unknown weight token must not erase the default either.
    const { getByTestId } = render(
      <Input fontFamily="$subHeading" fontSize="$medium" fontWeight="$bogus" testID="fallback" />,
    )
    const el = getByTestId('fallback') as HTMLElement
    expect(el.style.fontSize).toBe('16px')
    expect(el.style.fontWeight).toBe('535')
  })

  it('chains passthrough onMouseEnter/onMouseLeave with the hover state instead of clobbering them', () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const { getByTestId } = render(
      <Input
        {...({ onMouseEnter, onMouseLeave } as Record<string, unknown>)}
        hoverStyle={{ opacity: 0.5 }}
        testID="mouse-chained"
      />,
    )
    const el = getByTestId('mouse-chained') as HTMLElement
    fireEvent.mouseEnter(el)
    expect(onMouseEnter).toHaveBeenCalledTimes(1)
    expect(el.style.opacity).toBe('0.5')
    fireEvent.mouseLeave(el)
    expect(onMouseLeave).toHaveBeenCalledTimes(1)
    // A hoverStyle opacity with no base opacity synthesizes a resting `opacity: 1`, as legacy Tamagui did.
    expect(el.style.opacity).toBe('1')
  })

  it('does not clobber consumer-passed aria-label or enterKeyHint with undefined', () => {
    const props = { 'aria-label': 'Recipient', enterKeyHint: 'search' } as const
    const { getByTestId } = render(<Input {...props} testID="direct" />)
    expect(getByTestId('direct').getAttribute('aria-label')).toBe('Recipient')
    expect(getByTestId('direct').getAttribute('enterkeyhint')).toBe('search')
  })

  it('derives spellCheck from autoCorrect the way RNW did (seed-phrase/password privacy)', () => {
    const { getByTestId } = render(
      <>
        <Input autoCorrect={false} testID="no-correct" />
        <Input autoCorrect={false} spellCheck testID="explicit-spellcheck" />
        <Input testID="neither" />
      </>,
    )
    expect(getByTestId('no-correct').getAttribute('spellcheck')).toBe('false')
    expect(getByTestId('explicit-spellcheck').getAttribute('spellcheck')).toBe('true')
    expect(getByTestId('neither').hasAttribute('spellcheck')).toBe(false)
  })

  it('drops RN-only props and `pattern` instead of forwarding them to the DOM', () => {
    const { getByTestId } = render(
      <Input
        // Exercising the untyped passthrough SendRecipientForm uses.
        {...({ pattern: '^(0x[a-fA-F0-9]{40})$' } as unknown as Record<string, string>)}
        clearButtonMode="while-editing"
        importantForAutofill="no"
        testID="rn-only"
        underlineColorAndroid="transparent"
        onEndEditing={() => {}}
      />,
    )
    const el = getByTestId('rn-only')
    for (const attr of ['pattern', 'clearbuttonmode', 'importantforautofill', 'underlinecolorandroid']) {
      expect(el.hasAttribute(attr), attr).toBe(false)
    }
  })

  it('implements the selection surface the way RNW did (onSelectionChange, selection, selectTextOnFocus)', () => {
    vi.useFakeTimers()
    try {
      const seen: Array<{ start: number | null; end: number | null }> = []
      const { getByTestId } = render(
        <>
          <Input
            defaultValue="uniswap"
            testID="selectable"
            onSelectionChange={(e) => {
              seen.push(
                (e as unknown as { nativeEvent: { selection: { start: number | null; end: number | null } } })
                  .nativeEvent.selection,
              )
            }}
          />
          <Input defaultValue="uniswap" selection={{ start: 1, end: 3 }} testID="controlled-selection" />
          <Input selectTextOnFocus defaultValue="select me" testID="select-on-focus" />
        </>,
      )
      const el = getByTestId('selectable') as HTMLInputElement
      el.setSelectionRange(2, 5)
      fireEvent.select(el)
      expect(seen).toEqual([{ start: 2, end: 5 }])

      const controlled = getByTestId('controlled-selection') as HTMLInputElement
      expect(controlled.selectionStart).toBe(1)
      expect(controlled.selectionEnd).toBe(3)

      const focusSelect = getByTestId('select-on-focus') as HTMLInputElement
      focusSelect.focus()
      vi.runAllTimers()
      expect(focusSelect.selectionStart).toBe(0)
      expect(focusSelect.selectionEnd).toBe('select me'.length)
    } finally {
      vi.useRealTimers()
    }
  })

  it('hides the caret for caretHidden and fires onLayout from the resize observer (RNW parity)', () => {
    const layouts: Array<{ width: number; height: number }> = []
    const observed: Element[] = []
    const OriginalResizeObserver = (globalThis as { ResizeObserver?: unknown }).ResizeObserver
    class FakeResizeObserver {
      private readonly callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
      }
      observe(el: Element): void {
        observed.push(el)
        this.callback()
      }
      disconnect(): void {}
    }
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeResizeObserver
    try {
      const { getByTestId } = render(
        <Input
          caretHidden
          testID="layout"
          onLayout={(e) => {
            layouts.push(
              (e as unknown as { nativeEvent: { layout: { width: number; height: number } } }).nativeEvent.layout,
            )
          }}
        />,
      )
      const el = getByTestId('layout') as HTMLElement
      expect(el.style.caretColor).toBe('transparent')
      expect(observed).toEqual([el])
      expect(layouts.length).toBe(1)
      expect(layouts[0]).toHaveProperty('width')
      expect(layouts[0]).toHaveProperty('height')
    } finally {
      ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = OriginalResizeObserver
    }
  })

  it('resolves tokens and shorthands inside $platform-web instead of emitting invalid CSS', () => {
    const { getByTestId } = render(
      <Input
        $platform-web={{ backgroundColor: '$surface2', paddingHorizontal: 6 } as Record<string, unknown>}
        testID="pweb"
      />,
    )
    const el = getByTestId('pweb') as HTMLElement
    expect(normalizedColor(el.style.backgroundColor)).toBe(normalizedColor(colorsLight.surface2))
    expect(el.style.paddingLeft).toBe('6px')
    expect(el.style.paddingRight).toBe('6px')
  })

  it('expands RN shorthands arriving through the style prop into valid CSS (RNW parity)', () => {
    const { getByTestId } = render(
      <Input
        style={{ paddingHorizontal: 12, marginVertical: 4, shadowColor: '#000000', shadowRadius: 2 }}
        testID="shorthands"
      />,
    )
    const el = getByTestId('shorthands') as HTMLElement
    expect(el.style.paddingLeft).toBe('12px')
    expect(el.style.paddingRight).toBe('12px')
    expect(el.style.marginTop).toBe('4px')
    expect(el.style.marginBottom).toBe('4px')
    expect(el.style.boxShadow).toBe('0px 0px 2px #000000')
    // The invalid CSS never reaches the element.
    expect(el.style.getPropertyValue('padding-horizontal')).toBe('')
  })

  it('resolves overlapping edge shorthands by prop order, not specificity (legacy engine parity)', () => {
    // The uniswap TextInput wrapper renders <Input py="$spacing12" px="$spacing16" {...rest} /> —
    // a caller's later p="$none" must zero all four edges, as it did under Tamagui.
    const props = { py: '$spacing12', px: '$spacing16', p: '$none' } as const
    const reversed = { p: '$none', py: '$spacing12', px: '$spacing16' } as const
    const { getByTestId } = render(
      <>
        <Input {...props} testID="later-p-wins" />
        <Input {...reversed} testID="later-py-wins" />
      </>,
    )
    const laterP = getByTestId('later-p-wins') as HTMLElement
    expect(laterP.style.paddingTop).toBe('0px')
    expect(laterP.style.paddingBottom).toBe('0px')
    expect(laterP.style.paddingLeft).toBe('0px')
    expect(laterP.style.paddingRight).toBe('0px')
    const laterPy = getByTestId('later-py-wins') as HTMLElement
    expect(laterPy.style.paddingTop).toBe('12px')
    expect(laterPy.style.paddingBottom).toBe('12px')
    expect(laterPy.style.paddingLeft).toBe('16px')
    expect(laterPy.style.paddingRight).toBe('16px')
  })

  it('resolves overlapping edge keys in the style prop by specificity, not key order (RN parity)', () => {
    // RN gives a longhand precedence over an overlapping shorthand within one style object
    // regardless of insertion order — unlike JSX props, which resolve by order.
    const { getByTestId } = render(
      <>
        <Input
          style={{ paddingLeft: 0, paddingTop: 0, paddingHorizontal: 12, paddingVertical: 12 }}
          testID="longhand-first"
        />
        <Input
          style={{ paddingHorizontal: 12, paddingVertical: 12, paddingLeft: 0, paddingTop: 0 }}
          testID="longhand-last"
        />
      </>,
    )
    for (const id of ['longhand-first', 'longhand-last']) {
      const el = getByTestId(id) as HTMLElement
      expect(el.style.paddingLeft, id).toBe('0px')
      expect(el.style.paddingRight, id).toBe('12px')
      expect(el.style.paddingTop, id).toBe('0px')
      expect(el.style.paddingBottom, id).toBe('12px')
    }
  })
})

describe('style layer precedence (legacy cascade specificity)', () => {
  it('focusStyle wins over style props, but a literal RN style prop wins over focusStyle', () => {
    const { getByTestId } = render(
      <>
        <Input borderColor="$surface3" focusStyle={{ borderColor: '$accent1' }} testID="prop-base" />
        <Input
          borderColor="$surface3"
          focusStyle={{ borderColor: '$accent1' }}
          style={{ borderColor: colorsLight.statusCritical }}
          testID="style-base"
        />
      </>,
    )
    const propBase = getByTestId('prop-base') as HTMLElement
    expect(normalizedColor(propBase.style.borderColor), 'prop base').toBe(normalizedColor(colorsLight.surface3))
    fireEvent.focus(propBase)
    expect(normalizedColor(propBase.style.borderColor), 'prop focused').toBe(normalizedColor(colorsLight.accent1))

    // Legacy pseudo styles compiled to CSS classes, which lose to an inline `style` attribute.
    const styleBase = getByTestId('style-base') as HTMLElement
    fireEvent.focus(styleBase)
    expect(normalizedColor(styleBase.style.borderColor), 'style focused').toBe(
      normalizedColor(colorsLight.statusCritical),
    )
  })

  it('hoverStyle wins over style props, but a literal RN style prop wins over hoverStyle', () => {
    const { getByTestId } = render(
      <>
        <Input backgroundColor="$surface1" hoverStyle={{ backgroundColor: '$surface1Hovered' }} testID="prop-base" />
        <Input
          backgroundColor="$surface1"
          hoverStyle={{ backgroundColor: '$surface1Hovered' }}
          style={{ backgroundColor: colorsLight.surface2 }}
          testID="style-base"
        />
      </>,
    )
    const propBase = getByTestId('prop-base') as HTMLElement
    fireEvent.mouseEnter(propBase)
    expect(normalizedColor(propBase.style.backgroundColor), 'prop hovered').toBe(
      normalizedColor(colorsLight.surface1Hovered),
    )
    fireEvent.mouseLeave(propBase)
    expect(normalizedColor(propBase.style.backgroundColor), 'prop unhovered').toBe(
      normalizedColor(colorsLight.surface1),
    )

    const styleBase = getByTestId('style-base') as HTMLElement
    fireEvent.mouseEnter(styleBase)
    expect(normalizedColor(styleBase.style.backgroundColor), 'style hovered').toBe(
      normalizedColor(colorsLight.surface2),
    )
  })
})

describe('::placeholder / ::selection runtime rule delivery', () => {
  it('delivers placeholderTextColor via the attribute-keyed pseudo rule + inline CSS var', () => {
    const { getByTestId } = render(<Input placeholderTextColor="$neutral2" testID="ph" />)
    const el = getByTestId('ph') as HTMLElement
    expect(el.hasAttribute('data-uds-placeholder')).toBe(true)
    expect(normalizedColor(el.style.getPropertyValue('--uds-input-placeholder'))).toBe(
      normalizedColor(colorsLight.neutral2),
    )
    const rule = document.querySelector('style[data-uds-input-pseudo]')
    expect(rule?.textContent).toContain('[data-uds-placeholder]::placeholder{color:var(--uds-input-placeholder)')
    // opacity:1 matches the legacy RNW placeholder rule
    expect(rule?.textContent).toContain('opacity:1')
  })

  it('injects the pseudo rules exactly once across concurrent mounts', () => {
    render(
      <>
        <Input placeholderTextColor="$neutral2" testID="one" />
        <Input placeholderTextColor="$neutral3" testID="two" />
        <Input selectionColor="$accent1" testID="three" />
      </>,
    )
    render(<Input placeholderTextColor="$neutral2" testID="four" />)
    expect(document.querySelectorAll('style[data-uds-input-pseudo]').length).toBe(1)
  })

  it('delivers selectionColor via CSS var + caret-color', () => {
    const { getByTestId } = render(<Input selectionColor="$accent1" testID="sel" />)
    const el = getByTestId('sel') as HTMLElement
    expect(el.hasAttribute('data-uds-selection')).toBe(true)
    expect(normalizedColor(el.style.getPropertyValue('--uds-input-selection'))).toBe(
      normalizedColor(colorsLight.accent1),
    )
    expect(normalizedColor(el.style.getPropertyValue('caret-color'))).toBe(normalizedColor(colorsLight.accent1))
  })
})

function mockMatchMedia(matching: (query: string) => boolean): () => void {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    matches: matching(query),
    media: query,
    onchange: null,
    addListener: (): void => {},
    removeListener: (): void => {},
    addEventListener: (): void => {},
    removeEventListener: (): void => {},
    dispatchEvent: (): boolean => false,
  })) as typeof window.matchMedia
  return () => {
    window.matchMedia = original
  }
}

describe('$sm / $md breakpoints', () => {
  it('$md activates on the exact (max-width: 640px) query Tamagui compiled to', () => {
    const restore = mockMatchMedia((q) => q === '(max-width: 640px)')
    try {
      const { getByTestId } = render(<Input $md={{ width: 80 }} $sm={{ width: 40 }} testID="md" />)
      expect((getByTestId('md') as HTMLElement).style.width, 'only $md active').toBe('80px')
    } finally {
      restore()
    }
  })

  it('$sm activates on (max-width: 450px), and wins over $md as the narrower override', () => {
    const restore = mockMatchMedia((q) => q === '(max-width: 450px)' || q === '(max-width: 640px)')
    try {
      const { getByTestId } = render(<Input $md={{ width: 80 }} $sm={{ width: 40 }} testID="sm" />)
      expect((getByTestId('sm') as HTMLElement).style.width, '$sm wins under 450px').toBe('40px')
    } finally {
      restore()
    }
  })

  it('breakpoint overrides support nested $platform-web', () => {
    const restore = mockMatchMedia((q) => q === '(max-width: 640px)')
    try {
      const { getByTestId } = render(
        <Input $md={{ width: 80, '$platform-web': { display: 'none' } }} testID="nested" />,
      )
      expect((getByTestId('nested') as HTMLElement).style.display).toBe('none')
    } finally {
      restore()
    }
  })
})

describe('groupHoverStyle DOM-listener path (SlippageControl / DeadlineControl markup)', () => {
  it('applies and reverts the override when the t_group ancestor is hovered', () => {
    // The real call sites' group ancestor is a Tamagui `<Flex group>`, which renders
    // class `t_group_true` (captured from the live wrapper markup this session).
    const { getByTestId } = render(
      <div className="t_group_true" data-testid="group">
        <Input backgroundColor="$surface1" groupHoverStyle={{ backgroundColor: '$surface1Hovered' }} testID="grouped" />
      </div>,
    )
    const group = getByTestId('group')
    const el = getByTestId('grouped') as HTMLElement
    expect(normalizedColor(el.style.backgroundColor)).toBe(normalizedColor(colorsLight.surface1))
    fireEvent.mouseEnter(group)
    expect(normalizedColor(el.style.backgroundColor), 'group hovered').toBe(
      normalizedColor(colorsLight.surface1Hovered),
    )
    fireEvent.mouseLeave(group)
    expect(normalizedColor(el.style.backgroundColor), 'group unhovered').toBe(normalizedColor(colorsLight.surface1))
  })
})

describe('Tamagui styled(Input) wrapper delivery contract', () => {
  // Captured from the three real wrappers (NumericalInput StyledInput, SearchModal
  // SearchInput, SendRecipientForm SendRecipientInput) rendered live over the rebuilt
  // component this session: Tamagui resolves the styled() config into (a) plain props for
  // pass-through keys (placeholderTextColor, fontSize, whiteSpace, focusStyle,
  // focusVisibleStyle, '$platform-web', unstyled) and (b) a `style` object whose
  // token-valued entries arrive as `var(--t-space-*/--t-size-*/--t-radius-*/--<theme>)`
  // references, which real DOM inline styles resolve against Tamagui's root CSS.
  it('applies wrapper-delivered focusStyle props at focus (NumericalInput pattern)', () => {
    const { getByTestId } = render(
      <Input
        unstyled
        focusStyle={{ outlineWidth: 0, outlineStyle: 'none', borderWidth: 0 }}
        $platform-web={{ outlineStyle: 'none', outlineWidth: 0 }}
        placeholderTextColor="$neutral2"
        testID="numerical"
      />,
    )
    const el = getByTestId('numerical') as HTMLElement
    expect(el.style.outlineStyle, '$platform-web base').toBe('none')
    fireEvent.focus(el)
    expect(el.style.outlineStyle, 'focus keeps none').toBe('none')
    expect(el.style.borderTopWidth, 'focus border').toBe('0px')
  })

  it('passes var() token references through the style boundary untouched on web', () => {
    // jsdom's cssstyle drops var() in typed longhands (padding/height), so the DOM
    // attribute cannot be asserted here — pin the contract at the resolver boundary
    // instead: the wrapper's style must survive flattening verbatim, leaving var()
    // resolution to the real browser's CSS engine against Tamagui's root variables.
    const delivered = resolveTamaguiSpaceVars({} as Parameters<typeof resolveTamaguiSpaceVars>[0], {
      // SAFETY: replicates Tamagui's wrapper style delivery verbatim; TextStyle has no var() type
      paddingTop: 'var(--t-space-padding16)' as unknown as number,
      height: 'var(--t-size-spacing40)' as unknown as number,
      backgroundColor: 'var(--surface2)' as unknown as string,
    })
    expect(delivered?.['paddingTop']).toBe('var(--t-space-padding16)')
    expect(delivered?.['height']).toBe('var(--t-size-spacing40)')
    expect(delivered?.['backgroundColor']).toBe('var(--surface2)')
  })
})
