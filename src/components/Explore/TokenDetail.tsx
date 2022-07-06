import { useToken } from 'hooks/Tokens'
import styled from 'styled-components/macro'

const ChartAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 832px;
  gap: 20px;
`

export default function TokenDetail({ tokenAddress }: { tokenAddress: string }) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol

  return (
    <ChartAreaContainer>
      Token Detail Page for token: {tokenAddress}| {tokenName} | {tokenSymbol}
    </ChartAreaContainer>
  )
}
