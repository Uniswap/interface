/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2 } from 'uniswap/src/test/fixtures'
import { SmartWalletSettingsContent } from 'wallet/src/features/smartWallet/SmartWalletSettingsContent'
import { WalletData, WalletStatus } from 'wallet/src/features/smartWallet/types'
import { render } from 'wallet/src/test/test-utils'

const mockWallets: WalletData[] = [
  {
    name: 'Wallet 1',
    walletAddress: SAMPLE_SEED_ADDRESS_1,
    activeDelegationNetworkToAddress: {},
    status: WalletStatus.Active,
  },
  {
    name: 'Wallet 2',
    walletAddress: SAMPLE_SEED_ADDRESS_2,
    activeDelegationNetworkToAddress: {},
    status: WalletStatus.Inactive,
  },
]

jest.mock('wallet/src/features/smartWallet/hooks/useSmartWalletData', () => ({
  useSmartWalletData: (): WalletData[] => mockWallets,
}))

jest.mock('wallet/src/features/smartWallet/WalletDelegationProvider', () => ({
  useWalletDelegationContext: () => ({
    refreshDelegationData: jest.fn().mockResolvedValue(undefined),
  }),
}))

jest.mock('wallet/src/features/smartWallet/SmartWalletModalsManager', () => ({
  useSmartWalletModals: () => ({
    selectedWallet: undefined,
    modalState: 'none',
    setSelectedWallet: jest.fn(),
    setModalState: jest.fn(),
  }),
  SmartWalletModalsManager: () => null,
}))

describe(SmartWalletSettingsContent, () => {
  it('renders correctly with active and inactive wallets', () => {
    const tree = render(<SmartWalletSettingsContent />)
    expect(tree).toMatchSnapshot()
  })
})
