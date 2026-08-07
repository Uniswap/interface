/**
 * Web entry for the trigger-button compat — mirrors the base index.ts (web
 * is the real platform for mycelium; the native leg throws for the
 * component, see index.native.ts). Keep the export list in sync with
 * index.ts.
 */
export {
  TRIGGER_BUTTON_BASE_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_CLASS_NAME,
  TRIGGER_BUTTON_CHEVRON_EXPANDED_CLASS_NAME,
  TRIGGER_BUTTON_SIZE_CLASS_NAMES,
  TRIGGER_BUTTON_VARIANT_CLASS_NAMES,
  type TriggerButtonCompatSize,
} from './compile'
export { TriggerButtonCompat } from './TriggerButtonCompat'
export type { TriggerButtonCompatProps } from './types'
