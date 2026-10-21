import type { MarginActionKey } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'

// The user's action, before it becomes one of the wire's ten keys. `open` is the one the manage
// surfaces never offer.
export type MarginFormAction = MarginManageAction | 'open'

// Which way the wallet-side equity moves. `none` = the equity input is untouched (or inside its
// dust deadband).
export type MarginEquityChange = 'none' | 'add' | 'withdraw'

// What the leverage control asks for, RELATIVE TO the position's current leverage:
// - `unchanged` sends no target at all (the server holds debt constant) — the usual way "move my
//   equity and keep my leverage" is expressed, i.e. the leverage control left untouched,
// - `hold` sends a target EXPLICITLY equal to current — the composites' equality case, which fires
//   only when the user set a target that matches current exactly,
// - `increase`/`decrease` send a target on that side.
export type MarginLeverageIntent = 'unchanged' | 'hold' | 'increase' | 'decrease'

// The ten-key choice, fully determined by the two axes the user moved. Pure and total: `undefined`
// means there is nothing to submit, and the wire has no key for a no-op.
export function resolveMarginActionKey({
  formAction,
  equityChange,
  leverageIntent,
}: {
  formAction: MarginFormAction
  equityChange: MarginEquityChange
  leverageIntent: MarginLeverageIntent
}): MarginActionKey | undefined {
  switch (formAction) {
    // Both ends of a position's life name themselves: an open always sizes off leverage × equity, a
    // close always takes the whole position.
    case 'open':
      return 'open'
    case 'close':
      return 'close'
    // Every manage action resolves off the axes alone — which modal the user is in constrains what
    // they can move, it does not change what a given movement means.
    case 'add':
    case 'withdraw':
    case 'leverage':
    case 'adjust':
      return resolveAxisActionKey({ equityChange, leverageIntent })
    default:
      return undefined
  }
}

function resolveAxisActionKey({
  equityChange,
  leverageIntent,
}: {
  equityChange: MarginEquityChange
  leverageIntent: MarginLeverageIntent
}): MarginActionKey | undefined {
  switch (equityChange) {
    case 'none': {
      switch (leverageIntent) {
        case 'increase':
          return 'increaseLeverage'
        case 'decrease':
          return 'decreaseLeverage'
        // Holding leverage while nothing else moves asks for nothing.
        default:
          return undefined
      }
    }
    case 'add': {
      switch (leverageIntent) {
        case 'unchanged':
          return 'addEquity'
        // Keeping leverage while equity grows still has to borrow more, so it rides the increase
        // side at its `>=` equality bound.
        case 'hold':
        case 'increase':
          return 'addEquityAndIncreaseLeverage'
        case 'decrease':
          return 'addEquityAndDecreaseLeverage'
        default:
          return undefined
      }
    }
    case 'withdraw': {
      switch (leverageIntent) {
        case 'unchanged':
          return 'withdrawEquity'
        // Mirror of the add case: keeping leverage while equity shrinks has to repay debt.
        case 'hold':
        case 'decrease':
          return 'withdrawEquityAndDecreaseLeverage'
        case 'increase':
          return 'withdrawEquityAndIncreaseLeverage'
        default:
          return undefined
      }
    }
    default:
      return undefined
  }
}
