import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Shine, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { SwitchNetworkAction } from '~/components/Popups/types'
import CurrencySearchModal from '~/components/SearchModal/CurrencySearchModal'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { NoWalletSection } from '~/pages/Liquidity/CreateAuction/components/NoWalletSection'
import { TokenAdditionalInfoSection } from '~/pages/Liquidity/CreateAuction/components/TokenAdditionalInfoSection'
import { useCreateAuctionAllowedNetworks } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionAllowedNetworks'
import { type ExistingTokenFields } from '~/pages/Liquidity/CreateAuction/types'

export function ExistingTokenForm({ existing }: { existing: ExistingTokenFields }) {
  const { t } = useTranslation()
  const { updateExistingField, commitTokenFormAndAdvance } = useCreateAuctionStoreActions()
  const address = useActiveAddress(Platform.EVM)

  const canContinue = existing.existingTokenCurrencyInfo !== undefined && existing.description.trim().length > 0
  const [showCurrencySearch, setShowCurrencySearch] = useState(false)
  const [lookupCurrencyId, setLookupCurrencyId] = useState<string | undefined>()
  const allowedNetworks = useCreateAuctionAllowedNetworks()

  const { currencyInfo: resolvedCurrencyInfo, loading: currencyLoading } = useCurrencyInfoWithLoading(
    lookupCurrencyId,
    {
      skip: !lookupCurrencyId,
    },
  )

  const selectedCurrencyInfo = existing.existingTokenCurrencyInfo

  // Auto-populate currencyInfo when address resolves
  useEffect(() => {
    if (resolvedCurrencyInfo && resolvedCurrencyInfo !== existing.existingTokenCurrencyInfo) {
      updateExistingField('existingTokenCurrencyInfo', resolvedCurrencyInfo)
      setLookupCurrencyId(undefined)
    }
  }, [resolvedCurrencyInfo, existing.existingTokenCurrencyInfo, updateExistingField])

  if (!address) {
    return (
      <NoWalletSection
        subtitle={t('toucan.createAuction.step.tokenInfo.subtitleExisting')}
        alertDescription={t('toucan.createAuction.step.tokenInfo.noWallet.existing')}
      />
    )
  }

  return (
    <Flex gap="$spacing24">
      <Flex gap="$spacing4">
        <Text variant="subheading1">{t('toucan.createAuction.step.tokenInfo.title')}</Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.subtitleExisting')}
        </Text>
      </Flex>
      {currencyLoading ? (
        <Shine width="100%">
          <Flex backgroundColor="$surface3" borderRadius="$rounded12" height={50} />
        </Shine>
      ) : (
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing16"
          justifyContent="space-between"
          p="$spacing16"
          borderRadius="$rounded12"
          borderWidth={1}
          borderColor="$surface3"
          backgroundColor="$surface1"
          onPress={() => setShowCurrencySearch(true)}
        >
          {selectedCurrencyInfo ? (
            <>
              <Flex width={iconSizes.icon64} height={iconSizes.icon64}>
                <TokenLogo
                  size={iconSizes.icon64}
                  chainId={selectedCurrencyInfo.currency.chainId}
                  name={selectedCurrencyInfo.currency.name}
                  symbol={selectedCurrencyInfo.currency.symbol}
                  url={selectedCurrencyInfo.logoUrl ?? undefined}
                />
              </Flex>
              <Flex flex={1}>
                <Text variant="heading3">{selectedCurrencyInfo.currency.name}</Text>
                <Text variant="body2" color="$neutral2">
                  {selectedCurrencyInfo.currency.symbol}
                </Text>
              </Flex>
            </>
          ) : (
            <Text variant="buttonLabel3" color="$neutral1" flex={1}>
              {t('toucan.createAuction.step.tokenInfo.selectToken')}
            </Text>
          )}
          <RotatableChevron direction="down" color="$neutral1" size="$icon.24" />
        </TouchableArea>
      )}

      {selectedCurrencyInfo && (
        <TokenAdditionalInfoSection
          description={existing.description}
          onDescriptionChange={(v) => updateExistingField('description', v)}
        />
      )}

      <Flex row>
        <Button size="large" emphasis="primary" onPress={commitTokenFormAndAdvance} isDisabled={!canContinue} fill>
          {t('common.button.continue')}
        </Button>
      </Flex>

      <CurrencySearchModal
        isOpen={showCurrencySearch}
        onDismiss={() => setShowCurrencySearch(false)}
        switchNetworkAction={SwitchNetworkAction.LP}
        onCurrencySelect={(currency) => {
          const address = currency.isToken ? currency.address : ''
          updateExistingField('existingTokenCurrencyInfo', undefined)
          if (currency.isToken) {
            setLookupCurrencyId(buildCurrencyId(currency.chainId, address))
          }
          setShowCurrencySearch(false)
        }}
        chainIds={allowedNetworks}
      />
    </Flex>
  )
}
