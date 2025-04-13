import { OutageCloseButton } from 'components/Banner/Outage/OutageBanner'
import { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Globe } from 'react-feather'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

export function MonadOutageBanner() {
  const [hidden, setHidden] = useState(false)
  const theme = useTheme()

  if (hidden) {
    return null
  }

  return (
    <Flex
      width={360}
      maxWidth="95%"
      $platform-web={{ position: 'fixed' }}
      bottom={40}
      right={20}
      backgroundColor={theme.surface2}
      zIndex={zIndexes.sticky}
      borderRadius="$rounded20"
      borderStyle="solid"
      borderWidth={1.3}
      borderColor={theme.surface3}
      $lg={{
        bottom: 62,
      }}
      $sm={{
        bottom: 80,
      }}
      $xs={{
        right: 10,
        left: 10,
      }}
    >
      <Flex row p="$spacing10" borderRadius="$rounded20" height="100%">
        <Flex
          centered
          m={12}
          mr={6}
          height={45}
          width={45}
          backgroundColor={theme.deprecated_accentWarningSoft}
          borderRadius="$rounded12"
        >
          <Globe size={28} color={theme.warning2} />
        </Flex>
        <Flex gap="$spacing2" p={10} $xs={{ maxWidth: 270 }} flexShrink={1}>
          <Text variant="body2" color={theme.neutral1}>
            <Trans i18nKey="home.banner.testnetMode.outage.monad.title" />
          </Text>
          <Text variant="body3" color={theme.neutral2}>
            <Trans i18nKey="home.banner.testnetMode.outage.monad.description" />
          </Text>
        </Flex>
        <OutageCloseButton
          data-testid="monad-outage-banner"
          onClick={() => {
            setHidden(true)
          }}
        />
      </Flex>
    </Flex>
  )
}
