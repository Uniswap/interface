import React, { memo, useMemo } from 'react'
import { getToken } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { FlexLoader } from 'ui/src/loading/FlexLoader'
import { NftCardLoader } from 'ui/src/loading/NftCardLoader'
import { Skeleton } from 'ui/src/loading/Skeleton'
import { TransactionLoader } from './TransactionLoader'

export const Transaction = memo(function _Transaction({
  repeat = 1,
}: {
  repeat?: number
}): JSX.Element {
  return (
    <Skeleton>
      <Flex>
        {new Array(repeat).fill(null).map((_, i, { length }) => (
          <React.Fragment key={i}>
            <TransactionLoader opacity={(length - i) / length} />
          </React.Fragment>
        ))}
      </Flex>
    </Skeleton>
  )
})

function NFT({ repeat = 1 }: { repeat?: number }): JSX.Element {
  const loader = useMemo(
    () =>
      repeat === 1 ? (
        <NftCardLoader opacity={1} />
      ) : (
        <Flex>
          {new Array(Math.floor(repeat / 2)).fill(null).map((_, i, { length }) => {
            const opacity = (length - i) / length
            return (
              <Flex key={i} row>
                <NftCardLoader opacity={opacity} width="50%" />
                <NftCardLoader opacity={opacity} width="50%" />
              </Flex>
            )
          })}
        </Flex>
      ),
    [repeat]
  )

  return <Skeleton>{loader}</Skeleton>
}

function Image(): JSX.Element {
  return (
    <Skeleton>
      <FlexLoader aspectRatio={1} borderRadius={getToken('$none', 'radius')} />
    </Skeleton>
  )
}

export const Loader = {
  NFT,
  Image,
  Transaction,
}
