import { UserState } from 'state/user/reducer'
import { SerializedTokenMap, TokenDismissInfo } from 'uniswap/src/features/tokens/warnings/slice/types'

export type PreV16UserState = UserState & {
  tokens: SerializedTokenMap<TokenDismissInfo>
  userLocale: string | null
}
