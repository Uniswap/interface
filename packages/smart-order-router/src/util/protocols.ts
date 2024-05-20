import { Protocol } from '@uniswap/router-sdk'

export const TO_PROTOCOL = (protocol: string): Protocol => {
  switch (protocol.toLowerCase()) {
    case 'v3':
      return Protocol.V3
    case 'v2':
      return Protocol.V2
    case 'mixed':
      return Protocol.MIXED
    default:
      throw new Error(`Unknown protocol: {id}`)
  }
}
