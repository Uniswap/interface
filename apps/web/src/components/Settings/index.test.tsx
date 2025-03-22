import { Percent } from '@uniswap/sdk-core'
import SettingsTab from 'components/Settings/index'
import { useAccount } from 'hooks/useAccount'
import { useIsUniswapXSupportedChain } from 'hooks/useIsUniswapXSupportedChain'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitFor } from 'test-utils/render'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const slippage = new Percent(75, 10_000)
jest.mock('hooks/useIsUniswapXSupportedChain')
jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(),
}))
jest.mock('uniswap/src/features/chains/hooks/useSupportedChainId', () => ({
  useIsSupportedChainId: jest.fn(),
}))
jest.mock('hooks/useAccount')

describe('Settings Tab', () => {
  describe('showRoutingSettings', () => {
    beforeEach(() => {
      mocked(useAccount).mockReturnValue({
        chainId: UniverseChainId.Mainnet,
      } as unknown as ReturnType<typeof useAccount>)
      mocked(useEnabledChains).mockReturnValue({
        isTestnetModeEnabled: false,
        chains: [],
        gqlChains: [],
        defaultChainId: UniverseChainId.Mainnet,
      })
      mocked(useIsSupportedChainId).mockReturnValue(true)
    })

    it('renders routing settings when hideRoutingSettings is false', async () => {
      mocked(useIsUniswapXSupportedChain).mockReturnValue(true)
      render(<SettingsTab hideRoutingSettings={false} chainId={1} autoSlippage={slippage} />)

      const settingsButton = screen.getByTestId('open-settings-dialog-button')
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.getByTestId('toggle-uniswap-x-button')).toBeInTheDocument()
      })
    })

    it('does not render routing settings when hideRoutingSettings is true', async () => {
      render(<SettingsTab hideRoutingSettings chainId={1} autoSlippage={slippage} />)

      const settingsButton = screen.getByTestId('open-settings-dialog-button')
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.queryByTestId('toggle-uniswap-x-button')).not.toBeInTheDocument()
      })
    })

    it('does not render routing settings when uniswapx is not enabled', async () => {
      mocked(useIsUniswapXSupportedChain).mockReturnValue(false)
      render(<SettingsTab hideRoutingSettings chainId={1} autoSlippage={slippage} />)

      const settingsButton = screen.getByTestId('open-settings-dialog-button')
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.queryByTestId('toggle-uniswap-x-button')).not.toBeInTheDocument()
      })
    })
  })
})
