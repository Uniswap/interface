import { useQuery } from '@tanstack/react-query'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import {
  getSignatureToActivityQueryOptions,
  getTransactionToActivityQueryOptions,
} from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Column, { AutoColumn } from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { useOrder } from 'state/signatures/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { ThemedText } from 'theme/components'
import { EllipsisStyle } from 'theme/components/styles'
import { Flex, useSporeColors } from 'ui/src'
import { BridgeIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useFormatter } from 'utils/formatNumbers'

export const POPUP_MAX_WIDTH = 348

const StyledClose = styled(X)<{ $padding: number }>`
  position: absolute;
  right: ${({ $padding }) => `${$padding}px`};
  top: ${({ $padding }) => `${$padding}px`};
  color: ${({ theme }) => theme.neutral2};

  :hover {
    cursor: pointer;
  }
`

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

const ColumnContainer = styled(AutoColumn)`
  margin: 0 12px;
`

const PopupAlertTriangle = styled(AlertTriangleFilled)`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
`

const PopupContainer = ({ children, padded }: { children: React.ReactNode; padded?: boolean }) => {
  return (
    <Flex
      row
      width={POPUP_MAX_WIDTH}
      backgroundColor="$surface1"
      position="relative"
      borderWidth={1}
      borderRadius="$rounded16"
      borderColor="$surface3"
      p={padded ? '20px 35px 20px 20px' : '2px 0px'}
      animation="300ms"
    >
      {children}
    </Flex>
  )
}

export function FailedNetworkSwitchPopup({ chainId, onClose }: { chainId: UniverseChainId; onClose: () => void }) {
  const isSupportedChain = useIsSupportedChainId(chainId)
  const chainInfo = isSupportedChain ? getChainInfo(chainId) : undefined

  if (!chainInfo) {
    return null
  }

  return (
    <PopupContainer padded>
      <StyledClose $padding={20} onClick={onClose} />
      <RowNoFlex gap="12px">
        <PopupAlertTriangle />
        <ColumnContainer gap="sm">
          <ThemedText.SubHeader color="neutral2">
            <Trans i18nKey="common.failedSwitchNetwork" />
          </ThemedText.SubHeader>

          <ThemedText.BodySmall color="neutral2">
            <Trans i18nKey="settings.switchNetwork.warning" values={{ label: chainInfo.label }} />
          </ThemedText.BodySmall>
        </ColumnContainer>
      </RowNoFlex>
    </PopupContainer>
  )
}

const Descriptor = styled(ThemedText.BodySmall)`
  ${EllipsisStyle}
`

type ActivityPopupContentProps = { activity: Activity; onClick: () => void; onClose: () => void }
function ActivityPopupContent({ activity, onClick, onClose }: ActivityPopupContentProps) {
  const success = activity.status === TransactionStatus.Confirmed && !activity.cancelled
  const pending = activity.status === TransactionStatus.Pending

  const showPortfolioLogo = success || pending || !!activity.offchainOrderDetails
  const colors = useSporeColors()

  const isBridgeActivity = activity.outputChainId && activity.chainId && activity.chainId !== activity.outputChainId
  return (
    <PopupContainer>
      <PortfolioRow
        left={
          showPortfolioLogo ? (
            <Column>
              <PortfolioLogo
                chainId={activity.chainId}
                currencies={activity.currencies}
                accountAddress={activity.otherAccount}
                customIcon={isBridgeActivity ? BridgeIcon : undefined}
              />
            </Column>
          ) : (
            <PopupAlertTriangle />
          )
        }
        title={<ThemedText.SubHeader>{activity.title}</ThemedText.SubHeader>}
        descriptor={<Descriptor color="neutral2">{activity.descriptor}</Descriptor>}
        onClick={onClick}
      />
      {pending ? (
        <Flex position="absolute" top={24} right={16}>
          <LoaderV3 color={colors.accent1.variable} size="20px" />
        </Flex>
      ) : (
        <StyledClose $padding={16} onClick={onClose} />
      )}
    </PopupContainer>
  )
}

export function TransactionPopupContent({
  chainId,
  hash,
  onClose,
}: {
  chainId: UniverseChainId
  hash: string
  onClose: () => void
}) {
  const transaction = useTransaction(hash)
  const { formatNumber } = useFormatter()
  const { data: activity } = useQuery(getTransactionToActivityQueryOptions(transaction, chainId, formatNumber))

  if (!transaction || !activity) {
    return null
  }

  const onClick = () =>
    window.open(getExplorerLink(activity.chainId, activity.hash, ExplorerDataType.TRANSACTION), '_blank')

  return <ActivityPopupContent activity={activity} onClick={onClick} onClose={onClose} />
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useOrder(orderHash)
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const { formatNumber } = useFormatter()
  const { data: activity } = useQuery(getSignatureToActivityQueryOptions(order, formatNumber))

  if (!activity || !order) {
    return null
  }

  const onClick = () =>
    openOffchainActivityModal(order, { inputLogo: activity?.logos?.[0], outputLogo: activity?.logos?.[1] })

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}
