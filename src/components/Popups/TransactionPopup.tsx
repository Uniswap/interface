import { useWeb3React } from '@web3-react/core'
import { TransactionSummary } from 'components/AccountDetails/TransactionSummary'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { useContext } from 'react'
import { AlertCircle, CheckCircle } from 'react-feather'
import { useTransaction } from 'state/transactions/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function TransactionPopup({ hash }: { hash: string }) {
  const { chainId } = useWeb3React()

  const tx = useTransaction(hash)
  const theme = useContext(ThemeContext)

  if (!tx) return null
  const success = Boolean(tx.receipt && tx.receipt.status === 1)

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {success ? (
          <CheckCircle color={theme.accentSuccess} size={24} />
        ) : (
          <AlertCircle color={theme.accentFailure} size={24} />
        )}
      </div>
      <AutoColumn gap="8px">
        <ThemedText.BodyPrimary fontWeight={500}>
          <TransactionSummary info={tx.info} />
        </ThemedText.BodyPrimary>
        {chainId && (
          <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
            View on Explorer
          </ExternalLink>
        )}
      </AutoColumn>
    </RowNoFlex>
  )
}
