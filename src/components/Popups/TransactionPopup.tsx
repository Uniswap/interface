import { useWeb3React } from '@web3-react/core'
import { parseLocalActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Column from 'components/Column'
import { useAllTokensMultichain } from 'hooks/Tokens'
import useENSName from 'hooks/useENSName'
import { useTransaction } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/types'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PopupAlertTriangle } from './FailedNetworkSwitchPopup'

const Descriptor = styled(ThemedText.BodySmall)`
  ${EllipsisStyle}
`

function TransactionPopupContent({ tx, chainId }: { tx: TransactionDetails; chainId: number }) {
  const success = tx.receipt?.status === 1
  const tokens = useAllTokensMultichain()
  const activity = parseLocalActivity(tx, chainId, tokens)
  const { ENSName } = useENSName(activity?.otherAccount)

  if (!activity) return null

  const explorerUrl = getExplorerLink(chainId, tx.hash, ExplorerDataType.TRANSACTION)

  return (
    <PortfolioRow
      left={
        success ? (
          <Column>
            <PortfolioLogo
              chainId={chainId}
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
        <Descriptor color="textSecondary">
          {activity.descriptor}
          {ENSName ?? activity.otherAccount}
        </Descriptor>
      }
      onClick={() => window.open(explorerUrl, '_blank')}
    />
  )
}

export default function TransactionPopup({ hash }: { hash: string }) {
  const { chainId } = useWeb3React()

  const tx = useTransaction(hash)

  if (!chainId || !tx) return null

  return <TransactionPopupContent tx={tx} chainId={chainId} />
}
