import { SharedQueryClient } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import {
  PriceServiceProvider,
  RestPriceBatcher,
  type TokenPriceMessage,
  type TokenSubscriptionParams,
} from '@universe/prices'
import type { WebSocketClient } from '@universe/websocket'
import { type ReactElement, type ReactNode, useState } from 'react'
import { createRestPriceClient } from 'uniswap/src/features/prices/createRestPriceClient'

type RemotePriceProviderProps = {
  children: ReactNode
  /**
   * Optional Aurora live-price websocket client. This is only passed to
   * PriceServiceProvider when the CentralizedPrices flag selects the Aurora
   * live path; the TAPI quote path intentionally ignores it.
   */
  wsClient?: WebSocketClient<TokenSubscriptionParams, TokenPriceMessage['data']>
}

export function RemotePriceProvider({ children, wsClient }: RemotePriceProviderProps): ReactElement {
  const usesAuroraLivePrices = useFeatureFlag(FeatureFlags.CentralizedPrices)

  const [auroraRestBatcher] = useState(() => new RestPriceBatcher(createRestPriceClient()))
  const [quoteRestBatcher] = useState(() => new RestPriceBatcher(createRestPriceClient({ preferQuotePrices: true })))
  const restBatcher = usesAuroraLivePrices ? auroraRestBatcher : quoteRestBatcher

  return (
    <PriceServiceProvider
      wsClient={usesAuroraLivePrices ? wsClient : undefined}
      queryClient={SharedQueryClient}
      restBatcher={restBatcher}
    >
      {children}
    </PriceServiceProvider>
  )
}
