import styled from 'styled-components'

import Logo from 'components/Logo'
import { PrimaryText } from 'components/WalletPopup/Transactions/TransactionItem'
import { getTokenLogo } from 'components/WalletPopup/Transactions/helper'
import useTheme from 'hooks/useTheme'

export const TokenAmountWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
`
const TokenLogo = styled(Logo)`
  width: 12px;
  height: 12px;
  border-radius: 100%;
  box-shadow: ${({ theme }) =>
    (() => {
      const color = theme.darkMode ? `rgba(256, 256, 256, 0.2)` : `rgba(0, 0, 0, 0.2)`
      return `0 4px 5px 0 ${color}, 0 1px 70px 0 ${color};`
    })()};
`

const DeltaTokenAmount = ({
  symbol,
  amount,
  tokenAddress,
  plus,
  color: customColor,
  logoURL,
}: {
  symbol?: string
  amount?: string
  tokenAddress?: string
  plus?: boolean
  color?: string
  logoURL?: string
}) => {
  const withSign = plus !== undefined
  const theme = useTheme()
  const sign = amount === undefined || !withSign ? null : plus ? '+' : '-'
  const color = customColor ?? (plus ? theme.primary : theme.subText)
  const logoUrl = logoURL ?? getTokenLogo(tokenAddress)
  if (!amount) return null
  return (
    <TokenAmountWrapper>
      {logoUrl && <TokenLogo srcs={[logoUrl]} />}
      <PrimaryText style={{ color }}>
        {sign} {amount} {symbol}
      </PrimaryText>
    </TokenAmountWrapper>
  )
}

export default DeltaTokenAmount
