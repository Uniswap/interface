import walletsReducer from './reducer'
import { Wallet } from './types'

const WALLET: Wallet = { account: '0x123', walletType: 'test' }

describe('walletsSlice reducers', () => {
  it('should add a connected wallet', () => {
    const initialState = { connectedWallets: [] }
    const action = {
      type: 'wallets/addConnectedWallet',
      payload: WALLET,
    }
    const expectedState = { connectedWallets: [WALLET] }
    expect(walletsReducer(initialState, action)).toEqual(expectedState)
  })

  it('should not duplicate a connected wallet', () => {
    const initialState = { connectedWallets: [WALLET] }
    const action = {
      type: 'wallets/addConnectedWallet',
      payload: WALLET,
    }
    const expectedState = { connectedWallets: [WALLET] }
    expect(walletsReducer(initialState, action)).toEqual(expectedState)
  })
})
