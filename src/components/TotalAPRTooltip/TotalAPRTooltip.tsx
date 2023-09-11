import { formatNumber } from '@uniswap/conedison/format'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'styled-components/macro'

const InfoContainer = styled.div<{ marginTop?: string; marginBottom?: string }>`
  display: flex;
  width: 100px;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ marginTop }) => marginTop || '0px'};
  margin-bottom: ${({ marginBottom }) => marginBottom || '0px'};
`

const TextSuccess = styled.small`
  color: ${({ theme }) => theme.accentActive};
  font-weight: 600;
`

const TextSecondary = styled.small`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
`

interface TotalAPRToolTipProps {
  poolAPR: number
  farmAPR: number
  children: any
}

export default function TotalAPRTooltip({ poolAPR, farmAPR, children }: TotalAPRToolTipProps) {
  const InfoRow = ({ label, value, isTotal }: { label: string; value: string; isTotal?: boolean }) => (
    <InfoContainer marginTop={isTotal ? '0px' : '16px'}>
      {isTotal ? <TextSuccess>{label}</TextSuccess> : <TextSecondary>{label}</TextSecondary>}
      <small style={{ fontWeight: 600 }}>{value}%</small>
    </InfoContainer>
  )

  return (
    <MouseoverTooltip
      text={
        <div>
          <InfoRow label="Total APR" value={formatNumber(poolAPR + farmAPR)} isTotal={true} />
          <InfoRow label="Pool APR" value={formatNumber(poolAPR)} />
          <InfoRow label="Farm APR" value={formatNumber(farmAPR)} />
        </div>
      }
    >
      {children}
    </MouseoverTooltip>
  )
}
