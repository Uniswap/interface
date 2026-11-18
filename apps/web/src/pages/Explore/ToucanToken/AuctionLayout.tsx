import { styled, type StyledComponent } from '@universe/mycelium/styled'
import { LeftPanel, RightPanel, TwoPanelLayout } from '~/features/Explore/layout/TwoPanelLayout'

// The auction page provides its own gutters (no horizontal padding at any width), left-justifies,
// and tightens the panel gap.
export const AuctionLayout: StyledComponent<typeof TwoPanelLayout, Record<never, never>> = styled(TwoPanelLayout, {
  platform: 'web',
  base: 'justify-start gap-[46px] px-[0px] media-xxl:px-[0px] media-lg:px-[0px]',
})

// Clamped, full-width again below $lg.
export const AuctionLeftPanel: StyledComponent<typeof LeftPanel, Record<never, never>> = styled(LeftPanel, {
  platform: 'web',
  base: 'max-w-[744px] media-lg:max-w-[100%]',
})

// Narrower (390px), top-aligned, hidden below $xl (its content renders inline in the left column there).
export const AuctionRightPanel: StyledComponent<typeof RightPanel, Record<never, never>> = styled(RightPanel, {
  platform: 'web',
  base: 'self-start gap-[24px] w-[390px] media-xl:hidden',
})
