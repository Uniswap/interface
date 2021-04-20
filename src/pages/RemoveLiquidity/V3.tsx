import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import React from 'react'
import { RouteComponentProps } from 'react-router'
import AppBody from '../AppBody'

// TODO
export default function RemoveLiquidityV3({
  match: {
    params: { tokenId },
  },
}: RouteComponentProps<{ tokenId: string }>) {
  const position = useV3PositionFromTokenId(tokenId)

  // check that account actually owns the position
  console.log(position)

  return <AppBody>TODO</AppBody>
}
