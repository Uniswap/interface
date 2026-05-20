import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
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
import { TokenDetailsNetworkFilter } from '~/pages/TokenDetails/components/header/TokenDetailsNetworkFilter'
import { useTokenDetailsHeaderActions } from '~/pages/TokenDetails/components/header/useTokenDetailsHeaderActions'
import { useTDPSelectedMultichainChain } from '~/pages/TokenDetails/context/useTDPSelectedMultichainChain'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { CopyHelper } from '~/theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

interface TokenDetailsHeaderProps {
  isCompact: boolean
}

function getShowAddressCopy({
  multichainTokenUxEnabled,
  isNative,
  isMultiChainAsset,
  selectedChainId,
}: {
  multichainTokenUxEnabled: boolean
  isNative: boolean
  isMultiChainAsset: boolean
  selectedChainId: UniverseChainId | undefined
}): boolean {
  if (!multichainTokenUxEnabled || !isMultiChainAsset) {
    return !isNative
  }
  return !!selectedChainId && !isNative
}

export function TokenDetailsHeader({ isCompact }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const trace = useTrace()
  const isMobileScreen = media.md
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  const { currency, tokenQuery, multiChainMap } = useTDPStore((s) => ({
    currency: s.currency!,
    tokenQuery: s.tokenQuery,
    multiChainMap: s.multiChainMap,
  }))
  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const multichainChainIds = useMemo(() => multichainEntries.map((entry) => entry.chainId), [multichainEntries])

  const { selectedMultichainChainId: selectedChainId, setSelectedMultichainChainId: onSelectedChainChange } =
    useTDPSelectedMultichainChain()

  const effectiveCurrency = useTDPEffectiveCurrency()

  const displayAddress = effectiveCurrency.isNative ? NATIVE_CHAIN_ID : effectiveCurrency.address
  const isNative = effectiveCurrency.isNative
  const tokenLogoUrl = tokenQuery.data?.token?.project?.logoUrl
  const tokenLogoSize = getHeaderLogoSize({ isCompact, media })

  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)
  const openReportTokenModal = useEvent(() => {
    setModalProps({
      source: 'token-details',
      currency,
      isMarkedSpam: tokenQuery.data?.token?.project?.isSpam,
      isMultichainAsset: multichainTokenUxEnabled && isMultiChainAsset,
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
    project: tokenQuery.data?.token?.project,
    openReportTokenModal,
    openReportDataIssueModal,
    isMobileScreen,
  })

  const tokenSymbol = tokenQuery.data?.token?.symbol ?? effectiveCurrency.symbol ?? t('tdp.symbolNotFound')
  const tokenName = tokenQuery.data?.token?.name ?? effectiveCurrency.name ?? t('tdp.nameNotFound')
  const showAddressCopy = getShowAddressCopy({ multichainTokenUxEnabled, isNative, isMultiChainAsset, selectedChainId })

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
          chainId={!multichainTokenUxEnabled ? effectiveCurrency.chainId : null}
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
          </Flex>
          {!media.sm && (
            <Flex row alignItems="stretch" gap="$spacing6">
              <TokenDetailsNetworkFilter
                chainIds={multichainChainIds}
                selectedChainId={selectedChainId}
                setSelectedChainId={onSelectedChainChange}
                showAddressCopy={showAddressCopy}
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
          />
        )}
      </Flex>

      <ReportTokenDataModal
        currency={currency}
        isMarkedSpam={tokenQuery.data?.token?.project?.isSpam}
        onReportSuccess={onReportSuccess}
        isOpen={isReportDataIssueModalOpen}
        onClose={closeReportDataIssueModal}
      />
    </Flex>
  )
}
