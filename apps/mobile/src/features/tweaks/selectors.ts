import { MobileState } from 'src/app/reducer'
import { CustomEndpoint } from 'wallet/src/data/links'

export const selectCustomEndpoint = (state: MobileState): CustomEndpoint | undefined =>
  state.tweaks.customEndpoint
