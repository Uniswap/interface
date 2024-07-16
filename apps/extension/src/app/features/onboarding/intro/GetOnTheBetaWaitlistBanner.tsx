import { useTranslation } from 'react-i18next'
import { Button, Flex, FlexProps, Image, Text, useIsDarkMode } from 'ui/src'
import { APP_SCREENSHOT_DARK, APP_SCREENSHOT_LIGHT } from 'ui/src/assets'
import { RotatableChevron } from 'ui/src/components/icons'

export function GetOnTheBetaWaitlistBanner(): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  return (
    <Button
      alignItems="center"
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      display="flex"
      hoverStyle={{ backgroundColor: '$surface2' } as FlexProps}
      justifyContent="space-between"
      p="$spacing16"
      pl="$spacing24"
      pressStyle={{ backgroundColor: '$surface3' } as FlexProps}
      width="100%"
      onPress={() => {
        window.open('https://wallet.uniswap.org/')
      }}
    >
      <Flex alignItems="center" flexDirection="row" gap="$spacing16" justifyContent="center">
        <Image height="52px" source={isDarkMode ? APP_SCREENSHOT_DARK : APP_SCREENSHOT_LIGHT} width="52px" />
        <Flex alignItems="flex-start" flexDirection="column" gap="$spacing4">
          <Text color="$accent1" fontSize="$small" variant="buttonLabel2">
            {t('onboarding.extension.getOnTheBetaWaitlist.title')}
          </Text>

          <Text color="$neutral2" fontSize="$small" variant="body3">
            {t('onboarding.extension.getOnTheBetaWaitlist.subtitle')}
          </Text>
        </Flex>
      </Flex>
      <RotatableChevron color="$neutral3" direction="right" />
    </Button>
  )
}
