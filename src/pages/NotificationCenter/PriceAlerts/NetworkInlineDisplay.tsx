import { ChainId } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'

import { NetworkLogo } from 'components/Logo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'

type Props = {
  chainId: ChainId
}
const NetworkInlineDisplay: React.FC<Props> = ({ chainId }) => {
  const { name } = NETWORKS_INFO[chainId]
  const theme = useTheme()

  return (
    <Flex
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <NetworkLogo chainId={chainId} style={{ width: 16, height: 16, marginRight: '4px' }} />
      <Text
        as="span"
        sx={{
          whiteSpace: 'nowrap',
          fontWeight: 500,
          fontSize: '14px',
          color: theme.text,
        }}
      >
        {name}
      </Text>
    </Flex>
  )
}
export default NetworkInlineDisplay
