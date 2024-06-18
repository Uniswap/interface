import { FeeAmount, Pool } from '@taraswap/v3-sdk'
import { ChainId } from 'uniswap/src/types/chains'
import { UNI, WBTC } from 'wallet/src/constants/tokens'

export const mockPool = new Pool(
  UNI[ChainId.Mainnet],
  WBTC,
  FeeAmount.HIGH,
  '2437312313659959819381354528',
  '10272714736694327408',
  -69633
)
