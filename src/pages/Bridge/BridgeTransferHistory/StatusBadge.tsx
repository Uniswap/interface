import { rgba } from 'polished'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { CheckCircle, TransferIcon, XCircle } from 'components/Icons'
import { MultichainTransferStatus } from 'hooks/bridge/useGetBridgeTransfers'

import { getLabelByStatus } from '../utils'

const cssByStatus: Record<MultichainTransferStatus, any> = {
  [MultichainTransferStatus.Success]: css`
    background: ${({ theme }) => rgba(theme.primary, 0.2)};
    color: ${({ theme }) => theme.primary};
  `,
  [MultichainTransferStatus.Failure]: css`
    background: ${({ theme }) => rgba(theme.red, 0.2)};
    color: ${({ theme }) => theme.red};
  `,
  [MultichainTransferStatus.Processing]: css`
    background: ${({ theme }) => rgba(theme.warning, 0.2)};
    color: ${({ theme }) => theme.warning};
  `,
}

const Wrapper = styled.div<{ status: MultichainTransferStatus; iconOnly: boolean }>`
  width: 100%;
  padding: 4px 8px;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  border-radius: 24px;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;

  overflow: hidden;

  ${({ status }) => cssByStatus[status]}
  ${({ iconOnly }) =>
    iconOnly &&
    css`
      padding: 0;
      width: 20px;
      height: 20px;
    `}
`

type Props = {
  status: MultichainTransferStatus
  iconOnly?: boolean
}
const StatusBadge: React.FC<Props> = ({ status, iconOnly }) => {
  const label = getLabelByStatus(status)

  const renderIcon = () => {
    if (status === MultichainTransferStatus.Success) {
      return <CheckCircle size="12px" />
    }

    if (status === MultichainTransferStatus.Failure) {
      return <XCircle size="12px" />
    }

    if (status === MultichainTransferStatus.Processing) {
      return <TransferIcon width="12px" height="12px" />
    }

    return null
  }

  return (
    <Wrapper iconOnly={!!iconOnly} status={status}>
      {renderIcon()}
      {!iconOnly && (
        <Text
          as="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </Text>
      )}
    </Wrapper>
  )
}

export default StatusBadge
