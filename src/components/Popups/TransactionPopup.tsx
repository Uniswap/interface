import { useWeb3React } from '@web3-react/core'
import { AlertCircle, CheckCircle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { useTransaction } from '../../state/transactions/hooks'
import { ThemedText } from '../../theme'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function TransactionPopup({ hash }: { hash: string }) {
  const { chainId } = useWeb3React()

  const tx = useTransaction(hash)
  const theme = useTheme()

  if (!tx) return null
  const success = Boolean(tx.receipt && tx.receipt.status === 1)

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {success ? (
          <CheckCircle color={theme.deprecated_green1} size={24} />
        ) : (
          <AlertCircle color={theme.deprecated_red1} size={24} />
        )}
      </div>
      <AutoColumn gap="8px">
        <ThemedText.DeprecatedBody fontWeight={500}>
          <TransactionSummary info={tx.info} />
        </ThemedText.DeprecatedBody>
        {chainId && (
          <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
            View on Explorer
          </ExternalLink>
        )}
      </AutoColumn>
    </RowNoFlex>
  )
}
