import Circle from 'assets/images/blue-loader.svg'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { RowBetween } from 'components/Row'
import { useAccount } from 'hooks/useAccount'
import styled, { useTheme } from 'lib/styled-components'
import { ArrowUpCircle, CheckCircle } from 'react-feather'
import { CloseIcon, CustomLightSpinner, ExternalLink, ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export function LoadingView({ children, onDismiss }: { children: any; onDismiss: () => void }) {
  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        <CustomLightSpinner src={Circle} alt="loader" size="90px" />
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify="center">
        {children}
        <ThemedText.DeprecatedSubHeader>
          <Trans i18nKey="common.confirmTransaction.button" />
        </ThemedText.DeprecatedSubHeader>
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedView({
  children,
  onDismiss,
  transactionSuccess,
  hash,
}: {
  children: any
  onDismiss: () => void
  transactionSuccess: boolean
  hash?: string
}) {
  const theme = useTheme()
  const { chainId } = useAccount()

  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <ConfirmedIcon>
        {!transactionSuccess ? (
          <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.accent1} />
        ) : (
          <CheckCircle strokeWidth={0.5} size={90} color={theme.success} />
        )}
      </ConfirmedIcon>
      <AutoColumn gap="100px" justify="center">
        {children}
        {chainId && hash && (
          <ExternalLink
            href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
            style={{ marginLeft: '4px' }}
          >
            <ThemedText.DeprecatedSubHeader>
              <Trans i18nKey="common.viewTransactionExplorer.link" />
            </ThemedText.DeprecatedSubHeader>
          </ExternalLink>
        )}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}
