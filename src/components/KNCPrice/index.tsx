import React from 'react'
import { useKNCPrice } from 'state/application/hooks'
import { KNCPriceContainer, KNCPriceWrapper } from './styleds'
import Loader from 'components/Loader'
import { formattedNum } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { ChainId } from 'libs/sdk/src'

export default function KNCPice() {
  const { chainId } = useActiveWeb3React()
  const kncPrice = useKNCPrice()

  if (chainId && chainId === ChainId.AVAXMAINNET) {
    return null
  }

  return (
    <KNCPriceContainer>
      {kncPrice ? (
        <KNCPriceWrapper>
          <img
            src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202/logo.png`}
            alt="knc-logo"
            width="20px"
            height="20px"
          />
          {formattedNum(kncPrice, true)}
        </KNCPriceWrapper>
      ) : (
        <Loader />
      )}
    </KNCPriceContainer>
  )
}
