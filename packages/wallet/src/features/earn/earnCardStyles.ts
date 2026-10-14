// Shared by the earning card, its skeleton, and the unfunded card so the loading state can't drift from the real frame.
export const EARNING_CARD_FRAME_PROPS = {
  mb: -8,
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  backgroundColor: '$surface1',
  gap: '$spacing12',
  px: '$spacing16',
  py: '$spacing16',
  // The stacked vault logos carry descending z-index values; without a stacking context here they resolve against
  // the root instead of this card and paint over the connection-status popover on the home screen.
  isolation: 'isolate',
  userSelect: 'none',
} as const
