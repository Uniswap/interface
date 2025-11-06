import { useFeatureFlag } from '@universe/gating'
import { UniswapWalletOptions } from 'components/WalletModal/UniswapWalletOptions'
import { useWalletWithId } from 'features/accounts/store/hooks'
import { ExternalWallet } from 'features/accounts/store/types'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

vi.mock('features/accounts/store/hooks', async () => ({
  ...(await vi.importActual('features/accounts/store/hooks')),
  useWalletWithId: vi.fn(),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})

const UniswapMobileWallet = {
  id: CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID,
} as ExternalWallet

const UniswapExtensionWallet = {
  id: CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS,
} as ExternalWallet

describe('UniswapWalletOptions', () => {
  it('Download wallet option should be visible if extension is not detected', () => {
    mocked(useWalletWithId).mockImplementation(
      (testId) =>
        ({
          [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: UniswapMobileWallet,
        })[testId],
    )
    mocked(useFeatureFlag).mockReturnValue(true)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const downloadOption = screen.getByTestId('download-uniswap-wallet')
    expect(downloadOption).toBeInTheDocument()
  })
  it('Extension connecter should be shown if detected', () => {
    mocked(useWalletWithId).mockImplementation(
      (testId) =>
        ({
          [CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS]: UniswapExtensionWallet,
        })[testId],
    )
    mocked(useFeatureFlag).mockReturnValue(false)
    const { asFragment } = render(<UniswapWalletOptions />)
    expect(asFragment()).toMatchSnapshot()
    const connectWallet = screen.getByTestId('connect-uniswap-extension')
    expect(connectWallet).toBeInTheDocument()
  })
})
