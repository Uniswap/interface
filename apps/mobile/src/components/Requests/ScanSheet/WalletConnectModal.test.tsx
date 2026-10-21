import type { ComponentType, ReactNode } from 'react'
import { WalletConnectModal } from 'src/components/Requests/ScanSheet/WalletConnectModal'
import { render } from 'src/test/test-utils'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'

const sheetPropsSpy = vi.hoisted(() => vi.fn())

vi.mock('@gorhom/bottom-sheet', async () => {
  const { View } = (await import('react-native')) as unknown as { View: ComponentType<{ children?: ReactNode }> }
  return {
    BottomSheetModal: (props: { children?: ReactNode }) => {
      sheetPropsSpy(props)
      return <View>{props.children}</View>
    },
    BottomSheetBackdrop: View,
    BottomSheetView: View,
    BottomSheetTextInput: View,
  }
})

// The shared setup stubs Modal out; this test needs the real native leg that resolves the gorhom props.
vi.mock('uniswap/src/components/modals/Modal', async () => {
  return await vi.importActual('uniswap/src/components/modals/Modal.native')
})

vi.mock('uniswap/src/utils/useKeyboardLayout', () => ({
  useKeyboardLayout: () => ({ isVisible: false, containerHeight: 0 }),
}))

vi.mock('wallet/src/features/wallet/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/wallet/hooks')>()),
  useActiveAccount: () => ({ address: '0x0000000000000000000000000000000000000001' }),
}))

vi.mock('src/features/walletConnect/useWalletConnect', () => ({
  useWalletConnect: () => ({ sessions: [], hasPendingSessionError: false }),
}))

vi.mock('src/app/navigation/hooks', () => ({
  useEagerExternalProfileRootNavigation: () => ({ preload: vi.fn(), navigate: vi.fn() }),
}))

vi.mock('src/components/QRCodeScanner/QRCodeScanner', () => ({ QRCodeScanner: () => null }))
vi.mock('src/components/Requests/ConnectedDapps/ConnectedDappsList', () => ({ ConnectedDappsList: () => null }))
vi.mock('uniswap/src/components/ReceiveQRCode/ReceiveQRCode', () => ({ ReceiveQRCode: () => null }))

function sheetProps(initialScreenState: ScannerModalState): { enableContentPanningGesture?: unknown } {
  sheetPropsSpy.mockClear()
  render(<WalletConnectModal initialScreenState={initialScreenState} onClose={vi.fn()} />)
  return sheetPropsSpy.mock.calls[0]?.[0] ?? {}
}

describe(WalletConnectModal, () => {
  // The sheet is fullScreen with a visible handle, a shape the shared Modal default leaves without content
  // panning; these assert what gorhom receives, so they fail if the explicit opt-in is dropped.
  it.each([
    { screen: 'wallet QR (Receive)', state: ScannerModalState.WalletQr },
    { screen: 'QR scanner', state: ScannerModalState.ScanQr },
    { screen: 'connected dapps', state: ScannerModalState.ConnectedDapps },
  ])('hands gorhom content panning on the $screen screen so a drag anywhere on it dismisses', ({ state }) => {
    expect(sheetProps(state).enableContentPanningGesture).toBe(true)
  })
})
