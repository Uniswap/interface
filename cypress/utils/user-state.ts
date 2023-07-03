import { UserState } from '../../src/state/user/reducer'

export const CONNECTED_WALLET_USER_STATE: Partial<UserState> = { selectedWallet: 'INJECTED' }

export const UNCONNECTED_WALLET_USER_STATE: Partial<UserState> = { selectedWallet: undefined }
