import type { FlexProps } from 'ui/src'

function getCurrencyInputFocusedStyle(isFocused: boolean): FlexProps {
  return {
    borderColor: isFocused ? '$surface3' : '$transparent',
    backgroundColor: '$surface1', // Always use surface1 for consistent background
    hoverStyle: {
      borderColor: isFocused ? '$surface3Hovered' : '$transparent',
      backgroundColor: '$surface1', // Always use surface1 for consistent background
    },
  }
}

const focusedInputStyle = getCurrencyInputFocusedStyle(true)
const unfocusedInputStyle = getCurrencyInputFocusedStyle(false)

export function useCurrencyInputFocusedStyle(isFocused: boolean): FlexProps {
  return isFocused ? focusedInputStyle : unfocusedInputStyle
}
