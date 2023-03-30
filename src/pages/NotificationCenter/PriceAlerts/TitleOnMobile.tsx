import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import CreateAlertButton from 'pages/NotificationCenter/PriceAlerts/CreateAlertButton'
import { MEDIA_WIDTHS } from 'theme'

const TitleOnMobile = () => {
  const theme = useTheme()
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  if (!upToMedium) {
    return null
  }

  return (
    <Flex
      padding="0 16px"
      backgroundColor={theme.tableHeader}
      height="60px"
      alignItems="center"
      justifyContent="space-between"
    >
      <Text as="span" fontWeight={500} color={theme.text}>
        <Trans>Price Alert</Trans>
      </Text>

      <CreateAlertButton />
    </Flex>
  )
}

export default TitleOnMobile
