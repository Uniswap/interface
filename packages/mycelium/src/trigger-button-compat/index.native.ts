/**
 * Native stub for the web-only trigger-button compat. The native leg is
 * deferred per INFRA-3021. The component throws at render time so an
 * accidental native import fails loudly; the literal class constants are
 * pure data and exported for real so cross-platform importers resolve every
 * symbol the web leg exports.
 */

// Pure data — safe off-web; re-exported so values never drift.
export {
  TRIGGER_BUTTON_BASE_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
  TRIGGER_BUTTON_SIZE_CLASS_NAMES,
  TRIGGER_BUTTON_VARIANT_CLASS_NAMES,
} from './compile'
export type { TriggerButtonCompatSize } from './compile'
export type { TriggerButtonCompatProps } from './types'

function throwNativeStub(name: string): never {
  throw new Error(`${name} is web-only; the native leg is deferred (INFRA-3021).`)
}

export function TriggerButtonCompat(): never {
  return throwNativeStub('TriggerButtonCompat')
}
