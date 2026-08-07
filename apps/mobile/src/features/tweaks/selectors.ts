import { TweaksState } from 'src/features/tweaks/slice'
import { CustomEndpoint } from 'uniswap/src/data/graphql/links'

export const selectCustomEndpoint = (state: { tweaks: TweaksState }): CustomEndpoint | undefined =>
  state.tweaks.customEndpoint
