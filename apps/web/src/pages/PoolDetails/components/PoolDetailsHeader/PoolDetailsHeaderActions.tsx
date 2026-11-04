import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { ReportPoolDataModal } from 'uniswap/src/components/reporting/ReportPoolDataModal'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DesktopHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/DesktopHeaderActions'
import { MobileHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/MobileHeaderActions'
import { usePoolDetailsHeaderActions } from '~/pages/PoolDetails/components/PoolDetailsHeader/usePoolDetailsHeaderActions'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

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
  token0?: ParsedToken
  token1?: ParsedToken
  protocolVersion?: ProtocolVersion
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const isMobileScreen = media.md

  const currency0 = token0 && v2TokenToCurrency(token0)
  const currency1 = token1 && v2TokenToCurrency(token1)

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
            version: protocolVersion,
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
