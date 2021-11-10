import React, { useEffect } from 'react'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { QuoteParams, QuoteResult } from 'src/features/swap/types'
import { useQuote } from 'src/features/swap/useQuote'

interface QuoteProviderProps {
  setQuoteResult: (quoteResult: QuoteResult) => void
  params: Pick<QuoteParams, 'amountIn' | 'inAddress' | 'outAddress'>
}

// Helper component to retrieve quotes
export function QuoteProvider({
  params: { amountIn, inAddress, outAddress },
  setQuoteResult,
}: QuoteProviderProps) {
  // TODO(judo): support arbitrary chain, `Token` param, take chainId
  const chainId = ChainId.RINKEBY

  const { isLoading, isError, error, data } = useQuote({
    amount: amountIn,
    tokenInAddress: inAddress,
    tokenOutAddress: outAddress,
    chainId,
  })

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setQuoteResult(data)
    }
  }, [data, isError, isLoading, setQuoteResult])

  if (isError) {
    return (
      <Box>
        <Text>Error fetching: {JSON.stringify(error)}</Text>
      </Box>
    )
  } else if (isLoading) {
    return (
      <Box>
        <Text>Fetching...</Text>
      </Box>
    )
  }

  return <Text>{JSON.stringify(data)}</Text>
}
