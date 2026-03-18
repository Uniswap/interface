import { useTranslation } from 'react-i18next'
import { Flex, Loader, Text, TouchableArea, UniversalImage, useIsDarkMode } from 'ui/src'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

function LogoLoader(): JSX.Element {
  return <Loader.Box borderRadius="$roundedFull" height={iconSizes.icon32} width={iconSizes.icon32} />
}

export function FORQuoteItem({
  serviceProvider,
  onPress,
  isLoading,
  showPaymentMethods = true,
  isRecent = false,
  hidden = false,
}: {
  serviceProvider: FORServiceProvider | undefined
  onPress: () => void
  isLoading?: boolean
  showPaymentMethods?: boolean
  isRecent?: boolean
  hidden?: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const logoUrl = getOptionalServiceProviderLogo(serviceProvider?.logos, isDarkMode)

  if (!serviceProvider) {
    return null
  }

  const paymentMethods =
    serviceProvider.paymentMethods.length > 4
      ? t('fiatOnRamp.quote.type.list', { optionsList: serviceProvider.paymentMethods.slice(0, 3).join(', ') })
      : serviceProvider.paymentMethods.join(', ')

  return (
    <TouchableArea
      disabled={isLoading || hidden}
      disabledStyle={{
        cursor: 'wait',
      }}
      opacity={hidden ? 0 : 1}
      height={hidden ? 0 : 'unset'}
      animation="200ms"
      position={hidden ? 'absolute' : 'relative'}
      onPress={isLoading || hidden ? undefined : onPress}
    >
      <Flex
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        p="$spacing16"
        style={{ transition: 'background-color 0.2s ease-in-out' }}
      >
        <Flex row alignItems="center" justifyContent="space-between">
          <Flex row alignItems="center" gap="$spacing12" width="100%">
            <Flex opacity={hidden ? 0 : 1} animation="100ms">
              {logoUrl ? (
                <UniversalImage
                  fallback={<LogoLoader />}
                  size={{
                    height: iconSizes.icon32,
                    width: iconSizes.icon32,
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
            <Flex flex={1} gap="$spacing4">
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral1" variant="body2">
                  {serviceProvider.name}
                </Text>
                {isRecent && (
                  <Flex row alignItems="center" gap="$spacing8" opacity={showPaymentMethods ? 1 : 0} animation="100ms">
                    <Text color="$neutral2" variant="body4">
                      {t('common.recent')}
                    </Text>
                    <TimePast color="$neutral2" size="$icon.16" />
                  </Flex>
                )}
              </Flex>
              {paymentMethods && (
                <Text
                  color="$neutral2"
                  variant="body4"
                  opacity={showPaymentMethods ? 1 : 0}
                  maxHeight={showPaymentMethods ? 'max-content' : 0}
                  animation="100ms"
                >
                  {paymentMethods}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
