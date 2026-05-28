import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Loader, Text, TouchableArea, UniversalImage, useIsDarkMode } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

function LogoLoader(): JSX.Element {
  return <Loader.Box borderRadius="$roundedFull" height={iconSizes.icon40} width={iconSizes.icon40} />
}

export function FORQuoteItem({
  serviceProvider,
  onPress,
  hoverIcon,
  isLoading,
}: {
  serviceProvider: FORServiceProvider | undefined
  onPress: () => void
  hoverIcon?: JSX.Element
  isLoading?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const logoUrl = getOptionalServiceProviderLogo(serviceProvider?.logos, isDarkMode)
  const [hovered, setHovered] = useState(false)

  if (!serviceProvider) {
    return null
  }

  const paymentMethods =
    serviceProvider.paymentMethods.length > 4
      ? t('fiatOnRamp.quote.type.list', { optionsList: serviceProvider.paymentMethods.slice(0, 3).join(', ') })
      : serviceProvider.paymentMethods.join(', ')

  return (
    <TouchableArea
      disabled={isLoading}
      disabledStyle={{
        cursor: 'wait',
      }}
      onMouseEnter={() => setHovered(!isLoading)}
      onMouseLeave={() => setHovered(false)}
      onPress={isLoading ? undefined : onPress}
    >
      <Flex
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        pl="$spacing16"
        pr="$spacing8"
        py="$spacing16"
        shadowColor="$shadowColor"
        shadowOpacity={0.03}
        shadowRadius={4}
        shadowOffset={{ height: 1, width: 0 }}
        style={{ transition: 'background-color 0.2s ease-in-out' }}
      >
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row alignItems="center" gap="$spacing12" maxWidth="calc(100% - 48px)">
            <Flex>
              {logoUrl ? (
                <UniversalImage
                  fallback={<LogoLoader />}
                  size={{
                    height: iconSizes.icon40,
                    width: iconSizes.icon40,
                  }}
                  style={{
                    image: { borderRadius: borderRadii.rounded8 },
                  }}
                  uri={logoUrl}
                />
              ) : (
                <LogoLoader />
              )}
            </Flex>
            <Flex shrink>
              <Text color="$neutral1" variant="subheading2">
                {serviceProvider.name}
              </Text>
              {paymentMethods && (
                <Text color="$neutral2" variant="body4">
                  {paymentMethods}
                </Text>
              )}
            </Flex>
          </Flex>
          {hovered && hoverIcon}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
