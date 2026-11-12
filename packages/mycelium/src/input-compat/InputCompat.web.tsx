/**
 * Web leg of the Input compat (INFRA-3600): a raw <input>/<textarea> with
 * inline styles carrying the legacy Input cascade and the RN prop
 * surface mapped by hand, the way the legacy engine rendered an <input> tag.
 * Focus/hover visual states drive the enumerated focusStyle/hoverStyle surface.
 *
 * Unlike RNW's TextInput, the focused node is not registered with RNW's
 * TextInputState, so `Keyboard.dismiss()` and RNW ScrollView keyboard
 * dismissal don't blur it. That needs a deep import into react-native-web,
 * which mycelium must not depend on, and no web call site relies on it:
 * `dismissNativeKeyboard` is a no-op on web.
 */
import {
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react'
import type { TextInput as RNTextInput } from 'react-native'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import type { InputCompatForwardProps, InputCompatProps } from './props'
import { useInputVisualState } from './shared'
import { useEnsurePseudoRules } from './useEnsurePseudoRules'
import {
  createInputKeyDownHandler,
  createInputSelectHandler,
  matchesFocusVisible,
  useAppliedSelection,
  useOnLayout,
} from './web-imperative'
import { resolveWebInputType, RN_ONLY_PROP_KEYS, type RnOnlyPropKey } from './web-support'

export type { InputCompatProps, InputCompatStyleProps } from './props'

/** Instance type alias kept for consumers doing `forwardRef<Input>` (the legacy alias). */
export type InputCompat = RNTextInput

/** RN-surface keys the web leg consumes and maps to DOM behavior below. */
type HandledWebPropKey =
  | 'value'
  | 'defaultValue'
  | 'placeholder'
  | 'onChangeText'
  | 'onChange'
  | 'onSubmitEditing'
  | 'onKeyPress'
  | 'keyboardType'
  | 'inputMode'
  | 'secureTextEntry'
  | 'maxLength'
  | 'autoFocus'
  | 'autoComplete'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'returnKeyType'
  | 'multiline'
  | 'numberOfLines'
  | 'rows'
  | 'accessibilityLabel'
  | 'onPressIn'
  | 'onPressOut'
  | 'spellCheck'
  | 'blurOnSubmit'
  | 'selection'
  | 'onSelectionChange'
  | 'selectTextOnFocus'
  | 'clearTextOnFocus'
  | 'caretHidden'
  | 'onLayout'
  | 'pointerEvents'

/**
 * RNTextInputProps keys that are legitimate DOM props as-is (React DOM understands them),
 * so the passthrough forwards them verbatim.
 */
type DomSafePassthroughKey = Extract<
  keyof InputCompatForwardProps,
  | 'id'
  | 'role'
  | 'tabIndex'
  | `aria-${string}`
  | `onPointer${string}`
  | `onTouch${string}`
  | 'onClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  // uniwind's global RN augmentation adds className to RNTextInputProps in
  // this package's program (uniwind-env.d.ts); it is a legitimate DOM prop.
  | 'className'
  | 'enterKeyHint'
  | 'readOnly'
  | 'children'
>

/**
 * uniwind's RN augmentation (uniwind-env.d.ts) adds per-prop className hooks
 * to RNTextInputProps. They are uniwind's native class lane — meaningless on a
 * raw DOM input — so the web leg strips them (the native leg spreads them
 * through to RN TextInput, where uniwind resolves them).
 */
type UniwindClassNameKey = Extract<keyof InputCompatForwardProps, `${string}ClassName`>

// Compile-time routing guard (the inverse of RN_ONLY_PROP_KEYS' membership pin): every key of
// the forwarded RNTextInputProps surface must be consumed above, filtered as RN-only, or be a
// legitimate DOM prop — an RN upgrade that adds a new TextInput prop fails here instead of
// silently leaking an unknown attribute onto the DOM element.
type UnroutedWebPropKey = Exclude<
  keyof InputCompatForwardProps,
  HandledWebPropKey | RnOnlyPropKey | DomSafePassthroughKey | UniwindClassNameKey
>
type AssertWebPropSurfaceRouted = UnroutedWebPropKey extends never ? true : ['unrouted keys:', UnroutedWebPropKey]
const _webPropSurfaceRouted: AssertWebPropSurfaceRouted = true

export const InputCompat = forwardRef<RNTextInput, InputCompatProps>(function InputCompatRender(props, ref) {
  const {
    forwardProps,
    resolvedStyle,
    isEditable,
    placeholderColor,
    selectionColor,
    hasGroupHover,
    dataTestId,
    onFocus,
    onBlur,
    setFocused,
    setFocusVisible,
    setHovered,
    setGroupHovered,
  } = useInputVisualState(props)

  const {
    value,
    defaultValue,
    placeholder,
    onChangeText,
    onChange,
    onSubmitEditing,
    onKeyPress,
    keyboardType,
    inputMode,
    secureTextEntry,
    maxLength,
    autoFocus,
    autoComplete,
    autoCapitalize,
    autoCorrect,
    returnKeyType,
    multiline,
    numberOfLines,
    rows,
    accessibilityLabel,
    onPressIn,
    onPressOut,
    spellCheck,
    blurOnSubmit,
    selection,
    onSelectionChange,
    selectTextOnFocus,
    clearTextOnFocus,
    caretHidden,
    onLayout,
    pointerEvents,
    ...typedDomRest
  } = forwardProps

  const domRest = typedDomRest as Record<string, unknown>
  for (const key of RN_ONLY_PROP_KEYS) {
    delete domRest[key]
  }
  // uniwind's per-prop className hooks (see UniwindClassNameKey) — native-only lane.
  for (const key of Object.keys(domRest)) {
    if (key !== 'className' && key.endsWith('ClassName')) {
      delete domRest[key]
    }
  }
  // Parity: the legacy engine never forwarded `pattern` (SendRecipientForm passes one, type-suppressed)
  // — keep dropping it so HTML5 constraint validation doesn't go live unannounced.
  delete domRest['pattern']

  const elementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEnsurePseudoRules()

  // Best-effort `$group-hover`: track hover on the nearest Tamagui group ancestor.
  // The `t_group` class is a Tamagui-era marker — revisit when Tailwind's own group
  // mechanism replaces Tamagui groups.
  useEffect(() => {
    if (!hasGroupHover) {
      return undefined
    }
    const el = elementRef.current
    const group = el?.closest('[class*="t_group"]')
    if (group === null || group === undefined) {
      return undefined
    }
    const onEnter = (): void => setGroupHovered(true)
    const onLeave = (): void => setGroupHovered(false)
    group.addEventListener('mouseenter', onEnter)
    group.addEventListener('mouseleave', onLeave)
    return () => {
      group.removeEventListener('mouseenter', onEnter)
      group.removeEventListener('mouseleave', onLeave)
    }
  }, [hasGroupHover, setGroupHovered])

  useAppliedSelection({
    elementRef,
    start: selection?.start,
    end: selection?.end,
    value,
  })
  useOnLayout({ elementRef, onLayout: onLayout as ((e: unknown) => void) | undefined })

  const setRefs = (node: HTMLInputElement | HTMLTextAreaElement | null): void => {
    elementRef.current = node
    // Consumers hold the ref RNW/Tamagui exposed on web: the DOM element augmented with the
    // TextInput methods RNW attached to the host node (SearchTextInput calls .clear()).
    // RNW also attached measure()/measureLayout()/measureInWindow() — not transcribed: no
    // Input call site uses them on web; add here if one ever does.
    if (node !== null) {
      const augmented = node as typeof node & { clear?: () => void; isFocused?: () => boolean }
      augmented.clear = (): void => {
        node.value = ''
      }
      augmented.isFocused = (): boolean => node.ownerDocument.activeElement === node
    }
    if (typeof ref === 'function') {
      ref(node as unknown as RNTextInput)
    } else if (ref !== null) {
      ref.current = node as unknown as RNTextInput
    }
  }

  const style: CSSProperties & Record<string, unknown> = {
    // RNW/Tamagui input frame resets the UA stylesheet before the cascade lands.
    boxSizing: 'border-box',
    margin: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    borderWidth: 0,
    borderStyle: 'solid',
    appearance: 'none',
    MozAppearance: 'textfield',
    resize: 'none',
    ...(resolvedStyle as CSSProperties),
  }
  if (typeof style.lineHeight === 'number') {
    // Numeric lineHeight can still arrive via the RN `style` prop (styled() wrappers,
    // consumer styles); React would emit it unitless, the legacy cascade emitted px.
    style.lineHeight = `${style.lineHeight}px`
  }
  if (placeholderColor !== undefined) {
    style['--uds-input-placeholder'] = placeholderColor
  }
  if (selectionColor !== undefined) {
    style['--uds-input-selection'] = selectionColor
    style.caretColor = selectionColor
  }
  if (caretHidden === true) {
    // RNW mapped caretHidden to a transparent caret, over any selectionColor caret.
    style.caretColor = 'transparent'
  }
  // Web-only adjustment on the local style object (like the resets above), not
  // written back into the hook-owned resolvedStyle.
  if (pointerEvents === 'auto' || pointerEvents === 'none') {
    style.pointerEvents = pointerEvents
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const text = e.currentTarget.value
    // RNW delivered DOM events with nativeEvent.text populated; RN-shaped consumers (the
    // extension's seed-phrase import among them) read the new value from there, not target.value.
    ;(e.nativeEvent as Event & { text?: string }).text = text
    onChangeText?.(text)
    ;(onChange as ((event: unknown) => void) | undefined)?.(e)
  }

  const handleKeyDown = createInputKeyDownHandler({
    onKeyPress: onKeyPress as ((e: unknown) => void) | undefined,
    onSubmitEditing: onSubmitEditing as ((e: unknown) => void) | undefined,
    blurOnSubmit,
    multiline,
  })

  const handleFocus = (e: ReactFocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const node = e.currentTarget
    setFocused(true)
    setFocusVisible(matchesFocusVisible(node))
    ;(e.nativeEvent as Event & { text?: string }).text = node.value
    ;(onFocus as ((event: unknown) => void) | undefined)?.(e)
    if (clearTextOnFocus === true) {
      node.value = ''
    }
    if (selectTextOnFocus === true) {
      // RNW deferred the select for Safari, re-checking focus before selecting.
      setTimeout(() => {
        if (node.ownerDocument.activeElement === node) {
          node.select()
        }
      }, 0)
    }
  }
  const handleBlur = (e: ReactFocusEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setFocused(false)
    setFocusVisible(false)
    ;(e.nativeEvent as Event & { text?: string }).text = e.currentTarget.value
    ;(onBlur as ((event: unknown) => void) | undefined)?.(e)
  }
  const handleSelect = createInputSelectHandler(onSelectionChange as ((e: unknown) => void) | undefined)

  // Chain, don't clobber: Tamagui styled(Input) wrappers deliver their own
  // onMouseEnter/onMouseLeave through the passthrough (their hoverStyle runtime), and
  // consumers can pass them directly — both must keep firing alongside our hover state.
  const passthroughMouseEnter = domRest['onMouseEnter'] as ((e: unknown) => void) | undefined
  const passthroughMouseLeave = domRest['onMouseLeave'] as ((e: unknown) => void) | undefined
  const handleMouseEnter = (e: unknown): void => {
    setHovered(true)
    passthroughMouseEnter?.(e)
  }
  const handleMouseLeave = (e: unknown): void => {
    setHovered(false)
    passthroughMouseLeave?.(e)
  }
  // RN press events, delivered the way RNW mapped them on web.
  const handleMouseDown = (e: unknown): void => {
    ;(onPressIn as ((event: unknown) => void) | undefined)?.(e)
  }
  const handleMouseUp = (e: unknown): void => {
    ;(onPressOut as ((event: unknown) => void) | undefined)?.(e)
  }

  const sharedDomProps = {
    // The legacy RNW-rendered input always carried dir="auto".
    dir: 'auto',
    // RNW set this unconditionally on every TextInput; it keeps the Android
    // mobile-web virtual keyboard from resizing the layout viewport.
    virtualkeyboardpolicy: 'auto',
    ...domRest,
    ref: setRefs,
    style,
    value,
    defaultValue,
    placeholder,
    maxLength,
    autoFocus,
    autoComplete: autoComplete as string | undefined,
    autoCapitalize,
    autoCorrect: autoCorrect === undefined ? undefined : autoCorrect === true ? 'on' : 'off',
    // RNW derived spellCheck from autoCorrect, so autoCorrect={false} fields (seed phrases,
    // passwords) never leak contents to browser spellcheck services.
    spellCheck: spellCheck ?? autoCorrect,
    // Legacy contract: disabled → readOnly (never the DOM disabled attribute), and a
    // consumer-passed DOM readOnly in the passthrough is not clobbered.
    // TODO(INFRA-4589): assistive tech hears a read-only field, not a disabled one; add aria-disabled when disabled.
    readOnly: !isEditable || domRest['readOnly'] === true,
    'data-testid': dataTestId,
    'data-uds-placeholder': placeholderColor === undefined ? undefined : '',
    'data-uds-selection': selectionColor === undefined ? undefined : '',
    // Conditional spreads: a consumer-passed aria-label/enterKeyHint/onMouseDown/onMouseUp
    // in domRest must not be clobbered with undefined.
    ...(accessibilityLabel === undefined ? undefined : { 'aria-label': accessibilityLabel as string }),
    ...(returnKeyType === undefined
      ? undefined
      : { enterKeyHint: returnKeyType as InputHTMLAttributes<HTMLInputElement>['enterKeyHint'] }),
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ...(onPressIn === undefined ? undefined : { onMouseDown: handleMouseDown }),
    ...(onPressOut === undefined ? undefined : { onMouseUp: handleMouseUp }),
    ...(onSelectionChange === undefined ? undefined : { onSelect: handleSelect }),
  }

  // RNW parity: only `multiline` switches to <textarea> (numberOfLines alone never did), and
  // multiline wins over secureTextEntry — RNW rendered the same unmasked textarea there.
  if (multiline === true) {
    return (
      <textarea {...(sharedDomProps as TextareaHTMLAttributes<HTMLTextAreaElement>)} rows={rows ?? numberOfLines} />
    )
  }

  const derived = resolveWebInputType({ inputMode, keyboardType, secureTextEntry })

  return (
    <input
      {...(sharedDomProps as InputHTMLAttributes<HTMLInputElement>)}
      type={derived.type}
      inputMode={derived.inputMode as InputHTMLAttributes<HTMLInputElement>['inputMode']}
    />
  )
})

InputCompat.displayName = 'InputCompat'

// Legacy color-injecting wrappers (ui/src TouchableArea and its compat twin)
// must skip this primitive — it styles itself and rejects legacy token guidance.
markMyceliumPrimitive(InputCompat)
