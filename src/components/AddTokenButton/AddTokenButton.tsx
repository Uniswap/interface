import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import { SWPR } from '@swapr/sdk'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'

const MAINNET_ADDRESS = '0x6cacdb97e3fc8136805a9e7c342d866ab77d0957'
const ARBITRUM_ADDRESS = '0xde903e2712288a1da82942dddf2c20529565ac30'

const Button = styled.button`
  max-width: 190px;
  padding: 6px 8px;
  font-size: 10px;
  line-height: 10px;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c0baf7;
  background: #191a24;
  border-radius: 8px;
  border: none;

  &.active {
    color: #ffffff;
    background: linear-gradient(90deg, #2e17f2 -24.77%, #fb52a1 186.93%);
    box-shadow: 0px 0px 42px rgba(165, 58, 196, 0.35);
  }
`

export const AddTokenButton = () => {
  const { chainId, account } = useActiveWeb3React()
  const [address, setAddress] = useState<string | null>()

  const { newSwpr } = useMemo(() => (chainId ? { newSwpr: SWPR[chainId] } : { newSwpr: undefined }), [chainId])

  const accountOrUndefined = useMemo(() => account || undefined, [account])
  const newSwprBalance = useTokenBalance(accountOrUndefined, newSwpr)

  useEffect(() => {
    switch (chainId) {
      case 1:
        setAddress(MAINNET_ADDRESS)
        break
      case 42161:
        setAddress(ARBITRUM_ADDRESS)
        break
      default:
        setAddress(null)
    }
  }, [chainId])

  const { ethereum } = window
  const isMetamask = ethereum && ethereum.isMetaMask
  if (!isMetamask || !address) return null

  const addTokenToMetamask = async () => {
    try {
      if (!!ethereum && !!ethereum.request) {
        await ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol: 'SWPR',
              decimals: 18,
              image: ''
            }
          }
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <Button onClick={addTokenToMetamask} className={newSwprBalance?.greaterThan('0') ? 'active' : ''}>
      + Add SWPR to Metamask
    </Button>
  )
}
