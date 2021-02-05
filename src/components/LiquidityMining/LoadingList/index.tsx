import React from 'react'
import { AutoRowCleanGap } from '../../Row'
import LoadingCard from './LoadingCard'

export default function LoadingList() {
  return (
    <AutoRowCleanGap gap={6}>
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </AutoRowCleanGap>
  )
}
