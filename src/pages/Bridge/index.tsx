import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useCallback, useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { PageWrapper } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useBridgeState } from 'state/bridge/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { isAddress } from 'utils'
import { isTokenNative } from 'utils/tokenInfo'

import BridgeHistory from './BridgeTransfers'
import Disclaimer from './Disclaimer'
import SwapForm from './SwapForm'
import {
  BridgeLocalStorageKeys,
  fetchTokenVersion,
  getBridgeLocalstorage,
  getChainlist,
  getTokenlist,
  setBridgeLocalstorage,
} from './helpers'
import { MultiChainTokenInfo } from './type'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`
const Content = styled.div`
  display: flex;
  justify-content: center;
  gap: 48px;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    gap: 24px;
    flex-direction: column;
  `}
`
const Title = styled.h1`
  font-weight: 500;
  color: ${({ theme }) => theme.primary};
  font-size: 20px;
  margin: 0;
`
const TIMEOUT = 'TIMEOUT'
function timeout() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(TIMEOUT)
    }, 1000 * 3)
  })
}
export default function Bridge() {
  const theme = useTheme()
  const { chainId, isSolana } = useActiveWeb3React()
  const [{ tokenInfoIn, chainIdOut }, setBridgeState] = useBridgeState()
  const curChainId = useRef(chainId)
  curChainId.current = chainId

  const formatAndSaveToken = useCallback(
    (tokens: any, chainIdRequest: ChainId) => {
      let native: WrappedTokenInfo | undefined
      if (curChainId.current !== chainIdRequest || !chainIdRequest) return // prevent api 1 call first but finished later
      const result: WrappedTokenInfo[] = []
      Object.keys(tokens).forEach(key => {
        const token = { ...tokens[key] } as MultiChainTokenInfo
        const { address, logoUrl, name, decimals, symbol } = token
        if (!isAddress(chainId, address)) {
          return
        }
        token.key = key
        token.chainId = chainIdRequest
        const wrappedToken = new WrappedTokenInfo({
          chainId: chainIdRequest,
          decimals,
          symbol,
          name,
          address,
          logoURI: logoUrl,
          multichainInfo: token,
        })
        result.push(wrappedToken)
        if (isTokenNative(wrappedToken, chainIdRequest)) {
          native = wrappedToken
        }
      })
      setBridgeState({ listTokenIn: result, tokenIn: native || result[0], loadingToken: false })
    },
    [chainId, setBridgeState],
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        setBridgeState({ loadingToken: true })
        const oldVersion = getBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION)
        let version
        try {
          version = await Promise.race([timeout(), fetchTokenVersion()])
        } catch (error) {}

        const isStaleData = oldVersion !== version || !version || version === TIMEOUT
        if (isStaleData && version !== TIMEOUT) {
          setBridgeLocalstorage(BridgeLocalStorageKeys.TOKEN_VERSION, version)
        }

        const data = await Promise.allSettled([getChainlist(isStaleData), getTokenlist(chainId, isStaleData)])
        if (data[0].status === 'fulfilled') {
          const listChainIn = data[0].value
          setBridgeState({ listChainIn })
        }
        if (data[1].status === 'fulfilled' && chainId) {
          const tokens = data[1].value
          formatAndSaveToken(tokens, chainId)
        }
      } catch (error) {
        console.error(error)
      }
    }

    if (chainId) {
      fetchData()
    }
  }, [chainId, setBridgeState, formatAndSaveToken])

  useEffect(() => {
    const destChainInfo = tokenInfoIn?.destChains || {}
    if (!chainIdOut || !tokenInfoIn) {
      setBridgeState({ listTokenOut: [] })
      return
    }
    const map = chainIdOut ? destChainInfo[chainIdOut] ?? {} : {}
    const listTokenOut: WrappedTokenInfo[] = []
    Object.keys(map).forEach(hash => {
      const token = { ...map[hash] }
      token.key = hash
      const { decimals, name, address, symbol } = token as MultiChainTokenInfo
      if (!isAddress(chainId, address)) return
      listTokenOut.push(
        new WrappedTokenInfo({
          chainId: chainIdOut,
          decimals,
          symbol,
          name,
          address,
          logoURI: tokenInfoIn.logoUrl,
          multichainInfo: token,
        }),
      )
    })
    setBridgeState({ listTokenOut })
  }, [chainIdOut, tokenInfoIn, chainId, setBridgeState])

  if (isSolana) return <Navigate to="/" />
  return (
    <PageWrapper>
      <Disclaimer />
      <Content>
        <Container>
          <div>
            <Title>
              <Trans>Bridge</Trans>
            </Title>
            <Text fontSize={12} color={theme.subText} marginTop={'8px'}>
              <Trans>Easily transfer tokens from one chain to another</Trans>
            </Text>
          </div>
          <SwapForm />
        </Container>
        <BridgeHistory />
      </Content>
    </PageWrapper>
  )
}
