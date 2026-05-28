import { createConnectTransportWithDefaults, getEntryGatewayUrl } from '@universe/api'

export const auctionsTransport = createConnectTransportWithDefaults({
  baseUrl: getEntryGatewayUrl(),
})
