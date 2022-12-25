import { formatCurrencyAmount } from '@uniswap/conedison/format'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { UniIcon } from 'nft/components/icons'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { Z_INDEX } from '../../theme/zIndex'

const ComparisonCard = styled.div`
  position: relative;
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  z-index: ${Z_INDEX.deprecated_content};
  padding: 16px 20px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  &:hover {
    border: 1px solid ${({ theme }) => theme.backgroundOutline};
  }
`

const ComparisonHeader = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  padding-bottom: 4px;
`

const QuoteRowContainer = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 20px max-content 1fr;
  gap: 8px;
`

export default function QuoteComparison() {
  // TODO: use values from the state
  const {
    trade,
    currencies: { OUTPUT },
  } = useDerivedSwapInfo()

  // const floodQuoteStablecoinPrice = useStablecoinValue(
  //   OUTPUT && floodQuote ? CurrencyAmount.fromRawAmount(OUTPUT, floodQuote) : null
  // )
  const uniswapQuoteStablecoinPrice = useStablecoinValue(trade.trade?.outputAmount)

  const formattedFloodQuote = '$1.23'
  const formattedUniswapQuote = formatCurrencyAmount(uniswapQuoteStablecoinPrice)

  return (
    <ComparisonCard>
      <ComparisonHeader>
        <ThemedText.DeprecatedBlack fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
          Comparison
        </ThemedText.DeprecatedBlack>
      </ComparisonHeader>
      <QuoteRowContainer>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 161 161">
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M80 19A75 75 0 0 0 5 94h27.273c0-.192 0-.383.003-.575.141 12.961 5.153 25.361 13.976 34.537C55.202 137.27 67.342 142.5 80 142.5c12.659 0 24.798-5.23 33.749-14.538 8.814-9.167 13.824-21.549 13.975-34.496l.003.534H155a75 75 0 0 0-75-75Zm47.57 71.133A23.862 23.862 0 0 0 80 92.863h47.714H80c0 6.582-2.514 12.895-6.989 17.549s-10.545 7.269-16.874 7.269c-6.33 0-12.4-2.615-16.874-7.269-4.37-4.544-6.87-10.668-6.986-17.08a47.726 47.726 0 0 1 81.47-33.08h.001a47.723 47.723 0 0 1 13.822 29.881Z"
            clipRule="evenodd"
          />
        </svg>
        <ThemedText.DeprecatedBlack fontWeight={400} fontSize={13}>
          Flood Router
        </ThemedText.DeprecatedBlack>
        <ThemedText.DeprecatedBlack fontWeight={400} fontSize={13} style={{ textAlign: 'right' }}>
          {formattedFloodQuote || '—'}
        </ThemedText.DeprecatedBlack>
      </QuoteRowContainer>
      <QuoteRowContainer>
        <UniIcon width={24} height={24} viewBox="0 0 48 48" />
        <ThemedText.DeprecatedBlack fontWeight={400} fontSize={13}>
          Uniswap Router
        </ThemedText.DeprecatedBlack>
        <ThemedText.DeprecatedBlack fontWeight={400} fontSize={13} style={{ textAlign: 'right' }}>
          {formattedUniswapQuote || '—'}
        </ThemedText.DeprecatedBlack>
      </QuoteRowContainer>
    </ComparisonCard>
  )
}
