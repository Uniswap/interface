import { formatEther, parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { intlFormat } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ButtonError, ButtonLight } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import Loader from '../../components/Loader'
import { Wrapper } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import XttPresaleHeader from '../../components/xttpresale/XttPresaleHeader'
import { ExtendedXDC } from '../../constants/extended-xdc'
import { useXttPresaleContract } from '../../hooks/useContract'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { tryParseAmount } from '../../state/swap/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import {
  useXttPresaleState,
  useXttPresaleStateFormatted,
  useXttPresaleStateStatus,
} from '../../state/xtt-presale/hooks'
import { IXttPresaleFormattedState, Status } from '../../state/xtt-presale/reducer'
import XttPresaleUpdater from '../../state/xtt-presale/updater'
import AppBody from '../AppBody'

export default function XTTPresale() {
  const { account, chainId } = useActiveWeb3React()
  const presaleContract = useXttPresaleContract()
  const {
    token,
    tokenPerETH,
    maximumDepositEthAmount,
    minimumDepositEthAmount,
    bonus,
    privateSaleStartTimestamp,
    privateSaleEndTimestamp,
    claimEnabledStart,
  }: IXttPresaleFormattedState = useXttPresaleStateFormatted()
  const xttPresaleState = useXttPresaleState()
  const presaleStatus = useXttPresaleStateStatus()
  const toggleWalletModal = useWalletModalToggle()
  const ether = useMemo(() => {
    if (chainId) {
      return ExtendedXDC.onChain(chainId)
    }
    return undefined
  }, [chainId])

  const xdcBalance = useCurrencyBalance(account ?? undefined, ether ?? undefined)
  const [v, setV] = useState({ xtt: '', xdc: '' })
  const [presaleError, setPresaleError] = useState<string>('')
  const [txStatus, setTxStatus] = useState<Status>(Status.INITIAL)

  const showMaxButton = Boolean(xdcBalance?.greaterThan(0) && !tryParseAmount(v.xdc)?.equalTo(xdcBalance))

  const xttToken = useMemo(() => {
    if (presaleStatus !== Status.SUCCESS || !chainId) {
      return null
    }
    return new Token(chainId, token, 18, 'XTT', 'X Treasury Token')
  }, [presaleStatus, chainId, token])

  const handleTypeInput = useCallback(
    (value: string) => {
      if (value === '') {
        setV({ xtt: '', xdc: '' })
      }
      setV((v) => ({ ...v, xdc: value }))
      if (ether && xttToken) {
        const parsedValue = parseEther(value || '0')
        if (tokenPerETH !== undefined && parsedValue !== undefined) {
          let xtt = tryParseAmount(formatEther(tokenPerETH.mul(parsedValue)), ether)
          if (maximumDepositEthAmount.lte(parsedValue)) {
            xtt = xtt?.multiply(100 + bonus).divide(100)
          }

          setV({
            xdc: value,
            xtt: xtt?.toFixed(3) || '',
          })
        }
      }
    },
    [tokenPerETH, maximumDepositEthAmount, xttToken, ether, bonus]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      if (value === '') {
        setV({ xtt: '', xdc: '' })
      }
      setV((v) => ({ ...v, xtt: value }))
      if (ether && xttToken) {
        const parsedValue = parseEther(value || '0')

        if (tokenPerETH !== undefined && parsedValue !== undefined) {
          setV({
            xtt: value,
            xdc: tryParseAmount(formatEther(parsedValue.div(tokenPerETH)), ether)?.toFixed(3) || '',
          })
        }
      }
    },
    [tokenPerETH, xttToken, ether]
  )

  const handleMaxInput = useCallback(() => {
    xdcBalance &&
      handleTypeInput(
        xdcBalance.greaterThan(maximumDepositEthAmount.toString())
          ? formatEther(maximumDepositEthAmount)
          : xdcBalance.toFixed(2)
      )
  }, [xdcBalance, handleTypeInput, maximumDepositEthAmount])

  const handleBuy = async () => {
    if (!presaleContract || !!presaleError || v.xdc === '0') {
      return
    }
    setTxStatus(Status.PENDING)
    presaleContract
      .deposit({ value: parseEther(v.xdc).toString() })
      .then((v) => {
        console.log(v)
      })
      .catch((e) => {
        console.log(e)
      })
  }

  useEffect(() => {
    if (!maximumDepositEthAmount || !minimumDepositEthAmount || !v.xdc) {
      return
    }
    const parsedV = parseEther(v.xdc)

    if (!maximumDepositEthAmount || !minimumDepositEthAmount || !parsedV) {
      setPresaleError('')
      return
    }

    const now = Date.now() / 1000
    if (privateSaleStartTimestamp > now || privateSaleStartTimestamp === 0) {
      setPresaleError(
        `Sale starts: ${intlFormat(new Date(privateSaleStartTimestamp * 1000), {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}`
      )
      return
    }

    if (privateSaleEndTimestamp < now && claimEnabledStart === 0) {
      setPresaleError('PRIVATE SALE ENDED')
      return
    }

    if (privateSaleEndTimestamp < now && claimEnabledStart > now) {
      setPresaleError(
        `Claim starts: ${intlFormat(new Date(claimEnabledStart * 1000), {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}`
      )
      return
    }

    if (xdcBalance?.lessThan(tryParseAmount(v.xdc, ether) ?? '0')) {
      setPresaleError('Insufficient XDC balance')
      return
    }

    if (maximumDepositEthAmount.lt(parsedV)) {
      setPresaleError(`Max amount: ${formatEther(maximumDepositEthAmount)}`)
      return
    }

    if (minimumDepositEthAmount.gt(parsedV)) {
      setPresaleError(`Min amount: ${formatEther(minimumDepositEthAmount)}`)
      return
    }

    setPresaleError('')
  }, [
    v,
    xdcBalance,
    ether,
    minimumDepositEthAmount,
    maximumDepositEthAmount,
    privateSaleStartTimestamp,
    privateSaleEndTimestamp,
    claimEnabledStart,
  ])

  return (
    <>
      <XttPresaleUpdater />
      <AppBody>
        <XttPresaleHeader state={xttPresaleState} />
        <Wrapper id="swap-page">
          <AutoColumn gap={'sm'}>
            <div style={{ display: 'relative' }}>
              <CurrencyInputPanel
                label={<Trans>From</Trans>}
                value={v.xdc}
                showMaxButton={showMaxButton}
                currency={ether}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                id="swap-currency-input"
              />
              <CurrencyInputPanel
                value={v.xtt}
                onUserInput={handleTypeOutput}
                label={<Trans>To</Trans>}
                showMaxButton={false}
                currency={xttToken}
                id="swap-currency-output"
              />
            </div>
            <div>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>
                  <Trans>Connect Wallet</Trans>
                </ButtonLight>
              ) : (
                <ButtonError
                  width="100%"
                  id="swap-button"
                  disabled={!!presaleError}
                  error={!!presaleError}
                  onClick={handleBuy}
                >
                  {txStatus === Status.PENDING ? (
                    <Loader size={'20px'} color={'red'} />
                  ) : presaleError ? (
                    <Trans>{presaleError}</Trans>
                  ) : (
                    <Trans>Buy</Trans>
                  )}
                </ButtonError>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>
      <SwitchLocaleLink />
    </>
  )
}
