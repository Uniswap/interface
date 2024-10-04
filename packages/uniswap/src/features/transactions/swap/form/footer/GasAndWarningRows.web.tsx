import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { GasTradeRow, useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/footer/GasTradeRow'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { PriceImpactWarning } from 'uniswap/src/features/transactions/swap/modals/PriceImpactWarning'
import { SwapWarningModal } from 'uniswap/src/features/transactions/swap/modals/SwapWarningModal'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { normalizePriceImpact } from 'utilities/src/format/normalizePriceImpact'

export function GasAndWarningRows(): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const { t } = useTranslation()

  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()

  const { trade } = derivedSwapInfo
  const priceImpact = trade.trade ? normalizePriceImpact(trade.trade?.priceImpact) : undefined

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlocked(account?.address)

  const { formScreenWarning, priceImpactWarning, warnings } = useParsedSwapWarnings()
  const showPriceImpactWarning = Boolean(priceImpact && priceImpactWarning)
  const showFormWarning = formScreenWarning && formScreenWarning.displayedInline && !isBlocked

  const debouncedGasInfo = useDebouncedGasInfo()

  const onSwapWarningClick = useCallback(() => {
    if (!formScreenWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }
    setShowWarningModal(true)
  }, [formScreenWarning?.warning.message])

  return (
    <>
      {formScreenWarning && (
        <SwapWarningModal
          isOpen={showWarningModal}
          parsedWarning={formScreenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      )}

      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex gap="$spacing12">
        {isBlocked && (
          // TODO: review design of this warning.
          <BlockedAddressWarning
            row
            alignItems="center"
            alignSelf="stretch"
            backgroundColor="$surface2"
            borderBottomLeftRadius="$rounded16"
            borderBottomRightRadius="$rounded16"
            flexGrow={1}
            px="$spacing16"
            py="$spacing12"
          />
        )}

        <Flex gap="$spacing8" px="$spacing8" py="$spacing4">
          <GasTradeRow gasInfo={debouncedGasInfo} />

          {showPriceImpactWarning && priceImpactWarning && (
            <Flex centered row>
              <Flex fill>
                <Text color="$neutral2" variant="body4">
                  {t('transaction.priceImpact.label')}
                </Text>
              </Flex>
              <Flex>
                <PriceImpactWarning warning={priceImpactWarning}>
                  <Text color="$statusCritical" variant="body4">
                    {formatPercent(priceImpact)}
                  </Text>
                </PriceImpactWarning>
              </Flex>
            </Flex>
          )}

          {showFormWarning && (
            <TouchableArea onPress={onSwapWarningClick}>
              <AnimatedFlex
                centered
                row
                entering={FadeIn}
                // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
                exiting={undefined}
                gap="$spacing8"
                px="$spacing16"
              >
                {formScreenWarning.Icon && (
                  <formScreenWarning.Icon
                    color={formScreenWarning.color.text}
                    size={iconSizes.icon16}
                    strokeWidth={1.5}
                  />
                )}
                <Flex row>
                  <Text color={formScreenWarning.color.text} textAlign="center" variant="body3">
                    {formScreenWarning.warning.title}
                  </Text>
                </Flex>
              </AnimatedFlex>
            </TouchableArea>
          )}
        </Flex>

        <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />
      </Flex>
    </>
  )
}
