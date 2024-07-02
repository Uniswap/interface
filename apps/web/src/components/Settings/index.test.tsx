import { Percent } from '@uniswap/sdk-core'
import SettingsTab from 'components/Settings/index'
import { isUniswapXSupportedChain, useIsSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { fireEvent, render, screen, waitFor } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/types/chains'

const slippage = new Percent(75, 10_000)
jest.mock('constants/chains')
jest.mock('hooks/useAccount')

describe('Settings Tab', () => {
  describe('showRoutingSettings', () => {
    beforeEach(() => {
      mocked(useAccount).mockReturnValue({
        chainId: UniverseChainId.Mainnet,
      } as unknown as ReturnType<typeof useAccount>)
      mocked(useIsSupportedChainId).mockReturnValue(true)
    })

    it('renders routing settings when hideRoutingSettings is false', async () => {
      mocked(isUniswapXSupportedChain).mockReturnValue(true)
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
      mocked(isUniswapXSupportedChain).mockReturnValue(false)
      render(<SettingsTab hideRoutingSettings chainId={1} autoSlippage={slippage} />)

      const settingsButton = screen.getByTestId('open-settings-dialog-button')
      fireEvent.click(settingsButton)

      await waitFor(() => {
        expect(screen.queryByTestId('toggle-uniswap-x-button')).not.toBeInTheDocument()
      })
    })
  })
})
