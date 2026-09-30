import { isWebApp, isWebPlatform } from '@universe/environment'
import { AnimatedFlex, Flex, Text } from '@universe/mycelium'
import { cn } from '@universe/mycelium/cn'
import { ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { TestID } from '@universe/test'
import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { Gas } from 'ui/src/components/icons/Gas'
import { SponsoredFee, SponsoredFeeWithModal, UniswapXFee } from 'uniswap/src/components/gas/NetworkFee'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { isZero } from 'uniswap/src/utils/number'

function NetworkFeeWarningContent({ gasInfo }: { gasInfo?: GasInfo }): JSX.Element | null {
  const sponsorMetadata = gasInfo?.sponsorshipInfo?.sponsorMetadata
  if (sponsorMetadata) {
    return <SponsoredFee sponsorMetadata={sponsorMetadata} preSavingsGasFee={gasInfo.fiatPriceFormatted} />
  }

  if (!gasInfo?.fiatPriceFormatted) {
    return null
  }

  const color = gasInfo.isHighRelativeToValue && !isWebApp ? '$statusCritical' : '$neutral2' // Avoid high gas UI on interface
  const uniswapXSavings = gasInfo.uniswapXGasFeeInfo?.preSavingsGasFeeFormatted
  const isGasFeeFree = gasInfo.gasFee.value !== undefined && isZero(gasInfo.gasFee.value)

  return uniswapXSavings ? (
    <UniswapXFee gasFee={gasInfo.fiatPriceFormatted} isFree={isGasFeeFree} preSavingsGasFee={uniswapXSavings} />
  ) : (
    <>
      <Gas color={color} size="$icon.16" />
      <Text color={color} variant="body3">
        {gasInfo.fiatPriceFormatted}
      </Text>
    </>
  )
}

export function GasInfoRow({ gasInfo, hidden }: { gasInfo: GasInfo; hidden?: boolean }): JSX.Element | null {
  const { sponsorMetadata, campaign } = gasInfo.sponsorshipInfo ?? {}

  // Reanimated leg of the legacy Tamagui 'quick' opacity fade (enterStyle opacity 0 -> the
  // hidden/isLoading-driven target, tracked continuously on every subsequent change too).
  // Reset to the 0 seed whenever the row renders null: TradeInfoRow renders this row
  // unconditionally, so the instance stays mounted through that period and a settled value
  // would otherwise persist and make the next enter fade a 1 to 1 no-op. The reset is a bare
  // assignment rather than a curve so the next fade starts from exactly 0 no matter how
  // briefly the row was hidden.
  // TradeWarning's fade is mount-only, so it gets a declarative `entering` prop instead; the
  // continuous target tracking here is what rules that out.
  const canRender = Boolean(sponsorMetadata || gasInfo.fiatPriceFormatted)
  const targetOpacity = hidden ? 0 : gasInfo.isLoading ? 0.6 : 1
  const opacity = useSharedValue(0)
  useEffect(() => {
    if (!canRender) {
      opacity.value = 0
      return
    }
    opacity.value = withSporeCurve('quick', targetOpacity)
  }, [canRender, targetOpacity, opacity])
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity])

  // Web has no Reanimated lane: every web leg drops the worklet style, so the same opacity
  // rides a CSS transition. duration-200 is the documented CSS approximation of 'quick'.
  // The transition alone cannot reproduce the enter fade: on first paint there is no previous
  // value to interpolate from, so the fadeIn preset supplies the missing start frame (its
  // keyframe declares only `from { opacity: 0 }` and does not fill, so it animates up to
  // whichever state class is in effect and then hands the property back to the transition).
  // The state class must stay LAST: it and the preset's `opacity-[1]` are one tailwind-merge
  // group, and the later class wins.
  const opacityProps = isWebPlatform
    ? {
        className: cn(
          ENTER_PRESET_CLASSES.fadeIn,
          'transition-opacity duration-200 ease-out',
          hidden ? 'opacity-0' : gasInfo.isLoading ? 'opacity-60' : 'opacity-100',
        ),
      }
    : { style: animatedStyle }

  if (!canRender) {
    return null
  }

  if (sponsorMetadata && campaign) {
    return (
      <AnimatedFlex centered row {...opacityProps} testID={TestID.GasInfoRow}>
        <SponsoredFeeWithModal
          sponsorMetadata={sponsorMetadata}
          campaign={campaign}
          preSavingsGasFee={gasInfo.fiatPriceFormatted}
        />
      </AnimatedFlex>
    )
  }

  return (
    <AnimatedFlex centered row {...opacityProps}>
      <NetworkFeeWarning
        gasFeeHighRelativeToValue={gasInfo.isHighRelativeToValue}
        placement={isWebApp ? 'top' : 'bottom'}
        tooltipTrigger={
          <Flex centered row gap="$spacing4" testID={TestID.GasInfoRow}>
            <NetworkFeeWarningContent gasInfo={hidden ? undefined : gasInfo} />
          </Flex>
        }
        disabled={hidden}
        uniswapXGasFeeInfo={gasInfo.uniswapXGasFeeInfo}
        chainId={gasInfo.chainId}
      />
    </AnimatedFlex>
  )
}
