import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { X } from 'ui/src/components/icons/X'
import { iconSizes, spacing } from 'ui/src/theme'
import { selectHasDismissedCrosschainSwapsPromoBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import { setHasDismissedCrosschainSwapsPromoBanner } from 'uniswap/src/features/behaviorHistory/slice'

export function CrosschainSwapsPromoBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const isChainedActionsEnabled = useFeatureFlag(FeatureFlags.ChainedActions)
  const hasDismissed = useSelector(selectHasDismissedCrosschainSwapsPromoBanner)

  const handleDismiss = useCallback(() => {
    dispatch(setHasDismissedCrosschainSwapsPromoBanner(true))
  }, [dispatch])

  if (!isChainedActionsEnabled || hasDismissed) {
    return null
  }

  return (
    <Flex
      row
      backgroundColor="$accent2Solid"
      borderRadius="$rounded12"
      gap="$spacing12"
      mx={spacing.spacing16}
      mb="$spacing8"
      p="$spacing12"
    >
      <Shuffle color="$accent1" size={iconSizes.icon24} />

      <Flex fill>
        <Text variant="body3">{t('swap.chainedActions.promo.title')}</Text>
        <Text color="$neutral2" variant="body3">
          {t('swap.chainedActions.promo.subtitle')}
        </Text>
      </Flex>

      <TouchableArea alignSelf="flex-start" onPress={handleDismiss}>
        <X color="$neutral2" size={iconSizes.icon20} />
      </TouchableArea>
    </Flex>
  )
}
