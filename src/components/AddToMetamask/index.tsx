import React from 'react'
import styled from 'styled-components'
import { ChainId, Token } from '@dynamic-amm/sdk'

import MetaMaskLogo from 'assets/images/metamask.png'
import { ButtonEmpty } from 'components/Button'
import { RowFixed } from 'components/Row'
import { getTokenLogoURL } from 'utils'

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
`

export default function AddTokenToMetaMask({ token, chainId }: { token: Token; chainId: ChainId }) {
  async function addToMetaMask() {
    const tokenAddress = token.address
    const tokenSymbol = token.symbol
    const tokenDecimals = token.decimals
    const tokenImage = getTokenLogoURL(token.address, chainId)

    try {
      const { ethereum } = window
      const isMetaMask = !!(ethereum && ethereum.isMetaMask)
      if (isMetaMask) {
        await (window.ethereum as any).request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage
            }
          }
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <ButtonEmpty mt="12px" padding="0" width="fit-content" onClick={addToMetaMask}>
      <RowFixed>
        <StyledLogo src={MetaMaskLogo} />
      </RowFixed>
    </ButtonEmpty>
  )
}
