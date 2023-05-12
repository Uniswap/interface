import { RouterPreference } from 'state/routing/slice'
import { useRouterPreference } from 'state/user/hooks'
import { ThemedText } from 'theme'

export default function RouterLabel() {
  const [routerPreference] = useRouterPreference()

  switch (routerPreference) {
    case RouterPreference.AUTO:
    case RouterPreference.API:
      return <ThemedText.BodySmall>Uniswap API</ThemedText.BodySmall>
    case RouterPreference.CLIENT:
      return <ThemedText.BodySmall>Uniswap Client</ThemedText.BodySmall>
  }
}
