import { Token } from '@uniswap/sdk-core'
import { TransactionsTable } from 'components/Tokens/TokenDetails/TransactionsTable'
import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

const mockToken = new Token(
  1,
  '0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
  18,
  'BITCOIN',
  'HarryPotterObamaSonic10Inu'
)

const TableWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

interface TopPool {
  hash: string
  transactions: number
  tvl: number
  oneDayVolume: number
  sevenDayVolume: number
  turnover: number
}

export function PoolTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const chainId = supportedChainIdFromGQLChain(chainName)
  return (
    <TableWrapper>
      <TransactionsTable chainId={chainId} referenceToken={mockToken} />
    </TableWrapper>
  )
}
