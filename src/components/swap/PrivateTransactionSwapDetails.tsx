import { Trans } from '@lingui/macro'
import { Percent, Currency, TradeType, CurrencyAmount, Ether } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import { useContext, useEffect, useRef, useState, useMemo } from 'react'
import { ThemeContext } from 'styled-components/macro'
import { TYPE } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { useSwapState } from '../../state/swap/hooks'
import { useActiveWeb3React } from '../../hooks/web3'
import { useERC20PermitFromTrade } from '../../hooks/useERC20Permit'
import useIsMounted from '../../hooks/useIsMounted'
import useFeesPerGas from '../../hooks/useFeesPerGas'
import { useSwapCallArguments, getBestCallOption, SwapCall } from '../../hooks/useSwapCallback'

interface PrivateTransactionSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
}

export function PrivateTransactionSwapDetails({ trade, allowedSlippage }: PrivateTransactionSwapDetailsProps) {
  const theme = useContext(ThemeContext)
  const isMounted = useIsMounted()
  const loadingRef = useRef<boolean>(false)
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null)
  const { account, library, chainId } = useActiveWeb3React()
  const { recipient } = useSwapState()
  const { signatureData } = useERC20PermitFromTrade(trade, allowedSlippage)
  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipient, signatureData)
  const feesPerGas = useFeesPerGas()

  function setBestCallOption(swapCalls: SwapCall[]) {
    if (!account || !library || !swapCalls || !swapCalls.length) {
      return
    }
    if (loadingRef.current || estimatedGas) return
    loadingRef.current = true
    getBestCallOption(swapCalls, account, library).then((callOption) => {
      if (isMounted()) {
        const gasEstimate: BigNumber | null = 'gasEstimate' in callOption ? callOption.gasEstimate : null
        if (gasEstimate) {
          setEstimatedGas(gasEstimate.toHexString())
        }
        loadingRef.current = false
      }
    })
  }

  useEffect(() => {
    setBestCallOption(swapCalls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapCalls])

  const { gasFee } = useMemo(() => {
    if (!estimatedGas || !chainId || !feesPerGas.maxFeePerGas || !feesPerGas.maxPriorityFeePerGas) {
      return { gasFee: undefined }
    }
    const gas = BigNumber.from(estimatedGas)
    const ether = Ether.onChain(chainId)
    const baseFee = feesPerGas.maxFeePerGas.mul(gas)
    const priorityFee = feesPerGas.maxPriorityFeePerGas.mul(gas)
    const gasFee = CurrencyAmount.fromRawAmount(ether, baseFee.add(priorityFee).toString())
    return {
      gasFee,
    }
  }, [estimatedGas, feesPerGas.maxFeePerGas, feesPerGas.maxPriorityFeePerGas, chainId])

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <Trans>Gas Fee (estimated)</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {gasFee ? `${gasFee.toSignificant(4)} ${gasFee.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>
      <RowBetween>
        <TYPE.italic fontWeight={400} textAlign="left" style={{ width: '100%' }}>
          Estimated gas fee that will be included in Frontrunning Protected transactions.
        </TYPE.italic>
      </RowBetween>
    </AutoColumn>
  )
}
