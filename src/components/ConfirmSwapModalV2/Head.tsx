import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Row, { RowFixed } from 'components/Row'
import { ConfirmModalState } from 'components/swap/ConfirmSwapModal'
import { FadePresence } from 'components/swap/PendingModalContent/Logos'
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
    <FadePresence>
      <StyledL2Badge>
        <RowFixed data-testid="confirmation-modal-chain-icon" gap="sm">
          <ChainLogo chainId={chainId} size={16} />
          <ThemedText.SubHeaderSmall>{info.label}</ThemedText.SubHeaderSmall>
        </RowFixed>
      </StyledL2Badge>
    </FadePresence>
  )
}

const CloseIcon = styled(X)<{ onClick: () => void }>`
  color: ${({ theme }) => theme.neutral1};
  cursor: pointer;
  ${ClickableStyle}
`
export default function Head({
  confirmModalState,
  onDismiss,
}: {
  confirmModalState: ConfirmModalState
  onDismiss: () => void
}) {
  return (
    <Row width="100%" minHeight="40px" align="flex-start">
      <Row justify="left">
        <L2Badge confirmModalState={confirmModalState} />
      </Row>
      <Row justify="center">
        {confirmModalState === ConfirmModalState.REVIEWING && (
          <FadePresence>
            <ThemedText.SubHeader textAlign="center">
              <Trans>Review swap</Trans>
            </ThemedText.SubHeader>
          </FadePresence>
        )}
      </Row>
      <Row justify="right">
        <CloseIcon onClick={onDismiss} data-testid="confirmation-close-icon" />
      </Row>
    </Row>
  )
}
