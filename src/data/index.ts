import { useEffect, useRef } from 'react'
import { responseInterface } from 'swr'

import { useBlockNumber } from '../state/application/hooks'

export enum SWRKeys {
  Allowances,
  Reserves,
  TotalSupply,
  V1PairAddress
}

export function useKeepSWRDataLiveAsBlocksArrive(mutate: responseInterface<any, any>['mutate']) {
  // because we don't care about the referential identity of mutate, just bind it to a ref
  const mutateRef = useRef(mutate)
  useEffect(() => {
    mutateRef.current = mutate
  })
  // then, whenever a new block arrives, trigger a mutation
  const blockNumber = useBlockNumber()
  useEffect(() => {
    mutateRef.current()
  }, [blockNumber])
}
