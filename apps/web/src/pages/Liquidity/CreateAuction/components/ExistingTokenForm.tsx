import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Shine, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { ToucanGeoRestrictionCard } from '~/components/GeoRestriction/ToucanGeoRestrictionCard'
import { useToucanGeoRestriction } from '~/components/GeoRestriction/useToucanGeoRestriction'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTotalSupply } from '~/hooks/useTotalSupply'
import { getAuctionTokenInfoEnteredProperties } from '~/pages/Liquidity/CreateAuction/analytics'
import { ExistingTokenInfoDisplay } from '~/pages/Liquidity/CreateAuction/components/ExistingTokenInfoDisplay'
import { NoWalletSection } from '~/pages/Liquidity/CreateAuction/components/NoWalletSection'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateAuctionAllowedNetworks } from '~/pages/Liquidity/CreateAuction/hooks/useAllowedNetworks'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useExistingTokenProjectMetadata } from '~/pages/Liquidity/CreateAuction/hooks/useExistingTokenProjectMetadata'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { CreateAuctionStep, type ExistingTokenFormState } from '~/pages/Liquidity/CreateAuction/types'
import { SwitchNetworkAction } from '~/state/popups/types'

export function ExistingTokenForm({ existing }: { existing: ExistingTokenFormState }) {
  const { t } = useTranslation()
  const tokenColor = useCreateAuctionTokenColor()
  const { updateExistingTokenField, commitTokenFormAndAdvance } = useCreateAuctionStoreActions()
  const address = useActiveAddress(Platform.EVM)
  const trace = useTrace()

  const [showCurrencySearch, setShowCurrencySearch] = useState(false)
  const [lookupCurrencyId, setLookupCurrencyId] = useState<string | undefined>()
  const [invalidTokenSelected, setInvalidTokenSelected] = useState(false)
  const allowedNetworks = useCreateAuctionAllowedNetworks()

  const {
    currencyInfo: resolvedCurrencyInfo,
    loading: currencyLoading,
    error: currencyError,
  } = useCurrencyInfoWithLoading(lookupCurrencyId, { skip: !lookupCurrencyId })

  const selectedCurrencyInfo = existing.existingTokenCurrencyInfo
  const selectedCurrency = selectedCurrencyInfo?.currency
  const { totalSupply, isLoading: totalSupplyLoading, isError: totalSupplyError } = useTotalSupply(selectedCurrency)
  const projectMetadata = useExistingTokenProjectMetadata(selectedCurrencyInfo)
  const { isGeoRestricted, isGeoRestrictionPending, unavailableLabel } = useToucanGeoRestriction(selectedCurrency)

  const hasFetchError = (!!currencyError && !!lookupCurrencyId) || (totalSupplyError && !!selectedCurrencyInfo)
  const canContinue =
    useIsStepValid(CreateAuctionStep.ADD_TOKEN_INFO) &&
    !totalSupplyLoading &&
    !projectMetadata.loading &&
    !hasFetchError
  // Fail closed while the geo-restriction check is pending: keep the CTA disabled until the token is
  // confirmed clean, so a restricted token never briefly shows an enabled Continue button.
  const continueDisabled = !canContinue || isGeoRestricted || isGeoRestrictionPending

  const handleDisabledContinuePress = useCallback(() => {
    setShowCurrencySearch(true)
  }, [])

  const handleContinue = useEvent(() => {
    sendAnalyticsEvent(
      AuctionEventName.AuctionTokenInfoEntered,
      getAuctionTokenInfoEnteredProperties({ trace, tokenForm: existing }),
    )
    commitTokenFormAndAdvance()
  })

  // Auto-populate currencyInfo when address resolves
  useEffect(() => {
    if (resolvedCurrencyInfo && resolvedCurrencyInfo !== existing.existingTokenCurrencyInfo) {
      updateExistingTokenField('existingTokenCurrencyInfo', resolvedCurrencyInfo)
      setLookupCurrencyId(undefined)
    }
  }, [resolvedCurrencyInfo, existing.existingTokenCurrencyInfo, updateExistingTokenField])

  useEffect(() => {
    const resolved = totalSupply ?? undefined
    // We need both checks: `===` covers the undefined===undefined case (the setter always
    // spreads a new tokenForm object, so even a no-op call would trigger a re-render loop),
    // and `.equalTo()` covers value-equal but reference-distinct CurrencyAmount objects.
    const isSame =
      resolved === existing.totalSupply ||
      (resolved !== undefined && existing.totalSupply !== undefined && resolved.equalTo(existing.totalSupply))
    if (!isSame) {
      updateExistingTokenField('totalSupply', resolved)
    }
  }, [totalSupply, existing.totalSupply, updateExistingTokenField])

  useEffect(() => {
    if (projectMetadata.loading) {
      return
    }
    if (projectMetadata.description !== existing.description) {
      updateExistingTokenField('description', projectMetadata.description)
    }
    if (projectMetadata.websiteLink !== existing.websiteLink) {
      updateExistingTokenField('websiteLink', projectMetadata.websiteLink)
    }
    if (projectMetadata.xHandle !== existing.xProfile) {
      updateExistingTokenField('xProfile', projectMetadata.xHandle)
    }
  }, [projectMetadata, existing.description, existing.websiteLink, existing.xProfile, updateExistingTokenField])

  const [loggedErrorKey, setLoggedErrorKey] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (totalSupplyError && selectedCurrencyInfo) {
      const tokenAddress = selectedCurrencyInfo.currency.isToken ? selectedCurrencyInfo.currency.address : undefined
      const key = `${tokenAddress}-${selectedCurrencyInfo.currency.chainId}`
      if (loggedErrorKey === key) {
        return
      }
      setLoggedErrorKey(key)
      logger.error(new Error('ExistingTokenForm: failed to fetch total supply for selected token'), {
        tags: { file: 'ExistingTokenForm.tsx', function: 'ExistingTokenForm' },
        extra: {
          tokenAddress,
          chainId: selectedCurrencyInfo.currency.chainId,
        },
      })
    }
  }, [totalSupplyError, selectedCurrencyInfo, loggedErrorKey])

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
        <Trace logPress element={ElementName.AuctionTokenSearch}>
          <TouchableArea
            row
            alignItems="center"
            gap="$spacing16"
            justifyContent="space-between"
            p="$spacing16"
            borderRadius="$rounded12"
            borderWidth="$spacing1"
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
        </Trace>
      )}

      {invalidTokenSelected && (
        <Text variant="body3" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.tokenInfo.invalidTokenSelected')}
        </Text>
      )}

      {hasFetchError && (
        <Text variant="body3" color="$statusCritical" textAlign="center">
          {t('toucan.createAuction.step.tokenInfo.fetchError')}
        </Text>
      )}

      {selectedCurrencyInfo && (
        <ExistingTokenInfoDisplay
          description={existing.description}
          websiteLink={existing.websiteLink}
          xHandle={existing.xProfile}
        />
      )}

      <Flex row>
        <Trace logPress element={ElementName.Continue} properties={{ token_source: 'existing' }}>
          <Button
            size="large"
            emphasis="primary"
            onPress={handleContinue}
            disabled={continueDisabled}
            onDisabledPress={continueDisabled ? handleDisabledContinuePress : undefined}
            fill
            backgroundColor={continueDisabled ? undefined : tokenColor}
          >
            {isGeoRestricted ? unavailableLabel : t('common.button.continue')}
          </Button>
        </Trace>
      </Flex>

      {isGeoRestricted && <ToucanGeoRestrictionCard tokenSymbol={selectedCurrency?.symbol} />}

      <CurrencySearchModal
        isOpen={showCurrencySearch}
        onDismiss={() => setShowCurrencySearch(false)}
        switchNetworkAction={SwitchNetworkAction.LP}
        onCurrencySelect={(currency) => {
          setShowCurrencySearch(false)
          if (!currency.isToken) {
            setInvalidTokenSelected(true)
            return
          }
          setInvalidTokenSelected(false)
          updateExistingTokenField('existingTokenCurrencyInfo', undefined)
          updateExistingTokenField('totalSupply', undefined)
          setLookupCurrencyId(buildCurrencyId(currency.chainId, currency.address))
        }}
        chainIds={allowedNetworks}
        flow={TokenSelectorFlow.Liquidity}
      />
    </Flex>
  )
}
