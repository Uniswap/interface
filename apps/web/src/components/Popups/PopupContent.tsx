import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { signatureToActivity, transactionToActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Column, { AutoColumn } from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { AutoRow } from 'components/Row'
import { getChainInfo } from 'constants/chainInfo'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { useAllTokensMultichain } from 'hooks/Tokens'
import useENSName from 'hooks/useENSName'
import { X } from 'react-feather'
import { useOrder } from 'state/signatures/hooks'
import { useTransaction } from 'state/transactions/hooks'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

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

export function FailedNetworkSwitchPopup({ chainId, onClose }: { chainId: ChainId; onClose: () => void }) {
  const chainInfo = getChainInfo(chainId)

  return (
    <PopupContainer padded>
      <StyledClose $padding={20} onClick={onClose} />
      <RowNoFlex gap="12px">
        <PopupAlertTriangle />
        <ColumnContainer gap="sm">
          <ThemedText.SubHeader color="neutral2">
            <Trans>Failed to switch networks</Trans>
          </ThemedText.SubHeader>

          <ThemedText.BodySmall color="neutral2">
            <Trans>To use Uniswap on {chainInfo.label}, switch the network in your wallet’s settings.</Trans>
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
  const { ENSName } = useENSName(activity?.otherAccount)

  return (
    <PopupContainer>
      <StyledClose $padding={16} onClick={onClose} />
      <PortfolioRow
        left={
          success ? (
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
        descriptor={
          <Descriptor color="neutral2">
            {activity.descriptor}
            {ENSName ?? activity.otherAccount}
          </Descriptor>
        }
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
  chainId: ChainId
  hash: string
  onClose: () => void
}) {
  const transaction = useTransaction(hash)
  const tokens = useAllTokensMultichain()
  const { formatNumber } = useFormatter()
  if (!transaction) return null

  const activity = transactionToActivity(transaction, chainId, tokens, formatNumber)

  if (!activity) return null

  const onClick = () =>
    window.open(getExplorerLink(activity.chainId, activity.hash, ExplorerDataType.TRANSACTION), '_blank')

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}

export function UniswapXOrderPopupContent({ orderHash, onClose }: { orderHash: string; onClose: () => void }) {
  const order = useOrder(orderHash)
  const tokens = useAllTokensMultichain()
  const openOffchainActivityModal = useOpenOffchainActivityModal()
  const { formatNumber } = useFormatter()
  if (!order) return null

  const activity = signatureToActivity(order, tokens, formatNumber)

  if (!activity) return null

  const onClick = () =>
    openOffchainActivityModal(order, { inputLogo: activity?.logos?.[0], outputLogo: activity?.logos?.[1] })

  return <ActivityPopupContent activity={activity} onClose={onClose} onClick={onClick} />
}
