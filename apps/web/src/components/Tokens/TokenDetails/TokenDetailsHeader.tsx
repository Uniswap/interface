import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { EtherscanLogo } from 'components/Icons/Etherscan'
import { ExplorerIcon } from 'components/Icons/ExplorerIcon'
import { Globe } from 'components/Icons/Globe'
import { Share as ShareIcon } from 'components/Icons/Share'
import { TwitterXLogo } from 'components/Icons/TwitterX'
import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { MoreButton } from 'components/Tokens/TokenDetails/MoreButton'
import ShareButton, { openShareTweetWindow } from 'components/Tokens/TokenDetails/ShareButton'
import { ActionButtonStyle } from 'components/Tokens/TokenDetails/shared'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useMemo, useState } from 'react'
import { Link } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TextProps, TouchableArea, useMedia, useSporeColors, WebBottomSheet } from 'ui/src'
import { ChartBarCrossed } from 'ui/src/components/icons/ChartBarCrossed'
import { Check } from 'ui/src/components/icons/Check'
import { Flag } from 'ui/src/components/icons/Flag'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type HeaderAction = {
  title: string
  textColor?: TextProps['color']
  icon: React.ReactNode
  onPress: () => void
  show: boolean
}

type HeaderActionSection = {
  title: string
  actions: HeaderAction[]
}

export const TokenDetailsHeader = () => {
  const { address, currency, tokenQuery } = useTDPContext()

  const { t } = useTranslation()
  const colors = useSporeColors()
  const media = useMedia()
  const isMobileScreen = media.sm

  const isDataReportingEnabled = useFeatureFlag(FeatureFlags.DataReportingAbilities)
  const { openModal } = useModalState(ModalName.ReportTokenIssue)
  const [, setModalProps] = useAtom(ReportTokenIssueModalPropsAtom)
  const openReportTokenModal = useEvent(() => {
    setModalProps({ source: 'token-details', currency, isMarkedSpam: tokenQuery.data?.token?.project?.isSpam })
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

  const [mobileSheetOpen, toggleMobileSheet] = useState(false)

  const tokenSymbolName = currency.symbol ?? t('tdp.symbolNotFound')

  const explorerUrl = getExplorerLink({
    chainId: currency.chainId,
    data: address,
    type: currency.isNative ? ExplorerDataType.NATIVE : ExplorerDataType.TOKEN,
  })

  const { homepageUrl, twitterName } = tokenQuery.data?.token?.project ?? {}
  const twitterUrl = twitterName && `https://x.com/${twitterName}`

  const [searchParams] = useSearchParams()
  const utmTag = `${searchParams.size > 0 ? '&' : '?'}utm_source=share-tdp&utm_medium=${isMobileScreen ? 'mobile' : 'web'}`
  const currentLocation = window.location.href + utmTag

  const twitterShareName =
    currency.name && currency.symbol ? `${currency.name} (${currency.symbol})` : currency.name || currency.symbol || ''

  const [isCopied, setCopied] = useCopyClipboard()

  const desktopHeaderActions: HeaderAction[] = useMemo(() => {
    return [
      {
        title: t('common.explorer'),
        icon:
          currency.chainId === UniverseChainId.Mainnet ? (
            <EtherscanLogo width="18px" height="18px" fill={colors.neutral1.val} />
          ) : (
            <ExplorerIcon width="18px" height="18px" fill={colors.neutral1.val} />
          ),
        onPress: () => window.open(explorerUrl, '_blank'),
        show: !!explorerUrl,
      },
      {
        title: t('common.website'),
        icon: <Globe width="18px" height="18px" fill={colors.neutral1.val} />,
        onPress: () => window.open(homepageUrl, '_blank'),
        show: !!homepageUrl,
      },
      {
        title: t('common.twitter'),
        icon: <TwitterXLogo width="18px" height="18px" fill={colors.neutral1.val} />,
        onPress: () => window.open(twitterUrl, '_blank'),
        show: !!twitterUrl,
      },
    ]
  }, [t, explorerUrl, colors.neutral1.val, currency.chainId, homepageUrl, twitterUrl])

  const mobileHeaderActionSections: HeaderActionSection[] = useMemo(() => {
    return [
      {
        title: t('common.details'),
        actions: desktopHeaderActions,
      },
      {
        title: t('common.share'),
        actions: [
          {
            title: isCopied ? t('common.copied') : t('common.copyLink.button'),
            icon: isCopied ? (
              <Check size={16} p={1} color={colors.statusSuccess.val} />
            ) : (
              <Link size={18} color={colors.neutral1.val} />
            ),
            onPress: () => setCopied(currentLocation),
            show: true,
          },
          {
            title: t('common.share.shareToTwitter'),
            icon: <ShareIcon fill={colors.neutral1.val} width={18} height={18} />,
            onPress: () => openShareTweetWindow(twitterShareName),
            show: true,
          },
        ],
      },
      ...(isDataReportingEnabled
        ? [
            {
              title: t('common.report'),
              actions: [
                {
                  title: t('reporting.token.data.title'),
                  icon: <ChartBarCrossed size="$icon.18" color="$neutral1" />,
                  onPress: openReportDataIssueModal,
                  show: true,
                },
                {
                  title: t('reporting.token.report.title'),
                  textColor: '$statusCritical',
                  icon: <Flag size="$icon.18" color="$statusCritical" />,
                  onPress: openReportTokenModal,
                  show: !currency.isNative,
                },
              ],
            },
          ]
        : []),
    ]
  }, [
    t,
    colors.neutral1.val,
    colors.statusSuccess.val,
    currentLocation,
    isCopied,
    setCopied,
    openReportTokenModal,
    openReportDataIssueModal,
    desktopHeaderActions,
    currency.isNative,
    isDataReportingEnabled,
    twitterShareName,
  ])

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      mb="$spacing20"
      $sm={{ mb: '$spacing8', alignItems: 'flex-start' }}
      animation="quick"
      data-testid="token-info-container"
    >
      <Flex row alignItems="center" $sm={{ alignItems: 'flex-start', flexDirection: 'column' }} gap="$gap12">
        <PortfolioLogo currencies={[currency]} chainId={currency.chainId} size={32} />
        <Flex row gap="$gap8" alignItems="center">
          <Text variant="heading3" minWidth={40} {...EllipsisTamaguiStyle}>
            {currency.name ?? t('tdp.nameNotFound')}
          </Text>
          <Text variant="heading3" textTransform="uppercase" color="$neutral2" $sm={{ display: 'none' }}>
            {tokenSymbolName}
          </Text>
        </Flex>
      </Flex>
      {isMobileScreen ? (
        <MobileTokenActions
          mobileSheetOpen={mobileSheetOpen}
          toggleMobileSheet={toggleMobileSheet}
          actionSections={mobileHeaderActionSections}
        />
      ) : (
        <DesktopTokenActions
          HeaderActions={desktopHeaderActions}
          twitterShareName={twitterShareName}
          openReportTokenModal={openReportTokenModal}
          openReportDataIssueModal={openReportDataIssueModal}
        />
      )}
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

interface MobileTokenActionsProps {
  mobileSheetOpen: boolean
  toggleMobileSheet: (open: boolean) => void
  actionSections: HeaderActionSection[]
}

function MobileTokenActions({ mobileSheetOpen, toggleMobileSheet, actionSections }: MobileTokenActionsProps) {
  return (
    <Flex>
      <TouchableArea height={40} onPress={() => toggleMobileSheet(true)}>
        <MoreHorizontal size="$icon.20" color="$neutral2" />
      </TouchableArea>
      <WebBottomSheet isOpen={mobileSheetOpen} onClose={() => toggleMobileSheet(false)}>
        <Flex gap="$spacing24" mx="$spacing24" mb="$spacing24">
          {actionSections.map((section) => {
            const items = section.actions.map(
              (action) =>
                action.show && (
                  <Flex
                    row
                    key={action.title}
                    width="100%"
                    gap="$spacing12"
                    alignItems="center"
                    hoverStyle={{ backgroundColor: '$surface3' }}
                    cursor="pointer"
                    borderRadius="$rounded8"
                    onPress={() => {
                      toggleMobileSheet(false)
                      action.onPress()
                    }}
                  >
                    {action.icon}
                    <Text variant="body2" color={action.textColor || '$neutral1'}>
                      {action.title}
                    </Text>
                  </Flex>
                ),
            )

            return (
              <Flex key={section.title} gap="$spacing12">
                <Text variant="body3" color="$neutral2">
                  {section.title}
                </Text>
                <Flex gap="$spacing12">{items}</Flex>
              </Flex>
            )
          })}
        </Flex>
      </WebBottomSheet>
    </Flex>
  )
}

interface DesktopTokenActionsProps {
  HeaderActions: HeaderAction[]
  twitterShareName: string
  openReportTokenModal: () => void
  openReportDataIssueModal: () => void
}

function DesktopTokenActions({
  HeaderActions,
  twitterShareName,
  openReportTokenModal,
  openReportDataIssueModal,
}: DesktopTokenActionsProps) {
  const isDataReportingEnabled = useFeatureFlag(FeatureFlags.DataReportingAbilities)
  return (
    <Flex row gap="$gap8" alignItems="center">
      {HeaderActions.map(
        (action) =>
          action.show && (
            <MouseoverTooltip key={action.title} text={action.title} placement="top" size={TooltipSize.Max}>
              <Text onPress={action.onPress} {...ActionButtonStyle} color={action.textColor || '$neutral1'}>
                {action.icon}
              </Text>
            </MouseoverTooltip>
          ),
      )}
      <ShareButton name={twitterShareName} utmSource="share-tdp" />
      {isDataReportingEnabled && (
        <MoreButton openReportTokenModal={openReportTokenModal} openReportDataIssueModal={openReportDataIssueModal} />
      )}
    </Flex>
  )
}
