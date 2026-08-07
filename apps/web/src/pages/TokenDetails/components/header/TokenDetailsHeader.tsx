import { SharedEventName } from '@uniswap/analytics-events'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { iconSizes } from 'ui/src/theme'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { PermissionedTokenTooltip } from 'uniswap/src/features/permissionedTokens/PermissionedTokenTooltip'
import { getRWAHeaderIdentity } from 'uniswap/src/features/rwa/getRWAHeaderIdentity'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { getHeaderLogoSize, getHeaderTitleVariant } from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { DesktopHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/DesktopHeaderActions'
import { MobileHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/MobileHeaderActions'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useModalState } from '~/hooks/useModalState'
import { RWAIssuerHeaderDetails } from '~/pages/TokenDetails/components/header/RWAIssuerHeaderDetails'
import { TokenDetailsHeaderAddressCopyMobile } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderAddressCopyMobile'
import { TokenDetailsHeaderSubtitleMobile } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderSubtitleMobile'
import { TokenDetailsNetworkFilter } from '~/pages/TokenDetails/components/header/TokenDetailsNetworkFilter'
import { useTokenDetailsHeaderActions } from '~/pages/TokenDetails/components/header/useTokenDetailsHeaderActions'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPPermissionedState } from '~/pages/TokenDetails/hooks/useTDPPermissionedState'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

interface TokenDetailsHeaderProps {
  isCompact: boolean
}

function getShowAddressCopy({
  isNative,
  isMultiChainAsset,
  selectedChainId,
}: {
  isNative: boolean
  isMultiChainAsset: boolean
  selectedChainId: UniverseChainId | undefined
}): boolean {
  if (!isMultiChainAsset) {
    return !isNative
  }
  return !!selectedChainId && !isNative
}

export function TokenDetailsHeader({ isCompact }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const trace = useTrace()
  const isMobileScreen = media.md

  const { currency, tokenProjectQuery, multiChainMap, chainDataLoading } = useTDPStore((s) => ({
    currency: s.currency!,
    tokenProjectQuery: s.tokenProjectQuery,
    multiChainMap: s.multiChainMap,
    chainDataLoading: s.chainDataLoading,
  }))
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const multichainChainIds = useMemo(() => multichainEntries.map((entry) => entry.chainId), [multichainEntries])

  const { selectedMultichainChainId: selectedChainId, setSelectedMultichainChainId: onSelectedChainChange } =
    useTDPSelectedMultichainChain()

  const effectiveCurrency = useTDPEffectiveCurrency()
  const rwaMatch = useRWATokenDetailsMatch()

  const metadata = useTokenMetadata(currencyId(effectiveCurrency), { legacyToken: tokenProjectQuery.data?.token })

  const displayAddress = effectiveCurrency.isNative ? NATIVE_CHAIN_ID : effectiveCurrency.address
  const isNative = effectiveCurrency.isNative
  const tokenLogoSize = getHeaderLogoSize({ isCompact, media, scaleMobileOnScroll: true })

  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)
  const openReportTokenModal = useEvent(() => {
    void setModalProps({
      source: 'token-details',
      currency,
      isMarkedSpam: metadata.isSpam,
      isMultichainAsset: isMultiChainAsset,
      shouldReportMultichainAsset: isMultiChainAsset && selectedChainId === undefined,
    })
    openModal()
  })

  const onReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-token-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const {
    value: isReportDataIssueModalOpen,
    setTrue: openReportDataIssueModal,
    setFalse: closeReportDataIssueModal,
  } = useBooleanState(false)

  const { desktopHeaderActions, mobileHeaderActionSections } = useTokenDetailsHeaderActions({
    currency: effectiveCurrency,
    project: { homepageUrl: metadata.homepageUrl, twitterName: metadata.twitterName },
    openReportTokenModal,
    openReportDataIssueModal,
    isMobileScreen,
  })

  const tokenSymbol = metadata.symbol ?? effectiveCurrency.symbol ?? t('tdp.symbolNotFound')
  const fallbackTokenName = metadata.name ?? effectiveCurrency.name ?? t('tdp.nameNotFound')
  // Matched RWAs show the underlying asset name from listRwas, but keep the token's own logo.
  const { name: tokenName, logoUrl: tokenLogoUrl } = getRWAHeaderIdentity({
    rwaMatch,
    fallbackName: fallbackTokenName,
    logoUrl: metadata.logoUrl,
  })
  const showAddressCopy = getShowAddressCopy({ isNative, isMultiChainAsset, selectedChainId })

  const onBreadcrumbAddressCopied = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.CopyAddress,
      chain_name: getChainInfo(effectiveCurrency.chainId).urlParam,
    })
  })

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      data-testid={TestID.TokenDetailsInfoContainer}
    >
      <Flex row flex={1} alignItems="center" gap="$gap12">
        <TokenLogo
          url={tokenLogoUrl}
          symbol={effectiveCurrency.symbol ?? undefined}
          name={effectiveCurrency.name ?? undefined}
          chainId={!isMultiChainAsset ? effectiveCurrency.chainId : null}
          size={tokenLogoSize}
          transition={HEADER_TRANSITION}
        />
        <Flex gap={isCompact ? '$gap4' : '$gap8'} $md={{ gap: '$none' }} transition={HEADER_TRANSITION}>
          <Flex row flex={1} alignItems="flex-end" gap="$gap8" $sm={{ width: '100%' }}>
            <Text
              tag="h1"
              variant={getHeaderTitleVariant({ isCompact, media })}
              transition={HEADER_TRANSITION}
              {...EllipsisTamaguiStyle}
            >
              {tokenName}
            </Text>
            {!isCompact && !media.md && (
              <Text
                tag="h2"
                variant="subheading1"
                textTransform="uppercase"
                color="$neutral2"
                $sm={{ display: 'none' }}
                transition={HEADER_TRANSITION}
              >
                {tokenSymbol}
              </Text>
            )}
            <TokenDetailsHeaderAddressCopyMobile
              displayAddress={displayAddress}
              isNative={isNative}
              chainId={effectiveCurrency.chainId}
              isMultiChainAsset={isMultiChainAsset}
              selectedChainId={selectedChainId}
              multichainEntries={multichainEntries}
            />
            <PermissionedHeaderLock isCompact={isCompact} mediaMd={media.md} currency={effectiveCurrency} />
          </Flex>
          <TokenDetailsHeaderSubtitleMobile rwaMatch={rwaMatch} symbol={tokenSymbol} isCompact={isCompact} />
          {!media.sm && (
            <Flex row alignItems="center" gap="$spacing6">
              <RWAIssuerHeaderDetails rwaMatch={rwaMatch} />
              <TokenDetailsNetworkFilter
                chainIds={multichainChainIds}
                selectedChainId={selectedChainId}
                setSelectedChainId={onSelectedChainChange}
                showAddressCopy={showAddressCopy}
                isChainDataLoading={chainDataLoading}
              />
              {showAddressCopy && (
                <Flex alignSelf="center">
                  <CopyHelper
                    toCopy={displayAddress}
                    iconPosition="right"
                    iconSize={iconSizes.icon16}
                    iconColor="$neutral2"
                    color="$neutral2"
                    dataTestId={TestID.BreadcrumbHoverCopy}
                    onCopy={onBreadcrumbAddressCopied}
                  >
                    <Text color="$neutral2">{shortenAddress({ address: displayAddress })}</Text>
                  </CopyHelper>
                </Flex>
              )}
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex row gap="$gap8" alignItems="center" justifyContent="center">
        {isMobileScreen ? (
          <MobileHeaderActions actionSections={mobileHeaderActionSections} />
        ) : (
          <DesktopHeaderActions actions={desktopHeaderActions} />
        )}
        {media.sm && (
          <TokenDetailsNetworkFilter
            chainIds={multichainChainIds}
            selectedChainId={selectedChainId}
            setSelectedChainId={onSelectedChainChange}
            showAddressCopy={false}
            showNetworkName={false}
            position="right"
            isChainDataLoading={chainDataLoading}
          />
        )}
      </Flex>

      <ReportTokenDataModal
        currency={currency}
        isMarkedSpam={metadata.isSpam}
        shouldReportMultichainAsset={isMultiChainAsset && selectedChainId === undefined}
        onReportSuccess={onReportSuccess}
        isOpen={isReportDataIssueModalOpen}
        onClose={closeReportDataIssueModal}
      />
    </Flex>
  )
}

// Extracted from TokenDetailsHeader to keep the parent function within the cyclomatic-complexity budget (oxlint cap: 30).
// Renders only when the wallet IS allowlisted for a permissioned token; the lock icon +
// "Verified with {{issuer}}" tooltip signal verified status, not blocked. (The pre-verify
// CTA is the warning surface; this badge is the post-verify reward.)
function PermissionedHeaderLock({
  isCompact,
  mediaMd,
  currency,
}: {
  isCompact: boolean
  mediaMd: boolean
  currency: { chainId: number; isNative: boolean; address?: string }
}) {
  const { t } = useTranslation()
  const tokenAddress = currency.isNative ? undefined : currency.address
  const { isVerified, issuer } = useTDPPermissionedState({ tokenAddress, chainId: currency.chainId })
  if (isCompact || mediaMd || !isVerified) {
    return null
  }
  return (
    <PermissionedTokenTooltip
      baseText={t('permissionedPool.tooltip.lockIcon')}
      verifiedSuffix={issuer ? t('permissionedPool.tooltip.lockIcon.verifiedSuffix', { issuer }) : undefined}
      trigger={
        // Match the height of the adjacent `subheading1` ticker so the 16px lock
        // centers on the ticker's midline. Parent row aligns to flex-end, so without
        // this the icon's bottom hugs the ticker baseline and reads visually too low.
        <Flex height={24} alignItems="center" justifyContent="center">
          <Lock size="$icon.16" color="$neutral2" />
        </Flex>
      }
    />
  )
}
