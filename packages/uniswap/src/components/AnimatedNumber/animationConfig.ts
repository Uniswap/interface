import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const ROLL_TRANSITION_MS = 180
export const STAGGER_MS = 40
export const SLIDE_PERCENT = 50
export const SLOT_PREV_CLEAR_DELAY_MS = ROLL_TRANSITION_MS + 50
export const BALANCE_CHANGE_INDICATION_DURATION = ONE_SECOND_MS / 2

// Balance-change flash overlay: fade the indication color in, hold, fade back to base.
export const FLASH_FADE_IN_MS = 250
export const FLASH_HOLD_MS = 50
export const FLASH_FADE_OUT_MS = 310
