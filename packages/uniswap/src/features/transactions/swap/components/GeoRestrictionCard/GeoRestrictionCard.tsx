import { useTranslation } from 'react-i18next'
import { InlineCard, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { GlobeFilled } from 'ui/src/components/icons/GlobeFilled'
import { GeoRestrictionModal } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionModal'
import { useGeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/useGeoRestrictionModalStore'
import {
  useGeoRestrictedTokenSymbol,
  useGeoRestrictionMode,
} from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'

export function GeoRestrictionCard(): JSX.Element | null {
  const { t } = useTranslation()
  const mode = useGeoRestrictionMode()
  const restrictedSymbol = useGeoRestrictedTokenSymbol()
  const { isOpen, open, close } = useGeoRestrictionModalStore((s) => ({
    isOpen: s.isOpen,
    open: s.open,
    close: s.close,
  }))

  if (mode === 'default') {
    return null
  }

  // Use a self-contained generic string when the symbol is unavailable; interpolating a fallback breaks grammar in some languages.
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
          iconSize="$icon.16"
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
