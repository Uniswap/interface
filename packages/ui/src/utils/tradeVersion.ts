import { Trade } from '@teleswap/sdk'
import { Version } from 'hooks/useToggledVersion'

export function getTradeVersion(_trade?: Trade) {
  return Version.v2
}
