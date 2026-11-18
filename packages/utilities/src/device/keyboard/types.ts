export enum KeyAction {
  UP = 'keyup',
  DOWN = 'keydown',
}

export type UseKeyDownProps = {
  callback: (e: KeyboardEvent) => void
  keys?: string[]
  keyAction?: KeyAction
  disabled?: boolean
  preventDefault?: boolean
  shouldTriggerInInput?: boolean
}

export interface ShortcutModifiers {
  meta?: boolean
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
}

export interface UseGlobalShortcutOptions {
  /**
   * The `KeyboardEvent.key` to match, e.g. `'/'`, `'r'` or `'Enter'`. A single printable character matches
   * case-insensitively and whatever Shift does to it on the user's layout.
   */
  key: string
  onTrigger: (event: KeyboardEvent) => void
  disabled?: boolean
  /** Modifiers that must be held. A held modifier that isn't listed blocks the shortcut, so `r` never fires on Cmd+R. */
  modifiers?: ShortcutModifiers
  /** Also fire while typing: in an input, textarea, select, contenteditable, or a textbox/searchbox/combobox role. Off by default. */
  allowInEditable?: boolean
  /** Fire only when nothing has focus (a focused control owns Enter and Space itself). */
  onlyWhenNothingFocused?: boolean
  preventDefault?: boolean
}
