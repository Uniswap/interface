import { Flex, Text } from 'rebass'

import Logo from 'components/Logo'
import useTheme from 'hooks/useTheme'

type Props = {
  symbol: string
  logoUrl?: string
  amount?: string
}
const TokenInlineDisplay: React.FC<Props> = ({ symbol, logoUrl = '', amount }) => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'nowrap',
      }}
    >
      <Logo srcs={[logoUrl]} style={{ width: 16, height: 16, borderRadius: '50%' }} />
      <Text
        sx={{
          fontWeight: 500,
          color: theme.text,
          fontSize: '14px',
        }}
      >
        {amount} {symbol}
      </Text>
    </Flex>
  )
}

export default TokenInlineDisplay
