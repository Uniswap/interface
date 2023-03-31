import walletsReducer from './reducer'
import { Wallet } from './types'

describe('walletsSlice reducers', () => {
  it('should add a connected wallet', () => {
    const initialState = {
      connectedWallets: [],
    }
    const wallet = {
      address: '0x123',
      chainId: 1,
    }
    const action = {
      type: 'wallets/addConnectedWallet',
      payload: wallet,
    }
    const expectedState = {
      connectedWallets: [wallet],
    }
    expect(walletsReducer(initialState, action)).toEqual(expectedState)
  })

  it('should remove a connected wallet', () => {
    const wallet: Wallet = {
      walletType: 'metamask',
      account: '0x123',
    }
    const initialState = {
      connectedWallets: [wallet],
    }
    const action = {
      type: 'wallets/removeConnectedWallet',
      payload: wallet,
    }
    const expectedState = {
      connectedWallets: [],
    }
    expect(walletsReducer(initialState, action)).toEqual(expectedState)
  })
})
