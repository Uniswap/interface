import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { Web3Provider } from '@ethersproject/providers'
import { formatEther, parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { intlFormat } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { setInterval } from 'timers'

import { ButtonError, ButtonLight } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import Loader from '../../components/Loader'
import { Wrapper } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import XttPresaleHeader from '../../components/xttpresale/XttPresaleHeader'
import { ExtendedXDC } from '../../constants/extended-xdc'
import { useTokenContract, useXttPresaleContract } from '../../hooks/useContract'
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
  const [now, setNow] = useState<number>(Date.now() / 1000)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now() / 1000)
    }, 3000)
    return clearInterval(interval)
  }, [])

  const { account, chainId, library } = useActiveWeb3React()
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
    balanceOf,
  }: IXttPresaleFormattedState = useXttPresaleStateFormatted()
  const tokenContract = useTokenContract(token)
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
  const [tokenBalance, setTokenBalance] = useState('0')

  useEffect(() => {
    if (tokenBalance === '0' && tokenContract && account) {
      tokenContract.balanceOf(account).then((v) => {
        setTokenBalance(v.toString())
      })
    }
  }, [tokenBalance, tokenContract, account])

  const xttToken = useMemo(() => {
    console.log(token)
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
        xdcBalance.greaterThan(maximumDepositEthAmount.sub(balanceOf.div(tokenPerETH)).toString())
          ? formatEther(maximumDepositEthAmount.sub(balanceOf.div(tokenPerETH)))
          : xdcBalance.toFixed(2)
      )
  }, [xdcBalance, handleTypeInput, maximumDepositEthAmount, balanceOf, tokenPerETH])

  const txPending = async (hash: string, library: Web3Provider): Promise<TransactionReceipt> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const receipt = await library.getTransactionReceipt(hash)
          if (receipt) {
            if (receipt.status) {
              clearInterval(interval)
              resolve(receipt)
            } else {
              clearInterval(interval)
              reject(receipt)
            }
          }
        } catch (e) {
          clearInterval(interval)
          reject(e)
        }
      }, 2000)
    })
  }

  const handleBuy = async () => {
    if (!presaleContract || !!presaleError || v.xdc === '0' || !library) {
      return
    }
    setTxStatus(Status.PENDING)
    presaleContract
      .deposit({ value: parseEther(v.xdc).toString() })
      .then((v) => {
        txPending(v.hash, library)
          .then((v) => {
            console.log(v)
            window.location.reload()
            setTxStatus(Status.SUCCESS)
          })
          .catch((e) => {
            console.log(e)
            setTxStatus(Status.ERROR)
          })
      })
      .catch((e) => {
        console.log(e)
        setTxStatus(Status.ERROR)
      })
  }

  const handleClaim = async () => {
    if (!presaleContract || !!presaleError || !library || !balanceOf.gt(0)) {
      return
    }
    setTxStatus(Status.PENDING)
    presaleContract
      .claim()
      .then((v) => {
        txPending(v.hash, library)
          .then((v) => {
            console.log(v)
            window.location.reload()
            setTxStatus(Status.SUCCESS)
          })
          .catch((e) => {
            console.log(e)
            setTxStatus(Status.ERROR)
          })
      })
      .catch((e) => {
        console.log(e)
        setTxStatus(Status.ERROR)
      })
  }

  useEffect(() => {
    if (claimEnabledStart < now && balanceOf.eq(0)) {
      setPresaleError(`Nothing to claim`)
      return
    }

    if (!maximumDepositEthAmount || !minimumDepositEthAmount || !v.xdc) {
      return
    }
    const parsedV = parseEther(v.xdc)

    if (!maximumDepositEthAmount || !minimumDepositEthAmount || !parsedV) {
      setPresaleError('')
      return
    }
    if (privateSaleEndTimestamp < now && claimEnabledStart === 0) {
      setPresaleError(
        `Sale ended: ${intlFormat(new Date(privateSaleEndTimestamp * 1000), {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}`
      )
      return
    }

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

    if (maximumDepositEthAmount.lt(parsedV.add(balanceOf.div(tokenPerETH)))) {
      setPresaleError(`Max amount: ${formatEther(maximumDepositEthAmount.sub(balanceOf.div(tokenPerETH)))}`)
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
    balanceOf,
    ether,
    tokenPerETH,
    minimumDepositEthAmount,
    maximumDepositEthAmount,
    privateSaleStartTimestamp,
    privateSaleEndTimestamp,
    claimEnabledStart,
    now,
  ])

  return (
    <>
      <XttPresaleUpdater />
      <AppBody>
        <XttPresaleHeader
          tokenBalance={tokenBalance}
          state={xttPresaleState}
          bonus={maximumDepositEthAmount.lte(parseEther(v.xdc || '0'))}
        />
        <Wrapper id="swap-page">
          <AutoColumn gap={'sm'}>
            {claimEnabledStart > now && (
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
            )}

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
                  onClick={claimEnabledStart < now ? handleClaim : handleBuy}
                >
                  {txStatus === Status.PENDING ? (
                    <Loader size={'20px'} color={'red'} />
                  ) : presaleError ? (
                    <Trans>{presaleError}</Trans>
                  ) : (
                    <Trans>{claimEnabledStart < now ? 'Claim' : 'Buy'}</Trans>
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
