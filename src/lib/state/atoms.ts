/* eslint-disable @typescript-eslint/ban-types */
import { Draft } from 'immer'
import { atom, WritableAtom } from 'jotai'
import { withImmer } from 'jotai/immer'

/**
 * Creates a derived atom whose value is the picked object property.
 * By default, the setter acts as a primitive atom's, changing the original atom.
 * A custom setter may also be passed, which uses an Immer Draft so that it may be mutated directly.
 */
export function pickAtom<Value, Key extends keyof Value & keyof Draft<Value>, Update>(
  anAtom: WritableAtom<Value, Value>,
  key: Key,
  setter: (draft: Draft<Value>[Key], update: Update) => Draft<Value>[Key]
): WritableAtom<Value[Key], Update>
export function pickAtom<Value, Key extends keyof Value & keyof Draft<Value>, Update extends Value[Key]>(
  anAtom: WritableAtom<Value, Value>,
  key: Key,
  setter?: (draft: Draft<Value>[Key], update: Update) => Draft<Value>[Key]
): WritableAtom<Value[Key], Update>
export function pickAtom<Value, Key extends keyof Value & keyof Draft<Value>, Update extends Value[Key]>(
  anAtom: WritableAtom<Value, Value>,
  key: Key,
  setter: (draft: Draft<Value>[Key], update: Update) => Draft<Value>[Key] = (draft, update) =>
    update as Draft<Value>[Key]
): WritableAtom<Value[Key], Update> {
  return atom(
    (get) => get(anAtom)[key],
    (get, set, update: Update) =>
      set(withImmer(anAtom), (value) => {
        const derived = setter(value[key], update)
        value[key] = derived
      })
  )
}

/**
 * Typing for a customizable enum; see setCustomizable.
 * This is not exported because an enum may not extend another interface.
 */
interface CustomizableEnum<T extends number> {
  CUSTOM: -1
  DEFAULT: T
}

/**
 * Typing for a customizable enum; see setCustomizable.
 * The first value is used, unless it is CUSTOM, in which case the second is used.
 */
export type Customizable<T> = { value: T; custom?: number }

/** Sets a customizable enum, validating the tuple and falling back to the default. */
export function setCustomizable<T extends number, Enum extends CustomizableEnum<T>>(customizable: Enum) {
  return (draft: Customizable<T>, update: T | Customizable<T>) => {
    // normalize the update
    if (typeof update === 'number') {
      update = { value: update }
    }

    draft.value = update.value
    if (draft.value === customizable.CUSTOM) {
      draft.custom = update.custom

      // prevent invalid state
      if (draft.custom === undefined) {
        draft.value = customizable.DEFAULT
      }
    }

    return draft
  }
}

/** Sets a togglable atom to invert its state at the next render. */
export function setTogglable(draft: boolean) {
  return !draft
}
