import { ConnectionType } from '../../src/connection/types'
import { UserState } from '../../src/state/user/reducer'

export const CONNECTED_WALLET_USER_STATE: Partial<UserState> = { selectedWallet: ConnectionType.INJECTED }

export const DISCONNECTED_WALLET_USER_STATE: Partial<UserState> = { selectedWallet: undefined }
