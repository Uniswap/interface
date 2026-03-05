import { useAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { ReportTokenDataModal } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { HEADER_TRANSITION } from '~/components/Explore/stickyHeader/constants'
import { getHeaderLogoSize, getHeaderTitleVariant } from '~/components/Explore/stickyHeader/getHeaderLogoSize'
import { DesktopHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/DesktopHeaderActions'
import { MobileHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/MobileHeaderActions'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { useModalState } from '~/hooks/useModalState'
import { useTokenDetailsHeaderActions } from '~/pages/TokenDetails/components/header/useTokenDetailsHeaderActions'
import { useTDPContext } from '~/pages/TokenDetails/context/TDPContext'
import { CopyHelper } from '~/theme/components/CopyHelper'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

interface TokenDetailsHeaderProps {
  isCompact: boolean
}

export function TokenDetailsHeader({ isCompact }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobileScreen = media.md

  const { address, currency, tokenQuery } = useTDPContext()
  const isNative = Boolean(currency.isNative)
  const tokenLogoUrl = tokenQuery.data?.token?.project?.logoUrl
  const tokenLogoSize = getHeaderLogoSize({ isCompact, isMobile: media.md })

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

  const { desktopHeaderActions, mobileHeaderActionSections } = useTokenDetailsHeaderActions({
    currency,
    address,
    project: tokenQuery.data?.token?.project,
    openReportTokenModal,
    openReportDataIssueModal,
    isMobileScreen,
  })

  const tokenSymbolName = currency.symbol ?? t('tdp.symbolNotFound')

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
          symbol={currency.symbol ?? undefined}
          name={currency.name ?? undefined}
          chainId={currency.chainId}
          size={tokenLogoSize}
          transition={HEADER_TRANSITION}
        />
        <Flex gap={isCompact ? '$gap4' : '$gap8'} $md={{ gap: '$none' }} transition={HEADER_TRANSITION}>
          <Flex row flex={1} alignItems="flex-end" gap="$gap8" $sm={{ width: '100%' }}>
            <Text
              tag="h1"
              variant={getHeaderTitleVariant({ isCompact, isMobile: media.md })}
              transition={HEADER_TRANSITION}
              {...EllipsisTamaguiStyle}
            >
              {currency.name ?? t('tdp.nameNotFound')}
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
                {tokenSymbolName}
              </Text>
            )}
          </Flex>
          {!isNative && (
            <CopyHelper
              toCopy={address}
              iconPosition="right"
              iconSize={iconSizes.icon16}
              iconColor="$neutral2"
              color="$neutral2"
              dataTestId={TestID.BreadcrumbHoverCopy}
            >
              <Text color="$neutral2">{shortenAddress({ address })}</Text>
            </CopyHelper>
          )}
        </Flex>
      </Flex>
      {isMobileScreen ? (
        <MobileHeaderActions actionSections={mobileHeaderActionSections} />
      ) : (
        <DesktopHeaderActions actions={desktopHeaderActions} />
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
