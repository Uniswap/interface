import { useTranslation } from 'react-i18next'
import { InlineCard, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { GeoRestrictionModal } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionModal'
import { useGeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/useGeoRestrictionModalStore'
import {
  useGeoRestrictionMode,
  useIsTokenGeoRestricted,
} from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'

export function GeoRestrictionCard(): JSX.Element | null {
  const { t } = useTranslation()
  const mode = useGeoRestrictionMode()
  const inputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const outputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)
  // The restriction can be triggered by either side, so label the warning with the blocked
  // token, preferring the input when it's the restricted side. The card returns null in
  // `default` mode, so by the time this symbol is read at least one side is restricted; if it
  // isn't the input, it's the output.
  const isInputRestricted = useIsTokenGeoRestricted(inputCurrency)
  const restrictedSymbol = (isInputRestricted ? inputCurrency : outputCurrency)?.symbol
  const { isOpen, open, close } = useGeoRestrictionModalStore((s) => ({
    isOpen: s.isOpen,
    open: s.open,
    close: s.close,
  }))

  if (mode === 'default') {
    return null
  }

  // Use a complete generic string when the token symbol is unavailable rather than
  // interpolating a translated fallback into another translated string (breaks grammar
  // in some languages).
  const description = ((): string => {
    if (restrictedSymbol) {
      return mode === 'restricted'
        ? t('swap.geoRestriction.yourRegion.description', { tokenSymbol: restrictedSymbol })
        : t('swap.geoRestriction.someRegions.description', { tokenSymbol: restrictedSymbol })
    }
    return mode === 'restricted'
      ? t('swap.geoRestriction.yourRegion.descriptionGeneric')
      : t('swap.geoRestriction.someRegions.descriptionGeneric')
  })()

  return (
    <>
      <TouchableArea onPress={open}>
        <InlineCard
          padding="$spacing16"
          CtaButtonIcon={ExternalLink}
          CtaButtonIconColor="$neutral2"
          Icon={GlobeFilled}
          color="$neutral2"
          iconColor="$neutral2"
          backgroundColor="$surface2"
          description={
            <Text color="$neutral2" variant="body3">
              {description}
            </Text>
          }
          onPressCtaButton={open}
        />
      </TouchableArea>
      {isOpen && <GeoRestrictionModal isOpen={isOpen} mode={mode} tokenSymbol={restrictedSymbol} onClose={close} />}
    </>
  )
}
