import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'

export const mockPool = new Pool(
  UNI[UniverseChainId.Mainnet],
  WBTC,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633,
)
