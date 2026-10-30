import { Text } from '@universe/mycelium'
import type { PropsWithChildren } from 'react'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { shouldRenderWarningInfoTooltip, WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import type { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { renderWithProviders } from 'uniswap/src/test/render'

const mockPlatform = vi.hoisted(() => ({ isWebPlatform: true, isMobileWeb: false }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mockPlatform.isWebPlatform
    },
    get isMobileWeb(): boolean {
      return mockPlatform.isMobileWeb
    },
  }
})

// Render each shell's content inline so it is queryable without hover or a press.
vi.mock('uniswap/src/components/tooltip/InfoTooltip', () => ({
  InfoTooltip: ({ button, children }: PropsWithChildren<InfoTooltipProps>): JSX.Element => (
    <>
      {children}
      {button}
    </>
  ),
}))
vi.mock('uniswap/src/components/modals/WarningModal/WarningModal', () => ({
  WarningModal: ({ children }: PropsWithChildren): JSX.Element => <>{children}</>,
}))

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

describe('WarningInfo infoButton', () => {
  const modalProps = { modalName: ModalName.SwapReview, severity: WarningSeverity.None, title: 'title' }
  const renderShell = (showModalOnMobileWeb = false): ReturnType<typeof renderWithProviders> =>
    renderWithProviders(
      <WarningInfo
        infoButton={(shell): JSX.Element => <Text>{`button in ${shell}`}</Text>}
        modalProps={modalProps}
        showModalOnMobileWeb={showModalOnMobileWeb}
        tooltipProps={{ text: 'tooltip text' }}
      >
        <Text>label</Text>
      </WarningInfo>,
    )

  beforeEach(() => {
    mockPlatform.isWebPlatform = true
    mockPlatform.isMobileWeb = false
  })

  it('tells a function button it is in the tooltip on desktop web', () => {
    expect(renderShell().getByText('button in tooltip')).toBeTruthy()
  })

  it('tells a function button it is in the modal in the mobile app', () => {
    mockPlatform.isWebPlatform = false
    expect(renderShell().getByText('button in modal')).toBeTruthy()
  })

  it('follows the shell, not the platform, when mobile web opts into the modal', () => {
    mockPlatform.isMobileWeb = true
    expect(renderShell(true).getByText('button in modal')).toBeTruthy()
  })

  it('still renders a plain node button as given', () => {
    const { getByText } = renderWithProviders(
      <WarningInfo
        infoButton={<Text>plain button</Text>}
        modalProps={modalProps}
        tooltipProps={{ text: 'tooltip text' }}
      >
        <Text>label</Text>
      </WarningInfo>,
    )
    expect(getByText('plain button')).toBeTruthy()
  })
})
