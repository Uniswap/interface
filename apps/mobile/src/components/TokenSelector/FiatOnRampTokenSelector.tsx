import React, { memo } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { TokenFiatOnRampList } from 'src/components/TokenSelector/TokenFiatOnRampList'
import Trace from 'src/components/Trace/Trace'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { AnimatedFlex } from 'ui/src'

interface Props {
  onBack: () => void
  onSelectCurrency: (currency: FiatOnRampCurrency) => void
}

function _FiatOnRampTokenSelector({ onSelectCurrency, onBack }: Props): JSX.Element {
  return (
    <Trace
      logImpression
      element={ElementName.FiatOnRampTokenSelector}
      section={SectionName.TokenSelector}>
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing12"
        overflow="hidden"
        px="$spacing16"
        width="100%">
        <TokenFiatOnRampList onBack={onBack} onSelectCurrency={onSelectCurrency} />
      </AnimatedFlex>
    </Trace>
  )
}

export const FiatOnRampTokenSelector = memo(_FiatOnRampTokenSelector)
