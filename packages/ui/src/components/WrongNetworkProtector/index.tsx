import { UnsupportedChainIdError } from '@web3-react/core'
import { useActiveWeb3React } from 'hooks'
import { PropsWithChildren } from 'react'
import { Flex, Text } from 'rebass'

export function WrongNetworkProtector({ children }: PropsWithChildren) {
  const { error, chainId, library, active, account } = useActiveWeb3React()
  return (
    <>
      {error instanceof UnsupportedChainIdError || !account ? (
        <Flex width="100%" height="100%" justifyContent={'center'} alignItems="center">
          <Text sx={{ fontSize: '2rem' }}>Please connect to the appropriate Ethereum network</Text>
        </Flex>
      ) : (
        <> {children} </>
      )}
    </>
  )
}
