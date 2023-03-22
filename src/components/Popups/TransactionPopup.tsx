import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { ActivityRowStyledDescriptor } from 'components/WalletDropdown/MiniPortfolio/Activity'
import { parseLocalActivity } from 'components/WalletDropdown/MiniPortfolio/Activity/parseLocal'
import { PortfolioLogo } from 'components/WalletDropdown/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/WalletDropdown/MiniPortfolio/PortfolioRow'
import useENSName from 'hooks/useENSName'
import { useCombinedActiveList } from 'state/lists/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PopupAlertTriangle } from './FailedNetworkSwitchPopup'

export default function TransactionPopup({ hash }: { hash: string }) {
  const { chainId } = useWeb3React()

  const tx = useTransaction(hash)
  const tokens = useCombinedActiveList()
  const success = Boolean(tx?.receipt && tx?.receipt.status === 1)

  const activity = tx ? parseLocalActivity(tx, chainId ?? 0, tokens) : null
  const { ENSName } = useENSName(activity?.otherAccount)
  const explorerUrl = getExplorerLink(chainId ?? 0, hash, ExplorerDataType.TRANSACTION)

  if (!chainId || !tx || !activity) return null

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
      title={<ThemedText.SubHeader fontWeight={500}>{activity.title}</ThemedText.SubHeader>}
      descriptor={
        <ActivityRowStyledDescriptor color="textSecondary">
          {activity.descriptor}
          {ENSName ?? activity.otherAccount}
        </ActivityRowStyledDescriptor>
      }
      onClick={() => window.open(explorerUrl, '_blank')}
      right={undefined}
    />
  )
}
