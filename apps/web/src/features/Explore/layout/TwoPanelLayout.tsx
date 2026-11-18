import { Flex } from '@universe/mycelium'
import { styled, type StyledComponent } from '@universe/mycelium/styled'

const TWO_PANEL_LAYOUT_VARIANTS = {
  topSpacing: { '16': 'mt-[16px]', '24': 'mt-[24px]' },
} as const

// No horizontal padding above $xxl — AppBody's 1200px cap provides the page margins there,
// so the body gets the full expected content width
export const TwoPanelLayout: StyledComponent<typeof Flex, typeof TWO_PANEL_LAYOUT_VARIANTS> = styled(Flex, {
  platform: 'web',
  base: 'flex-row justify-center gap-[80px] mt-[32px] pb-[48px] w-[100%] media-xxl:px-[40px] media-xl:flex-col media-xl:items-center media-xl:gap-[0px] media-lg:px-[20px] media-lg:pt-[0px] media-lg:pb-[52px] media-md:px-[0px]',
  variants: TWO_PANEL_LAYOUT_VARIANTS,
})

export const LeftPanel: StyledComponent<typeof Flex, Record<never, never>> = styled(Flex, {
  platform: 'web',
  base: 'grow-[1] shrink-[1] gap-[40px] w-[100%] media-lg:gap-[32px]',
})

// 360px = the swap component width.
export const RightPanel: StyledComponent<typeof Flex, Record<never, never>> = styled(Flex, {
  platform: 'web',
  base: 'gap-[40px] w-[360px] media-xl:py-[40px] media-xl:w-[100%] media-xl:max-w-[780px]',
})
