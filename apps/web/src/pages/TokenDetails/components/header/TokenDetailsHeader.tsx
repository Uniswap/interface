import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, Text, iconSizes } from '@universe/mycelium'
import { Lock } from '@universe/mycelium/icons/Lock'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { PermissionedTokenTooltip } from 'uniswap/src/features/permissionedTokens/PermissionedTokenTooltip'
import { getRWAHeaderIdentity } from 'uniswap/src/features/rwa/getRWAHeaderIdentity'
import { useRwaIssuer } from 'uniswap/src/features/rwa/hooks/useRwaIssuer'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { DetailsHeaderSubtitleMobile } from '~/components/StickyCollapsibleHeader/DetailsHeaderSubtitleMobile'
import { DetailsHeaderTitle, useMetadataRowHidden } from '~/components/StickyCollapsibleHeader/DetailsHeaderTitle'
import { DesktopHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/DesktopHeaderActions'
import { MobileHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/MobileHeaderActions'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useModalState } from '~/hooks/useModalState'
import { RWAIssuerHeaderDetails } from '~/pages/TokenDetails/components/header/RWAIssuerHeaderDetails'
import { TokenDetailsHeaderAddressCopyMobile } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderAddressCopyMobile'
import { TokenDetailsHeaderCategoryChips } from '~/pages/TokenDetails/components/header/TokenDetailsHeaderCategoryChips'
import { TokenDetailsNetworkFilter } from '~/pages/TokenDetails/components/header/TokenDetailsNetworkFilter'
import { useTokenDetailsHeaderActions } from '~/pages/TokenDetails/components/header/useTokenDetailsHeaderActions'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPPermissionedState } from '~/pages/TokenDetails/hooks/useTDPPermissionedState'
import { useIsTDPRWAMatchLoading, useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

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
  // Complement of DetailsHeaderTitle's own metadata-row gate, so the row and the compact filter
  // below can never both mount or both vanish.
  const metadataRowHidden = useMetadataRowHidden()

  const { currency, multiChainMap, chainDataLoading } = useTDPStore((s) => ({
    currency: s.currency!,
    multiChainMap: s.multiChainMap,
    chainDataLoading: s.chainDataLoading,
  }))
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const multichainChainIds = useMemo(() => multichainEntries.map((entry) => entry.chainId), [multichainEntries])

  const { selectedMultichainChainId: selectedChainId, setSelectedMultichainChainId: onSelectedChainChange } =
    useTDPSelectedMultichainChain()

  const effectiveCurrency = useTDPEffectiveCurrency()
  const rwaMatch = useTDPRWAMatch()
  // Only the group match can change the name, so the title holds on that alone rather than paint the
  // plain token name and flip. The issuer line fills in when GetToken lands.
  const isRwaMatchLoading = useIsTDPRWAMatchLoading()
  const { issuer: rwaIssuer } = useRwaIssuer({ rwaMatch, currencyId: currencyId(effectiveCurrency) })
  const heldRwaIssuer = isRwaMatchLoading ? undefined : rwaIssuer
  const plainTokenNames = useIsTokenCategoriesEnabled()

  const metadata = useTokenMetadata(currencyId(effectiveCurrency))

  const displayAddress = effectiveCurrency.isNative ? NATIVE_CHAIN_ID : effectiveCurrency.address
  const isNative = effectiveCurrency.isNative

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
  const { name: tokenName, logoUrl: tokenLogoUrl } = getRWAHeaderIdentity({
    rwaMatch,
    fallbackName: fallbackTokenName,
    logoUrl: metadata.logoUrl,
    plainTokenNames,
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
    <Flex width="100%" gap="$gap16" $sm={{ gap: '$gap12' }}>
      <DetailsHeaderTitle
        name={tokenName}
        symbol={tokenSymbol}
        isCompact={isCompact}
        isLoading={isRwaMatchLoading}
        logoUrl={tokenLogoUrl}
        logoSymbol={effectiveCurrency.symbol ?? undefined}
        logoName={effectiveCurrency.name ?? undefined}
        chainId={!isMultiChainAsset ? effectiveCurrency.chainId : null}
        dataTestId={TestID.TokenDetailsInfoContainer}
        titleAdornments={
          <>
            <TokenDetailsHeaderAddressCopyMobile
              displayAddress={displayAddress}
              isNative={isNative}
              chainId={effectiveCurrency.chainId}
              isMultiChainAsset={isMultiChainAsset}
              selectedChainId={selectedChainId}
              multichainEntries={multichainEntries}
            />
            <PermissionedHeaderLock isCompact={isCompact} mediaMd={media.md} currency={effectiveCurrency} />
          </>
        }
        mobileSubtitle={
          <DetailsHeaderSubtitleMobile issuer={heldRwaIssuer} symbol={tokenSymbol} isCompact={isCompact} />
        }
        metadataRow={
          <Flex row alignItems="center" gap="$spacing6">
            <RWAIssuerHeaderDetails issuer={heldRwaIssuer} />
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
        }
        actions={
          <>
            {isMobileScreen ? (
              <MobileHeaderActions actionSections={mobileHeaderActionSections} />
            ) : (
              <DesktopHeaderActions actions={desktopHeaderActions} />
            )}
            {metadataRowHidden && (
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
          </>
        }
      >
        <ReportTokenDataModal
          currency={currency}
          isMarkedSpam={metadata.isSpam}
          shouldReportMultichainAsset={isMultiChainAsset && selectedChainId === undefined}
          onReportSuccess={onReportSuccess}
          isOpen={isReportDataIssueModalOpen}
          onClose={closeReportDataIssueModal}
        />
      </DetailsHeaderTitle>
      {!isCompact && <TokenDetailsHeaderCategoryChips />}
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
