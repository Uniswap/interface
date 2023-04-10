import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import useTheme from 'hooks/useTheme'

export default function NoData({ msg, isLoading }: { msg: string; isLoading: boolean }) {
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
        {isLoading ? (
          <Loader size="36px" />
        ) : (
          <>
            <Info size={'24px'} />
            <Text as="span">{msg}</Text>
          </>
        )}
      </Flex>
    </Flex>
  )
}
