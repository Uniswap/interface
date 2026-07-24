import { shouldRenderWarningInfoTooltip } from 'uniswap/src/components/modals/WarningModal/WarningInfo'

describe(shouldRenderWarningInfoTooltip, () => {
  it('uses a tooltip on desktop web and extension', () => {
    expect(
      shouldRenderWarningInfoTooltip({
        isWebPlatform: true,
        isMobileWeb: false,
        showModalOnMobileWeb: true,
      }),
    ).toBe(true)
  })

  it('uses a modal on mobile web when requested', () => {
    expect(
      shouldRenderWarningInfoTooltip({
        isWebPlatform: true,
        isMobileWeb: true,
        showModalOnMobileWeb: true,
      }),
    ).toBe(false)
  })

  it('preserves the existing tooltip behavior by default on mobile web', () => {
    expect(
      shouldRenderWarningInfoTooltip({
        isWebPlatform: true,
        isMobileWeb: true,
        showModalOnMobileWeb: false,
      }),
    ).toBe(true)
  })
})
