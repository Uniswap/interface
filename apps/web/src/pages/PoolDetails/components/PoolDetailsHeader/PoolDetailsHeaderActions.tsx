import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi, parseRestProtocolVersion } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { ReportPoolDataModal } from 'uniswap/src/components/reporting/ReportPoolDataModal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { DesktopHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/DesktopHeaderActions'
import { MobileHeaderActions } from '~/components/Explore/stickyHeader/HeaderActions/MobileHeaderActions'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { usePoolDetailsHeaderActions } from '~/pages/PoolDetails/components/PoolDetailsHeader/usePoolDetailsHeaderActions'

export function PoolDetailsHeaderActions({
  chainId,
  poolAddress,
  poolName,
  token0,
  token1,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  poolAddress?: string
  poolName: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  protocolVersion?: GraphQLApi.ProtocolVersion
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobileScreen = media.md

  const currency0 = token0 && gqlToCurrency(token0)
  const currency1 = token1 && gqlToCurrency(token1)

  const {
    value: reportDataIssueModalIsOpen,
    setTrue: openReportDataIssueModal,
    setFalse: closeReportDataIssueModal,
  } = useBooleanState(false)

  const onReportDataSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-data-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const { desktopHeaderActions, mobileHeaderActionSections } = usePoolDetailsHeaderActions({
    chainId,
    poolAddress,
    poolName,
    token0,
    token1,
    protocolVersion,
    openReportDataIssueModal,
    isMobileScreen,
  })

  return (
    <Flex row width="max-content" alignItems="center" gap="$gap8">
      {isMobileScreen ? (
        <MobileHeaderActions actionSections={mobileHeaderActionSections} />
      ) : (
        <DesktopHeaderActions actions={desktopHeaderActions} />
      )}
      {poolAddress && chainId && currency0 && currency1 && protocolVersion && (
        <ReportPoolDataModal
          poolInfo={{
            poolId: poolAddress,
            chainId,
            version: parseRestProtocolVersion(protocolVersion) ?? ProtocolVersion.UNSPECIFIED,
            token0: currency0,
            token1: currency1,
          }}
          onReportSuccess={onReportDataSuccess}
          isOpen={reportDataIssueModalIsOpen}
          onClose={closeReportDataIssueModal}
        />
      )}
    </Flex>
  )
}
