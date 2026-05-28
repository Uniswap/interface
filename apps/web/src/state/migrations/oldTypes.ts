import { SerializedTokenMap, TokenDismissInfo } from 'uniswap/src/features/tokens/warnings/slice/types'
import { UserState } from '~/state/user/reducer'

export type PreV16UserState = UserState & {
  tokens: SerializedTokenMap<TokenDismissInfo>
  userLocale: string | null
}
