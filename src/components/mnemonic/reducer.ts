export const MISSING = undefined
export const NOT_REQUIRED = null

// returns an array of same length as `mnemonic`
// cells are either a string representing the user response at that index
// or MISSING if user has yet to input, and NOT_REQUIRED if user does not need to guess it
export const initState = (mnemonicLength: number, missingPositions: number[]): Nullable<string>[] =>
  [...Array(mnemonicLength)].map((_, i) => (missingPositions.includes(i) ? MISSING : NOT_REQUIRED))

export const reducer = (
  state: Nullable<string>[],
  payload: { action: 'update'; word: string }
): Nullable<string>[] => {
  switch (payload.action) {
    case 'update':
      const { word } = payload
      const nextInput = state.findIndex((ur) => ur === MISSING)
      const newState = state.slice()
      newState[nextInput] = word

      return newState
  }
}
