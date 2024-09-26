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
import Column, { AutoColumn } from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { SupportedInterfaceChainId, useIsSupportedChainId } from 'constants/chains'
import styled from 'lib/styled-components'
import { X } from 'react-feather'
import { useOrder } from 'state/signatures/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Trans } from 'uniswap/src/i18n'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { useFormatter } from 'utils/formatNumbers'

const StyledClose = styled(X)<{ $padding: number }>`
  position: absolute;
  right: ${({ $padding }) => `${$padding}px`};
  top: ${({ $padding }) => `${$padding}px`};
  color: ${({ theme }) => theme.neutral2};

  :hover {
    cursor: pointer;
  }
`
const PopupContainer = styled.div<{ padded?: boolean }>`
  display: inline-block;
  width: 100%;
  background-color: ${({ theme }) => theme.surface1};
  position: relative;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  transition: ${({ theme }) => `visibility ${theme.transition.duration.fast} ease-in-out`};

  padding: ${({ padded }) => (padded ? '20px 35px 20px 20px' : '2px 0px')};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
  min-width: 290px;
  &:not(:last-of-type) {
    margin-right: 20px;
  }
`}
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

export function FailedNetworkSwitchPopup({ chainId, onClose }: { chainId: InterfaceChainId; onClose: () => void }) {
  const isSupportedChain = useIsSupportedChainId(chainId)
  const chainInfo = isSupportedChain ? UNIVERSE_CHAIN_INFO[chainId] : undefined

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

  return (
    <PopupContainer>
      <StyledClose $padding={16} onClick={onClose} />
      <PortfolioRow
        left={
          success || !!activity.offchainOrderDetails ? (
            <Column>
              <PortfolioLogo
                chainId={activity.chainId}
                currencies={activity.currencies}
                images={activity.logos}
                accountAddress={activity.otherAccount}
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
    </PopupContainer>
  )
}

export function TransactionPopupContent({
  chainId,
  hash,
  onClose,
}: {
  chainId: SupportedInterfaceChainId
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

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
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
