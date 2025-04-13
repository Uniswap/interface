import { useEffect, useReducer } from 'react'
import { KeyboardKeyProps } from 'src/app/features/onboarding/KeyboardKey'
import { isAppleDevice } from 'src/app/utils/isAppleDevice'

const KEY_LONG_TEXT_FONT_SIZE = 28
const KEY_SHORT_TEXT_FONT_SIZE = 41

// export for tests
export enum State {
  KeyUp = 0,
  KeyDown = 1,
  Highlighted = 2,
}

type ReducerAction = { type: 'keyUp' | 'keyDown' | 'highlight'; key: string } | { type: 'highlight' }

export const useOpeningKeyboardShortCut = (shortCutPressed: boolean): KeyboardKeyProps[] => {
  // eslint-disable-next-line consistent-return
  const reducer = (state: KeyboardKeyProps[], action: ReducerAction): KeyboardKeyProps[] => {
    switch (action.type) {
      case 'keyDown':
        return state.map((key) => (key.title.toLowerCase() === action.key ? { ...key, state: State.KeyDown } : key))
      case 'keyUp':
        return state.map((key) =>
          key.title.toLowerCase() === action.key ||
          // after pressing Cmd+<letter> keyUp event would only be fired for Cmd, this would "simulate" keyDown for letter
          // context: https://github.com/electron/electron/issues/5188
          (action.key === 'meta' && key.title.length === 1)
            ? { ...key, state: shortCutPressed ? State.Highlighted : State.KeyUp }
            : key,
        )
      case 'highlight':
        return state.map((key) => ({ ...key, state: State.Highlighted }))
    }
  }

  const [keys, dispatch] = useReducer(reducer, [
    {
      fontSize: KEY_LONG_TEXT_FONT_SIZE,
      px: '$spacing28',
      title: 'Shift',
      state: State.KeyUp,
    },
    isAppleDevice()
      ? {
          fontSize: KEY_SHORT_TEXT_FONT_SIZE,
          px: '$spacing16',
          title: 'Meta',
          state: State.KeyUp,
        }
      : {
          fontSize: KEY_LONG_TEXT_FONT_SIZE,
          px: '$spacing12',
          title: 'Ctrl',
          state: State.KeyUp,
        },
    { fontSize: KEY_SHORT_TEXT_FONT_SIZE, px: '$spacing24', title: 'U', state: State.KeyUp },
  ])

  useEffect(() => {
    if (shortCutPressed) {
      dispatch({ type: 'highlight' })
    }
  }, [shortCutPressed])

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent): void => dispatch({ type: 'keyDown', key: event.key.toLowerCase() })
    const keyUpHandler = (event: KeyboardEvent): void => dispatch({ type: 'keyUp', key: event.key.toLowerCase() })
    window.addEventListener('keydown', keyDownHandler)
    window.addEventListener('keyup', keyUpHandler)

    return () => {
      window.removeEventListener('keydown', keyDownHandler)
      window.removeEventListener('keyup', keyUpHandler)
    }
  }, [])
  return keys
}
