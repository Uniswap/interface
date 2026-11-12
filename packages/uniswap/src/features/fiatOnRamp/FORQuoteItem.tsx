import { isWebPlatform } from '@universe/environment'
import {
  AnimatedFlex,
  AnimatedTouchableArea,
  Flex,
  Loader,
  Text,
  UniversalImage,
  useIsDarkMode,
  borderRadii,
  iconSizes,
} from '@universe/mycelium'
import { TimePast } from '@universe/mycelium/icons/TimePast'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { useTranslation } from 'react-i18next'
import { useAnimatedStyle } from 'react-native-reanimated'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'

// Web legs of the legacy 200ms/100ms animation presets, scoped to the properties each site
// actually animates (never `all` — theme-token colors must not transition).
const HIDDEN_TRANSITION_200MS = `opacity ${SPORE_ANIMATION_CURVE_CSS['200ms']}, height ${SPORE_ANIMATION_CURVE_CSS['200ms']}`
const OPACITY_TRANSITION_100MS = `opacity ${SPORE_ANIMATION_CURVE_CSS['100ms']}`
const PAYMENT_METHODS_TRANSITION_100MS = `opacity ${SPORE_ANIMATION_CURVE_CSS['100ms']}, max-height ${SPORE_ANIMATION_CURVE_CSS['100ms']}`

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

  // Reanimated legs (native) of the legacy `animation` presets; withSporeCurve is native-only,
  // so on web these styles are never applied — the isWebPlatform spreads below carry the same
  // fades as scoped CSS transitions instead.
  const hiddenAnimatedStyle = useAnimatedStyle(() => ({ opacity: withSporeCurve('200ms', hidden ? 0 : 1) }), [hidden])
  const logoAnimatedStyle = useAnimatedStyle(() => ({ opacity: withSporeCurve('100ms', hidden ? 0 : 1) }), [hidden])
  // One hook per view: sharing a single animated style across two conditionally-mounted
  // views can leave one at a stale opacity when the other unmounts mid-animation.
  const recentLabelAnimatedStyle = useAnimatedStyle(
    () => ({ opacity: withSporeCurve('100ms', showPaymentMethods ? 1 : 0) }),
    [showPaymentMethods],
  )
  const paymentMethodsAnimatedStyle = useAnimatedStyle(
    () => ({ opacity: withSporeCurve('100ms', showPaymentMethods ? 1 : 0) }),
    [showPaymentMethods],
  )

  if (!serviceProvider) {
    return null
  }

  // oxlint-disable-next-line no-unnecessary-condition -- serviceProvider.paymentMethods is not initially defined
  const paymentMethodsArr = serviceProvider.paymentMethods ?? []

  const paymentMethods =
    paymentMethodsArr.length > 4
      ? t('fiatOnRamp.quote.type.list', { optionsList: paymentMethodsArr.slice(0, 3).join(', ') })
      : paymentMethodsArr.join(', ')

  return (
    <AnimatedTouchableArea
      disabled={isLoading || hidden}
      disabledStyle={{
        cursor: 'wait',
      }}
      height={hidden ? 0 : 'unset'}
      position={hidden ? 'absolute' : 'relative'}
      style={isWebPlatform ? undefined : hiddenAnimatedStyle}
      {...(isWebPlatform && { opacity: hidden ? 0 : 1, transition: HIDDEN_TRANSITION_200MS })}
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
            <AnimatedFlex
              style={isWebPlatform ? undefined : logoAnimatedStyle}
              {...(isWebPlatform && { opacity: hidden ? 0 : 1, transition: OPACITY_TRANSITION_100MS })}
            >
              {logoUrl ? (
                <UniversalImage
                  alt=""
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
            </AnimatedFlex>
            <Flex flex={1} gap="$spacing4">
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$neutral1" variant="body2">
                  {serviceProvider.name}
                </Text>
                {isRecent && (
                  <AnimatedFlex
                    row
                    alignItems="center"
                    gap="$spacing8"
                    style={isWebPlatform ? undefined : recentLabelAnimatedStyle}
                    {...(isWebPlatform && {
                      opacity: showPaymentMethods ? 1 : 0,
                      transition: OPACITY_TRANSITION_100MS,
                    })}
                  >
                    <Text color="$neutral2" variant="body4">
                      {t('common.recent')}
                    </Text>
                    <TimePast color="$neutral2" size="$icon.16" />
                  </AnimatedFlex>
                )}
              </Flex>
              {paymentMethods && (
                <AnimatedFlex
                  maxHeight={showPaymentMethods ? 'max-content' : 0}
                  style={isWebPlatform ? undefined : paymentMethodsAnimatedStyle}
                  {...(isWebPlatform && {
                    opacity: showPaymentMethods ? 1 : 0,
                    transition: PAYMENT_METHODS_TRANSITION_100MS,
                  })}
                >
                  <Text color="$neutral2" variant="body4">
                    {paymentMethods}
                  </Text>
                </AnimatedFlex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </AnimatedTouchableArea>
  )
}
