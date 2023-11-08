import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Row, { RowFixed } from 'components/Row'
import { ConfirmModalState } from 'components/swap/ConfirmSwapModal'
import { getChainInfo } from 'constants/chainInfo'
import { X } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { isL2ChainId } from 'utils/chains'

const StyledL2Badge = styled(Badge)`
  padding: 6px 8px;
`
function L2Badge({ confirmModalState }: { confirmModalState: ConfirmModalState }) {
  const { chainId } = useWeb3React()
  if (!isL2ChainId(chainId) || confirmModalState === ConfirmModalState.REVIEWING) {
    return null
  }
  const info = getChainInfo(chainId)
  return (
    <StyledL2Badge>
      <RowFixed data-testid="confirmation-modal-chain-icon" gap="sm">
        <ChainLogo chainId={chainId} size={16} />
        <ThemedText.SubHeaderSmall>{info.label}</ThemedText.SubHeaderSmall>
      </RowFixed>
    </StyledL2Badge>
  )
}

const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`
export function Head({
  confirmModalState,
  onDismiss,
}: {
  confirmModalState: ConfirmModalState
  onDismiss: () => void
}) {
  return (
    <Row width="100%" minHeight="50px" align="flex-start">
      <Row justify="left">
        <L2Badge confirmModalState={confirmModalState} />
      </Row>
      <Row justify="center">
        <ThemedText.SubHeader textAlign="center">
          {confirmModalState === ConfirmModalState.REVIEWING ? <Trans>Review swap</Trans> : undefined}
        </ThemedText.SubHeader>
      </Row>
      <Row justify="right">
        <CloseIcon onClick={onDismiss} data-testid="confirmation-close-icon" />
      </Row>
    </Row>
  )
}
