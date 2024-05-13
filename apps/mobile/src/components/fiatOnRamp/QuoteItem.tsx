import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Loader } from 'src/components/loading'
import { Flex, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { concatStrings } from 'utilities/src/primitives/string'
import { FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'wallet/src/features/fiatOnRamp/utils'
import { ImageUri } from 'wallet/src/features/images/ImageUri'

function LogoLoader(): JSX.Element {
  return (
    <Loader.Box borderRadius="$roundedFull" height={iconSizes.icon40} width={iconSizes.icon40} />
  )
}

export function FORQuoteItem({
  serviceProvider,
  onPress,
}: {
  serviceProvider: FORServiceProvider | undefined
  onPress: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const logoUrl = getOptionalServiceProviderLogo(serviceProvider?.logos, isDarkMode)

  if (!serviceProvider) {
    return null
  }

  const paymentMethods =
    serviceProvider.paymentMethods.length > 3
      ? concatStrings(
          [
            serviceProvider.paymentMethods.slice(0, 3).join(', ') + ',', // oxford comma
            t('fiatOnRamp.quote.others'),
          ],
          t('common.endAdornment')
        )
      : serviceProvider.paymentMethods.join(', ')

  return (
    <TouchableArea onPress={onPress}>
      <Flex
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        pl="$spacing16"
        pr="$spacing8"
        py="$spacing16"
        shadowColor="$neutral3"
        shadowOpacity={0.4}
        shadowRadius={!isDarkMode ? '$spacing4' : undefined}>
        <Flex row alignItems="center" gap="$spacing12">
          <Flex>
            {logoUrl ? (
              <ImageUri
                fallback={<LogoLoader />}
                imageStyle={ServiceProviderLogoStyles.icon}
                uri={logoUrl}
              />
            ) : (
              <LogoLoader />
            )}
          </Flex>
          <Flex shrink gap="$spacing4">
            <Text color="$neutral1" variant="subheading2">
              {serviceProvider.name}
            </Text>
            <Text color="$neutral2" variant="body4">
              {paymentMethods}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

const ServiceProviderLogoStyles = StyleSheet.create({
  icon: {
    height: iconSizes.icon40,
    width: iconSizes.icon40,
  },
})
