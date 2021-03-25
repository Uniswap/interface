import React, { useCallback } from 'react'
import { ChainId } from 'dxswap-sdk'
import { NETWORK_DETAIL } from '../../constants'
import { Box, Flex } from 'rebass'
import { ButtonPrimary } from '../Button'

export default function NewNetworkPopup({ chainId }: { chainId: ChainId }) {
  const handleAddClick = useCallback(() => {
    if (!window.ethereum || !window.ethereum.request) return
    window.ethereum
      .request({
        method: 'wallet_addEthereumChain',
        params: [{ ...NETWORK_DETAIL[chainId], metamaskAddable: undefined }]
      })
      .catch(error => {
        console.error(`error adding network to metamask`, error)
      })
  }, [chainId])

  return (
    <Flex flexDirection="column">
      <Box>
        We detected you have Metamask installed. Do you want to add/switch to the network{' '}
        {NETWORK_DETAIL[chainId].chainName}?
      </Box>
      <Box>
        <ButtonPrimary onClick={handleAddClick}>Add/Switch</ButtonPrimary>
      </Box>
    </Flex>
  )
}
