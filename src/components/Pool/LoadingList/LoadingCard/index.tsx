import React from 'react'
import styled from 'styled-components'
import Skeleton from 'react-loading-skeleton'
import { DarkCard } from '../../../Card'
import { Box, Flex } from 'rebass'
import DoubleCurrencyLogo from '../../../DoubleLogo'
import CurrencyLogo from '../../../CurrencyLogo'

const SizedCard = styled(DarkCard)<{ wide?: boolean }>`
  width: 100%;
  height: 147px;
`

interface LoadingCardsProps {
  doubleCircle?: boolean
}

export default function LoadingCard({ doubleCircle }: LoadingCardsProps) {
  return (
    <SizedCard width="100%" height="100%" padding="20px">
      <Flex width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <Box>{doubleCircle ? <DoubleCurrencyLogo size={28} loading /> : <CurrencyLogo size="28px" loading />}</Box>
        <Box mt="5px">
          <Skeleton height="16px" width="36px" />
        </Box>
        <Box mt="6px">
          <Skeleton height="12px" width="80px" />
        </Box>
        <Box mt="3px">
          <Skeleton height="9px" width="74px" />
        </Box>
      </Flex>
    </SizedCard>
  )
}
