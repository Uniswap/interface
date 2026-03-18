import type { FlexProps } from 'ui/src'

function getCurrencyInputFocusedStyle(isFocused: boolean): FlexProps {
  return {
    borderColor: isFocused ? '$surface3' : '$transparent',
    backgroundColor: isFocused ? '$surface1' : '$surface2',
    hoverStyle: {
      borderColor: isFocused ? '$surface3Hovered' : '$transparent',
      backgroundColor: isFocused ? '$surface1' : '$surface2Hovered',
    },
  }
}

const focusedInputStyle = getCurrencyInputFocusedStyle(true)
const unfocusedInputStyle = getCurrencyInputFocusedStyle(false)

export function useCurrencyInputFocusedStyle(isFocused: boolean): FlexProps {
  return isFocused ? focusedInputStyle : unfocusedInputStyle
}
