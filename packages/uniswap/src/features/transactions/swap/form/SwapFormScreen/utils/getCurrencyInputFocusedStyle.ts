import { FlexProps } from 'ui/src'

export function getCurrencyInputFocusedStyle(isFocused: boolean): FlexProps {
  return {
    borderColor: isFocused ? '$surface3' : '$transparent',
    backgroundColor: isFocused ? '$surface1' : '$surface2',
    hoverStyle: {
      borderColor: isFocused ? '$surface3Hovered' : '$transparent',
      backgroundColor: isFocused ? '$surface1' : '$surface2Hovered',
    },
  }
}
