import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { parseLocalActivity } from 'components/WalletDropdown/MiniPortfolio/Activity/parseLocal'
import { PortfolioLogo } from 'components/WalletDropdown/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/WalletDropdown/MiniPortfolio/PortfolioRow'
import useENSName from 'hooks/useENSName'
import { useCombinedActiveList } from 'state/lists/hooks'
import { useTransaction } from 'state/transactions/hooks'
import { TransactionDetails, TransactionInfo, TransactionType } from 'state/transactions/types'
import styled, { useTheme } from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PopupAlertTriangle } from './FailedNetworkSwitchPopup'
import { ReduceLeverageTransactionPopupContent } from 'components/TransactionConfirmationModal'
import { X } from 'react-feather'

export const Descriptor = styled(ThemedText.BodySmall)`
  ${EllipsisStyle}
`

const Wrapper = styled.div``

function TransactionPopupContent({ tx, chainId }: { tx: TransactionDetails; chainId: number }) {
  const success = tx.receipt?.status === 1
  const tokens = useCombinedActiveList()
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
      title={<ThemedText.SubHeader fontWeight={500}>{activity.title}</ThemedText.SubHeader>}
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

const StyledClose = styled(X)`
  position: absolute;
  right: 20px;
  top: 20px;

  :hover {
    cursor: pointer;
  }
`
const Popup = styled.div`
  display: inline-block;
  width: 100%;
  padding: 1em;
  background-color: ${({ theme }) => theme.backgroundSurface};
  position: relative;
  border-radius: 16px;
  padding: 20px;
  padding-right: 35px;
  overflow: hidden;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    min-width: 290px;
    &:not(:last-of-type) {
      margin-right: 20px;
    }
  `}
`

export default function TransactionPopup({ hash, removeThisPopup }: { hash: string, removeThisPopup: () => void }) {
  const { chainId } = useWeb3React()

  const tx = useTransaction(hash)

  if (!chainId || !tx) return null

  const theme = useTheme()

  switch(tx.info.type) {
    case TransactionType.REDUCE_LEVERAGE:
      return <ReduceLeverageTransactionPopupContent tx={tx} chainId={chainId} removeThisPopup={removeThisPopup}/>
    default:
      return (
        <Popup>
          <StyledClose color={theme.textSecondary} onClick={removeThisPopup} />
          <TransactionPopupContent tx={tx} chainId={chainId} />
        </Popup>
      )
      
  }
  
}
