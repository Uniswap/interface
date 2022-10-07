import { rgba } from 'polished'
import { Flex } from 'rebass'
import { useTheme } from 'styled-components'

import MoneyBag from './MoneyBag'

const FarmingIcon = () => {
  const theme = useTheme()
  return (
    <Flex
      width={24}
      height={24}
      justifyContent="center"
      alignItems="center"
      sx={{
        borderRadius: '999px',
        background: rgba(theme.apr, 0.2),
      }}
    >
      <MoneyBag size={16} color={theme.apr} />
    </Flex>
  )
}

export default FarmingIcon
