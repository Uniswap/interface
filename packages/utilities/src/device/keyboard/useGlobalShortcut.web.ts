// oxlint-disable eslint-js/no-restricted-syntax -- a keyboard owner: the page-wide listener lives here on purpose
import { useEffect } from 'react'
import { UseGlobalShortcutOptions } from 'utilities/src/device/keyboard/types'
import { useEvent } from 'utilities/src/react/hooks'

const EDITABLE_TAGS: ReadonlySet<string> = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
const EDITABLE_ROLES: ReadonlySet<string> = new Set(['textbox', 'searchbox', 'combobox'])

/**
 * A page-wide single-key shortcut. The page is the last owner of a key: the hook listens on `document` in
 * the bubble phase and yields to anything that claimed the key first (`defaultPrevented`), to IME
 * composition, to key repeat, and, unless opted in, to editable targets.
 */
export function useGlobalShortcut({
  key,
  onTrigger,
  disabled = false,
  modifiers,
  allowInEditable = false,
  onlyWhenNothingFocused = false,
  preventDefault = false,
}: UseGlobalShortcutOptions): void {
  const trigger = useEvent(onTrigger)
  const meta = modifiers?.meta ?? false
  const ctrl = modifiers?.ctrl ?? false
  const alt = modifiers?.alt ?? false
  const shift = modifiers?.shift ?? false

  useEffect(() => {
    if (disabled) {
      return undefined
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.isComposing || event.repeat || !matchesKey(event, key)) {
        return
      }
      if (event.metaKey !== meta || event.ctrlKey !== ctrl || event.altKey !== alt) {
        return
      }
      // A printable key already reflects Shift in `event.key`, so only named keys compare it.
      if (!isPrintableKey(key) && event.shiftKey !== shift) {
        return
      }
      if (onlyWhenNothingFocused && document.activeElement !== null && document.activeElement !== document.body) {
        return
      }
      if (!allowInEditable && isEditableTarget(event.target)) {
        return
      }
      if (preventDefault) {
        event.preventDefault()
      }
      trigger(event)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, disabled, meta, ctrl, alt, shift, allowInEditable, onlyWhenNothingFocused, preventDefault, trigger])
}

function isPrintableKey(key: string): boolean {
  return key.length === 1
}

function matchesKey(event: KeyboardEvent, key: string): boolean {
  return isPrintableKey(key) ? event.key.toLowerCase() === key.toLowerCase() : event.key === key
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const role = target.getAttribute('role')
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable || (role !== null && EDITABLE_ROLES.has(role))
}
