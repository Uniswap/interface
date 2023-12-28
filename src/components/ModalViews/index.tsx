import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ArrowUpCircle } from 'react-feather'
import styled, { useTheme } from 'styled-components'

import Circle from '../../assets/images/blue-loader.svg'
import { AnimatedEntranceConfirmationIcon } from '../../components/swap/PendingModalContent/Logos'
import { CloseIcon, CustomLightSpinner, ThemedText } from '../../theme'
import { ExternalLink } from '../../theme/components'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { AutoColumn, ColumnCenter } from '../Column'
import { RowBetween } from '../Row'

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
          <Trans>Confirm this transaction in your wallet</Trans>
        </ThemedText.DeprecatedSubHeader>
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}

export function SubmittedView({
  children,
  onDismiss,
  hash,
  transactionSuccess,
}: {
  children: any
  onDismiss: () => void
  hash?: string
  transactionSuccess?: boolean
}) {
  const theme = useTheme()
  const { chainId } = useWeb3React()

  return (
    <ConfirmOrLoadingWrapper>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <>
        {!transactionSuccess ? (
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.accentAction} />
          </ConfirmedIcon>
        ) : (
          <AnimatedEntranceConfirmationIcon />
        )}
      </>
      <AutoColumn gap="100px" justify="center">
        {children}
        {chainId && hash && (
          <ExternalLink
            href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
            style={{ marginLeft: '4px' }}
          >
            <ThemedText.DeprecatedSubHeader>
              <Trans>View transaction on Explorer</Trans>
            </ThemedText.DeprecatedSubHeader>
          </ExternalLink>
        )}
      </AutoColumn>
    </ConfirmOrLoadingWrapper>
  )
}
