import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { UnichainAnimatedText } from 'ui/src/components/text/UnichainAnimatedText'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'

export function UnichainToggle() {
  const { t } = useTranslation()
  const isUnichainEnabled = useFeatureFlag(FeatureFlags.Unichain)
  const isUnichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const unichainFlagName = getFeatureFlagName(FeatureFlags.Unichain)
  const unichainPromoFlagName = getFeatureFlagName(FeatureFlags.UnichainPromo)
  const colors = useSporeColors()
  const unichainPreviousDisabledRef = useRef(isUnichainEnabled && isUnichainPromoEnabled)

  return (
    <SettingsToggle
      title={
        <UnichainAnimatedText
          gradientTextColor={colors.neutral1.val}
          delayMs={500}
          variant="body3"
          // Only show gradient animation when a user goes from disabled to enabled for both flags
          enabled={!unichainPreviousDisabledRef.current && isUnichainEnabled && isUnichainPromoEnabled}
        >
          {t('unichain.promotion.beta.enable')}
        </UnichainAnimatedText>
      }
      dataid="unichain-toggle"
      isActive={isUnichainEnabled && isUnichainPromoEnabled}
      toggle={() => {
        // If the flags are different, override them both to true
        if (isUnichainEnabled !== isUnichainPromoEnabled) {
          Statsig.overrideGate(unichainFlagName, true)
          Statsig.overrideGate(unichainPromoFlagName, true)
        } else {
          Statsig.overrideGate(unichainFlagName, !isUnichainEnabled)
          Statsig.overrideGate(unichainPromoFlagName, !isUnichainPromoEnabled)
        }
      }}
    />
  )
}
