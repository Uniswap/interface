import { RouterPreference } from 'state/routing/slice'
import { useRouterPreference } from 'state/user/hooks'
import { ThemedText } from 'theme'

import UniswapXRouterLabel from './UniswapXRouterLabel'

export default function RouterLabel() {
  const [routerPreference] = useRouterPreference()

  switch (routerPreference) {
    case RouterPreference.API:
      return <ThemedText.BodySmall>Uniswap API</ThemedText.BodySmall>
    case RouterPreference.CLIENT:
      return <ThemedText.BodySmall>Uniswap Client</ThemedText.BodySmall>
    case RouterPreference.X:
      return (
        <UniswapXRouterLabel>
          <ThemedText.BodySmall>Uniswap X</ThemedText.BodySmall>
        </UniswapXRouterLabel>
      )
  }
}
