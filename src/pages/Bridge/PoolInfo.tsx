import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Flex, Text } from 'rebass'

import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { PoolBridgeValue } from 'state/bridge/reducer'

import { formatPoolValue } from './helpers'
import { MultiChainTokenInfo } from './type'

const PoolInfo = ({
  chainId,
  tokenIn,
  poolValue,
}: {
  chainId: ChainId | undefined
  tokenIn: MultiChainTokenInfo | undefined
  poolValue: PoolBridgeValue
}) => {
  const theme = useTheme()
  return (
    <Flex
      alignItems="center"
      justifyContent={'flex-end'}
      fontSize={12}
      fontWeight={500}
      color={theme.subText}
      width="100%"
    >
      <Text>
        <Trans>
          {chainId &&
            `${NETWORKS_INFO[chainId].name} Pool: ${`${tokenIn ? formatPoolValue(poolValue) : t`loading token`} ${
              tokenIn?.symbol ?? ''
            }`}`}
        </Trans>
      </Text>
    </Flex>
  )
}

export default PoolInfo
