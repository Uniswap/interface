import walletsReducer from './reducer'
import { Wallet } from './types'

const WALLET: Wallet = { account: '0x123', walletType: 'test' }

const INITIAL_STATE = { connectedWallets: [] as Wallet[], switchingChain: false as const }

describe('wallets reducer', () => {
  describe('connectedWallets', () => {
    it('should add a connected wallet', () => {
      const action = {
        type: 'wallets/addConnectedWallet',
        payload: WALLET,
      }
      const expectedState = { connectedWallets: [WALLET], switchingChain: false }
      expect(walletsReducer(INITIAL_STATE, action)).toEqual(expectedState)
    })

    it('should not duplicate a connected wallet', () => {
      const action = {
        type: 'wallets/addConnectedWallet',
        payload: WALLET,
      }
      const expectedState = { connectedWallets: [WALLET], switchingChain: false }
      expect(walletsReducer({ ...INITIAL_STATE, connectedWallets: [WALLET] }, action)).toEqual(expectedState)
    })
  })

  describe('switchingChain', () => {
    it('should start switching to chain', () => {
      const action = {
        type: 'wallets/startSwitchingChain',
        payload: 1,
      }
      const expectedState = { connectedWallets: [], switchingChain: 1 }
      expect(walletsReducer(INITIAL_STATE, action)).toEqual(expectedState)
    })

    it('should stop switching to chain', () => {
      const action = {
        type: 'wallets/endSwitchingChain',
      }
      expect(walletsReducer({ ...INITIAL_STATE, switchingChain: 1 }, action)).toEqual(INITIAL_STATE)
    })
  })
})
