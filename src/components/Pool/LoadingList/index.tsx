import React from 'react'
import { Box, Flex } from 'rebass'
import LoadingCard from './LoadingCard'

interface LoadingListProps {
  wideCards?: boolean
}

export default function LoadingList({ wideCards }: LoadingListProps) {
  return (
    <Flex flexWrap="wrap" m="-4px">
      {new Array(wideCards ? 9 : 12).fill(null).map((_, index) => (
        <Box p="4px" key={index}>
          <LoadingCard wide={wideCards} />
        </Box>
      ))}
    </Flex>
  )
}
