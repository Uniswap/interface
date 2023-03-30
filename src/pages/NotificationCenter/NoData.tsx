import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'

export default function NoData({ msg }: { msg: string }) {
  const theme = useTheme()
  return (
    <Flex flex="1 1 0" justifyContent="center" width="100%" alignItems="center">
      <Flex
        sx={{
          flexDirection: 'column',
          alignItems: 'center',
          color: theme.subText,
          gap: '0.75rem',
        }}
      >
        <Info size={'24px'} />
        <Text as="span">{msg}</Text>
      </Flex>
    </Flex>
  )
}
