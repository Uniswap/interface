import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { type ComponentRef, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Input, Popover, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { Edit } from 'ui/src/components/icons/Edit'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { fonts, iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { NEW_LAUNCH_CHAINS } from '~/features/Toucan/supportedChains'
import { getAuctionTokenInfoEnteredProperties } from '~/pages/Liquidity/CreateAuction/analytics'
import { NoWalletSection } from '~/pages/Liquidity/CreateAuction/components/NoWalletSection'
import { QuickLaunchSection } from '~/pages/Liquidity/CreateAuction/components/QuickLaunchSection'
import { TokenAdditionalInfoSection } from '~/pages/Liquidity/CreateAuction/components/TokenAdditionalInfoSection'
import { TokenImageUploadButton } from '~/pages/Liquidity/CreateAuction/components/TokenImageUploadButton'
import { useCreateAuctionStoreActions } from '~/pages/Liquidity/CreateAuction/CreateAuctionContext'
import { useCreateNewTokenAllowedNetworks } from '~/pages/Liquidity/CreateAuction/hooks/useAllowedNetworks'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'
import { useIsQuickLaunchMode } from '~/pages/Liquidity/CreateAuction/hooks/useIsQuickLaunchMode'
import { useIsStepValid } from '~/pages/Liquidity/CreateAuction/hooks/useIsStepValid'
import { useReconcileCreateNewTokenNetwork } from '~/pages/Liquidity/CreateAuction/hooks/useReconcileCreateNewTokenNetwork'
import { useTokenImageUpload } from '~/pages/Liquidity/CreateAuction/hooks/useTokenImageUpload'
import {
  CreateAuctionStep,
  type CreateNewTokenFormState,
  NEW_TOKEN_SYMBOL_MAX_LENGTH,
} from '~/pages/Liquidity/CreateAuction/types'
import { resolveCreateNewTokenDisplayImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveCreateNewTokenDisplayImageSrc'

export function NetworkSelector({
  network,
  allowedNetworks,
  onSelect,
  label,
}: {
  network: UniverseChainId
  allowedNetworks: UniverseChainId[]
  onSelect: (chainId: UniverseChainId) => void
  label?: string
}) {
  const chainInfo = getChainInfo(network)

  return (
    <Popover placement="bottom-start">
      <Popover.Trigger>
        <TouchableArea gap="$spacing2" p="$spacing16" borderRadius="$rounded20" backgroundColor="$surface2">
          {label && (
            <Text variant="body3" color="$neutral2">
              {label}
            </Text>
          )}
          <Flex row alignItems="center" gap="$spacing8">
            <NetworkLogo chainId={network} size={iconSizes.icon20} />
            <Text variant="body1" flex={1}>
              {chainInfo.label}
            </Text>
            <RotatableChevron direction="down" color="$neutral2" size="$icon.16" />
          </Flex>
        </TouchableArea>
      </Popover.Trigger>
      <Popover.Content
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing8"
        elevate
        animation={['fast', { opacity: { overshootClamping: true } }]}
        enterStyle={{ scale: 0.95, opacity: 0 }}
        exitStyle={{ scale: 0.95, opacity: 0 }}
      >
        <Popover.Arrow />
        <Flex gap="$spacing4">
          {allowedNetworks.map((chainId) => {
            const info = getChainInfo(chainId)
            const isSelected = chainId === network
            return (
              <Popover.Close key={chainId} asChild>
                <TouchableArea
                  row
                  alignItems="center"
                  gap="$spacing8"
                  p="$spacing8"
                  borderRadius="$rounded8"
                  backgroundColor={isSelected ? '$surface3' : '$transparent'}
                  onPress={() => onSelect(chainId)}
                >
                  <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
                  <Text variant="buttonLabel3">{info.label}</Text>
                  {NEW_LAUNCH_CHAINS.includes(chainId) && <NewTag ml="$none" />}
                  {isSelected && <CheckCircleFilled color="$neutral1" size="$icon.20" />}
                </TouchableArea>
              </Popover.Close>
            )
          })}
        </Flex>
      </Popover.Content>
    </Popover>
  )
}

export function CreateNewTokenForm({ createNew }: { createNew: CreateNewTokenFormState }) {
  const { t } = useTranslation()
  // QuickLaunch: quick launch replaces Continue with its own Review-and-launch CTA (flag-gated).
  const isQuickLaunchMode = useIsQuickLaunchMode()
  // QuickLaunch (flag-gated): live $TICKER preview under the image circle + ticker character counter.
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const tickerPreview = createNew.symbol.trim().toUpperCase()
  const tokenColor = useCreateAuctionTokenColor()
  const { updateCreateNewTokenField, commitTokenFormAndAdvance } = useCreateAuctionStoreActions()
  const [isEditingName, setIsEditingName] = useState(false)
  const symbolInputRef = useRef<ComponentRef<typeof Input> | null>(null)

  const canContinue = useIsStepValid(CreateAuctionStep.ADD_TOKEN_INFO)
  const allowedNetworks = useCreateNewTokenAllowedNetworks()
  const address = useActiveAddress(Platform.EVM)
  const trace = useTrace()

  const handleContinue = useEvent(() => {
    sendAnalyticsEvent(
      AuctionEventName.AuctionTokenInfoEntered,
      getAuctionTokenInfoEnteredProperties({ trace, tokenForm: createNew }),
    )
    commitTokenFormAndAdvance()
  })

  // The name display swaps to an edit input on press; fire the token-name click here because
  // wrapping the container Flex in <Trace logPress> doesn't catch the inner TouchableArea's press.
  const handleEnterNameEdit = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionTokenName })
    setIsEditingName(true)
  })

  // Testnet mode re-partitions the allowed networks, so the default selection (Unichain) can fall
  // out of the offered list; snap it back to a valid chain.
  useReconcileCreateNewTokenNetwork({ selectedNetwork: createNew.network, allowedNetworks })

  const { status: imageStatus, errorReason: imageErrorReason, start: startImageUpload } = useTokenImageUpload()
  const isImageProcessing = imageStatus === 'uploading' || imageStatus === 'verifying'
  // Blob preview (step-local upload) wins until the Pinata URL loads in the background; see
  // `useTokenImageUpload` + `localImagePreviewUri` on the store.
  const displayImageUri = resolveCreateNewTokenDisplayImageSrc(createNew.localImagePreviewUri, createNew.imageUrl)

  const imageErrorMessage = useMemo((): string | undefined => {
    switch (imageErrorReason) {
      case 'invalid-type':
        return t('toucan.createAuction.step.tokenInfo.image.error.invalidType')
      case 'too-large':
        return t('toucan.createAuction.step.tokenInfo.image.error.tooLarge')
      // A single generic message for every moderation slug — never surface the category.
      case 'rejected':
        return t('toucan.createAuction.step.tokenInfo.image.error.rejected')
      case 'upload-failed':
        return t('toucan.createAuction.step.tokenInfo.image.error.failed')
      default:
        return undefined
    }
  }, [imageErrorReason, t])

  const handleDisabledContinue = () => {
    if (createNew.name.trim().length === 0) {
      setIsEditingName(true)
      return
    }
    if (createNew.symbol.trim().length === 0) {
      const el = symbolInputRef.current as unknown as HTMLInputElement | null
      el?.focus()
    }
  }

  if (!address) {
    return (
      <NoWalletSection
        subtitle={t('toucan.createAuction.step.tokenInfo.subtitleCreateNew')}
        alertDescription={t('toucan.createAuction.step.tokenInfo.noWallet.createNew')}
      />
    )
  }

  return (
    <Flex gap="$spacing24">
      <Flex gap="$spacing4">
        <Text variant="subheading1">{t('toucan.createAuction.step.tokenInfo.title')}</Text>
        <Text variant="body3" color="$neutral2">
          {t('toucan.createAuction.step.tokenInfo.subtitleCreateNew')}
        </Text>
      </Flex>
      <Flex gap="$spacing16">
        <Flex row alignItems="center" gap="$spacing24" height={88} overflow="visible">
          <Flex alignItems="center" gap="$spacing4">
            <TokenImageUploadButton
              displayImageUri={displayImageUri}
              isProcessing={isImageProcessing}
              onPress={startImageUpload}
            />
            {isQuickLaunchFlagEnabled && tickerPreview.length > 0 && (
              <Text variant="body4" color="$neutral2" maxWidth={96} numberOfLines={1} textAlign="center">
                ${tickerPreview}
              </Text>
            )}
          </Flex>
          <Flex flex={1} gap="$spacing4" justifyContent="center">
            <Text variant="body3" color="$neutral2">
              {t('toucan.createAuction.step.tokenInfo.name')}
            </Text>
            {isEditingName ? (
              <Input
                autoFocus
                unstyled
                outlineStyle="none"
                value={createNew.name}
                onChangeText={(text) => updateCreateNewTokenField('name', text)}
                onBlur={() => setIsEditingName(false)}
                placeholder={t('toucan.createAuction.step.tokenInfo.namePlaceholder')}
                placeholderTextColor="$neutral3"
                fontFamily="$heading"
                fontSize={fonts.heading2.fontSize}
                lineHeight={fonts.heading2.lineHeight}
                fontWeight={fonts.heading2.fontWeight}
                color="$neutral1"
              />
            ) : (
              <Flex row alignItems="center" justifyContent="space-between">
                <TouchableArea flex={1} minWidth={0} onPress={handleEnterNameEdit}>
                  <Text variant="heading2" color={createNew.name ? '$neutral1' : '$neutral3'}>
                    {createNew.name || t('toucan.createAuction.step.tokenInfo.namePlaceholder')}
                  </Text>
                </TouchableArea>
                <TouchableArea alignItems="center" px="$spacing12" py="$spacing8" onPress={handleEnterNameEdit}>
                  <Edit color="$neutral1" size="$icon.20" />
                </TouchableArea>
              </Flex>
            )}
          </Flex>
        </Flex>
        {imageErrorMessage && (
          <Text variant="body3" color="$statusCritical">
            {imageErrorMessage}
          </Text>
        )}
        <Flex gap="$spacing8">
          <Flex row gap="$spacing8">
            <Flex flex={3} backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2">
              <Flex row alignItems="center" justifyContent="space-between">
                <Text variant="body3" color="$neutral2">
                  {t('toucan.createAuction.step.tokenInfo.ticker')}
                </Text>
                {isQuickLaunchFlagEnabled && createNew.symbol.length > 0 && (
                  <Text variant="body4" color="$neutral3">
                    {createNew.symbol.length}/{NEW_TOKEN_SYMBOL_MAX_LENGTH}
                  </Text>
                )}
              </Flex>
              <Trace logFocus element={ElementName.AuctionTokenTicker}>
                <Input
                  ref={symbolInputRef}
                  flex={1}
                  value={createNew.symbol}
                  onChangeText={(text) => updateCreateNewTokenField('symbol', text)}
                  maxLength={NEW_TOKEN_SYMBOL_MAX_LENGTH}
                  placeholder={t('toucan.createAuction.step.tokenInfo.tickerPlaceholder')}
                  unstyled
                  outlineStyle="none"
                  fontFamily="$body"
                  fontSize={fonts.body1.fontSize}
                  lineHeight={fonts.body1.lineHeight}
                  fontWeight={fonts.body1.fontWeight}
                  color="$neutral1"
                  placeholderTextColor="$neutral3"
                />
              </Trace>
            </Flex>
            <Flex flex={2}>
              <NetworkSelector
                network={createNew.network}
                allowedNetworks={allowedNetworks}
                onSelect={(chainId) => updateCreateNewTokenField('network', chainId)}
                label={t('toucan.createAuction.step.tokenInfo.network')}
              />
            </Flex>
          </Flex>
          <TokenAdditionalInfoSection
            description={createNew.description}
            onDescriptionChange={(v) => updateCreateNewTokenField('description', v)}
          />
        </Flex>
      </Flex>
      <QuickLaunchSection />
      {!isQuickLaunchMode && (
        <Flex row>
          <Trace logPress element={ElementName.Continue} properties={{ token_source: 'new' }}>
            <Button
              size="large"
              emphasis="primary"
              onPress={handleContinue}
              isDisabled={!canContinue}
              onDisabledPress={canContinue ? undefined : handleDisabledContinue}
              fill
              backgroundColor={canContinue ? tokenColor : undefined}
            >
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      )}
    </Flex>
  )
}
