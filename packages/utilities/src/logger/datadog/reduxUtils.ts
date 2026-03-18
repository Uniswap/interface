import { Action } from 'redux'

type GenericReduxState = Record<string, unknown>

export function handleReduxAction({
  newState,
  shouldLogState,
  action,
}: {
  shouldLogState: boolean
  newState: unknown
  action: Action<unknown>
}): { isAction: boolean; reduxStateToLog: GenericReduxState | undefined } {
  const isAction = typeof action !== 'undefined'

  if (shouldLogState) {
    const stateIsObject = typeof newState === 'object' && newState !== null
    const allObjectKeysString = stateIsObject && Object.keys(newState).every((k) => typeof k === 'string')
    const validState = stateIsObject && allObjectKeysString

    return {
      reduxStateToLog: validState ? filterReduxState(newState as GenericReduxState) : undefined,
      isAction,
    }
  } else {
    return {
      reduxStateToLog: undefined,
      isAction,
    }
  }
}

const ALLOWED_REDUX_FIELDS: string[] = [
  // Uniswap
  'searchHistory',
  'transactions',
  'uniswapBehaviorHistory',
  'userSettings',
  // Wallet
  'appearanceSettings',
  'behaviorHistory',
  'wallet',
  // Mobile
  'biometricSettings',
  'cloudBackup',
  // Extension
  'dappRequests',
  // Web
  'user',
]

// Filter redux state to reduce size where possible to needed information only
function filterReduxState(state: GenericReduxState | undefined): GenericReduxState {
  if (state === undefined) {
    return {}
  }

  return Object.keys(state).reduce((filteredState, key: string) => {
    if (ALLOWED_REDUX_FIELDS.includes(key)) {
      filteredState[key] = state[key]
    }
    return filteredState
  }, {} as GenericReduxState)
}
