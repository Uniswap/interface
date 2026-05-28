import { UserState } from 'state/user/reducer'
import { SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'

export type PreV16UserState = UserState & {
  tokens: SerializedTokenMap
  userLocale: string | null
}
