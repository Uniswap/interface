import React, { useCallback, useEffect, useState } from 'react'
import Switch from '../Switch'
import styled from 'styled-components'
import CurrencyIcon from '../CurrencyIcon'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { RowBetween } from '../Row'
import { X } from 'react-feather'
import { CToken } from '../../data/CToken'
import { ButtonLight } from '../Button'
import LendModal from '../LendModal'
import { APY_BASE, calculateGasMargin, formatData, getComptrollerContract, getSupplyTotalBalance } from '../../utils'
import { useActiveWeb3React } from '../../hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import ReactGA from 'react-ga'
import { LendField } from '../../state/lending/actions'
import { useCTokenApproveCallback } from '../../hooks/useApproveCallback'
import { Fraction, JSBI, TokenAmount } from '@uniswap/sdk'
import DoubleAssetLogo from '../DoubleAssetLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from '../TransactionConfirmationModal'
import { useTranslation } from 'react-i18next'

const StyledCloseIcon = styled(X)`
  height: 20px;
  width: 20px;
  :hover {
    cursor: pointer;
  }

  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const MarketsCard = styled.div`
  background: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text1};
  box-shadow: 0px 2px 4px rgba(16, 21, 24, 0.05);
  border-radius: 4px;
`

const MarketsCardHeader = styled.div`
  display: flex;
  flex-flow: inherit;
  align-items: center;
  justify-content: space-between;
  font-size: 1.1rem;
  padding: 1rem 1.75rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
    font-size: 1rem;
  `};
`

const AssetWrap = styled.div`
  cursor: pointer;
  font-size: 1rem;
`

const AssetWrapLabels = styled.div`
  display: grid;
  padding: 1rem 1.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
  grid-template-columns: 4fr 2fr 4fr 3fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 4fr 4fr 3fr;
    padding: 0.8rem 1rem;
  `};
`

const AssetLabel = styled.div<{ textAlign?: string; mobileHide?: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: #aab8c1;
  text-align: ${({ textAlign }) => (textAlign ? textAlign : 'center')};
  ${({ theme, mobileHide }) => theme.mediaWidth.upToMedium`
    display: ${mobileHide ? 'none' : 'block'};
  `};
`

const AssetItemWrap = styled.div`
  font-size: 1rem;
`

const AssetItem = styled.div<{ justifyItems?: string }>`
  display: grid;
  justify-items: ${({ justifyItems }) => (justifyItems ? justifyItems : 'end')};
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.25rem 1.75rem;
  height: 78px;
  border-left: 2px solid transparent;
  padding-left: 1.625rem;
  text-transform: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  transition: none;
  grid-template-columns: 4fr 2fr 4fr 3fr;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 4fr 4fr 3fr;
    padding: 0.8rem 1rem;
  `};
  :hover {
    border-left: 2px solid #1de9b6;
    background: rgba(4, 169, 245, 0.05);
  }
`

const AssetLogo = styled.div`
  display: flex;
  align-items: center;
  justify-self: start;
`

const ItemWrap = styled.div<{ mobileHide?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: right;
  align-self: center;
  text-align: right;
  ${({ theme, mobileHide }) => theme.mediaWidth.upToMedium`
    display: ${mobileHide ? 'none' : 'flex'};
    font-size: 0.8rem;
  `};
`

const ItemBottomWrap = styled.div<{ mobileShow?: boolean }>`
  color: #aab8c1;
  font-size: 0.9em;
`

const MobileWrap = styled.div`
  display: none;
  color: #aab8c1;
  text-align: left;
  font-size: 0.9em;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: block;
  `};
`

const Break = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg3};
`

const ModalContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  background-color: ${({ theme }) => theme.bg2};
  border-radius: 20px;
`

const SymbolWrap = styled.div`
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 6rem;
`

function ItemPannel({
  marketCToken,
  walletBalances,
  children
}: {
  marketCToken: CToken
  walletBalances: {
    [tokenAddress: string]: TokenAmount | undefined
  }
  children: React.ReactNode
}) {
  useCTokenApproveCallback(marketCToken, walletBalances, marketCToken?.cAddress)
  return <>{children}</>
}

const ZERO = JSBI.BigInt(0)

export function getSupplyApy(ctoken: CToken | undefined): Fraction {
  return new Fraction(ctoken?.getSupplyApy() ?? ZERO, APY_BASE)
}

function SupplyMarkets({
  allMarketCTokens = [],
  borrowTotalBalance,
  limit,
  usedLimit,
  walletBalances
}: {
  allMarketCTokens: CToken[]
  borrowTotalBalance: JSBI
  limit: JSBI
  usedLimit: Fraction
  walletBalances: {
    [tokenAddress: string]: TokenAmount | undefined
  }
}) {
  const { t } = useTranslation()

  const { account, chainId, library } = useActiveWeb3React()

  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [showConfirm, setShowConfirm] = useState<boolean>(false)

  const [txHash, setTxHash] = useState<string>('')

  const [pendingText, setPendingText] = useState('')

  console.log('use txHash and attemptingTxn later like Add Liquidity', attemptingTxn, txHash)

  const addTransaction = useTransactionAdder()

  async function onEnterMarkets(cToken: CToken) {
    if (!chainId || !library || !account) return
    const comptroller = getComptrollerContract(chainId, library, account)

    const estimate = comptroller.estimateGas.enterMarkets
    const method: (...args: any) => Promise<TransactionResponse> = comptroller.enterMarkets
    const args: Array<string | string[] | number> = [[cToken.cAddress]]
    const value: BigNumber | null = null

    setPendingText('Enter ' + cToken.symbol + ' as Collateral')
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Enter ' + cToken.symbol + ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Enter',
            label: cToken.symbol
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  async function onExitMarket(cToken: CToken) {
    if (!chainId || !library || !account) return
    const comptroller = getComptrollerContract(chainId, library, account)

    const estimate = comptroller.estimateGas.exitMarket
    const method: (...args: any) => Promise<TransactionResponse> = comptroller.exitMarket
    const args: Array<string | string[] | number> = [cToken.cAddress]
    const value: BigNumber | null = null

    setPendingText('Exit ' + cToken.symbol + ' as Collateral')
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary: 'Exit ' + cToken.symbol + ' as Collateral'
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Collateral',
            action: 'Exit',
            label: cToken.symbol
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const [showCollateralConfirmation, setShowCollateralConfirmation] = useState(false)

  const [collateralToken, setCollateralToken] = useState<CToken>()

  const [lendToken, setLendToken] = useState<CToken>()

  const [showLendConfirmation, setShowLendConfirmation] = useState(false)

  const [isSuppliedMarkets, setIsSuppliedMarkets] = useState(false)

  const [TokenLoadState, setTokenLoadState] = useState(false)

  useEffect(() => {
    if (allMarketCTokens[0].underlyingPrice) {
      setTokenLoadState(true)
    } else {
      setTokenLoadState(false)
    }
  }, [allMarketCTokens])

  const suppliedAsset = allMarketCTokens.filter((item: CToken) => {
    return item.supplyBalance && BigNumber.from(0).lt(item.supplyBalance)
  })

  const supplyAsset = allMarketCTokens.filter((item: CToken) => {
    return (
      (!item.supplyBalance || BigNumber.from(0).eq(item.supplyBalance)) &&
      (!item.borrowBalance || BigNumber.from(0).eq(item.borrowBalance))
    )
  })

  console.log('check--', allMarketCTokens, suppliedAsset, supplyAsset)

  function canExitMarkets(): boolean {
    if (
      collateralToken &&
      collateralToken.supplyBalance &&
      collateralToken?.exchangeRateMantissa &&
      collateralToken?.underlyingPrice &&
      collateralToken?.collateralFactorMantissa
    ) {
      const canExitMarkets: boolean = JSBI.lessThan(
        JSBI.subtract(limit, collateralToken.getSuppliedValue()),
        borrowTotalBalance
      )
      if (canExitMarkets) {
        return false
      } else {
        return true
      }
    } else {
      return false
    }
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
  }, [])

  const confirmationContent = useCallback(
    () =>
      txHash ? (
        <></>
      ) : (
        <TransactionErrorContent onDismiss={handleDismissConfirmation} message={'Collateral rejected.'} />
      ),
    [handleDismissConfirmation, txHash]
  )

  return (
    <div>
      <LendModal
        lendToken={lendToken}
        walletBalances={walletBalances}
        showLendConfirmation={showLendConfirmation}
        setShowLendConfirmation={setShowLendConfirmation}
        borrowTotalBalance={borrowTotalBalance}
        limit={limit}
        usedLimit={usedLimit}
        lendMarket={LendField.SUPPLY}
      />
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
      />
      <Modal isOpen={showCollateralConfirmation} onDismiss={() => setShowCollateralConfirmation(false)}>
        <ModalContentWrapper>
          <AutoColumn gap="lg">
            <RowBetween style={{ padding: '0 2rem' }}>
              <div />
              <Text fontWeight={500} fontSize={'1.1rem'}>
                {collateralToken?.canBeCollateral
                  ? t('disableAsCollateral')
                  : isSuppliedMarkets
                  ? t('collateralRequired')
                  : t('enableAsCollateral')}
              </Text>
              <StyledCloseIcon onClick={() => setShowCollateralConfirmation(false)} />
            </RowBetween>
            <Break />
            <AutoColumn gap="md" style={{ padding: '0 2rem' }}>
              {collateralToken?.canBeCollateral && canExitMarkets() ? (
                <Text fontWeight={400} fontSize={'1rem'}>
                  {t('collateralQuestionHelperOne')}
                </Text>
              ) : collateralToken?.canBeCollateral ? (
                <Text fontWeight={400} fontSize={'1rem'}>
                  {t('collateralQuestionHelperTwo')}
                </Text>
              ) : (
                <Text fontWeight={400} fontSize={'1rem'}>
                  {t('collateralQuestionHelperThree')}
                </Text>
              )}
            </AutoColumn>
            <AutoColumn gap="md" style={{ padding: '0 2rem' }}>
              <ButtonLight
                onClick={() => {
                  if (collateralToken) {
                    if (collateralToken.canBeCollateral) {
                      if (canExitMarkets()) {
                        setPendingText('')
                        setTxHash('')
                        setShowConfirm(true)
                        onExitMarket(collateralToken)
                        setShowCollateralConfirmation(false)
                      } else {
                        return setShowCollateralConfirmation(false)
                      }
                    } else {
                      setPendingText('')
                      setTxHash('')
                      setShowConfirm(true)
                      onEnterMarkets(collateralToken)
                      setShowCollateralConfirmation(false)
                    }
                  } else {
                    return
                  }
                }}
              >
                {collateralToken?.canBeCollateral && canExitMarkets()
                  ? t('disableCollateralAsset', { symbol: collateralToken?.symbol })
                  : collateralToken?.canBeCollateral
                  ? t('dismiss')
                  : t('useAssetAsCollateral', { symbol: collateralToken?.symbol })}
              </ButtonLight>
            </AutoColumn>
          </AutoColumn>
        </ModalContentWrapper>
      </Modal>
      {!!suppliedAsset.length && (
        <MarketsCard style={{ marginBottom: '1rem' }}>
          <MarketsCardHeader>{t('suppliedMarkets')}</MarketsCardHeader>
          <AssetWrap>
            <AssetWrapLabels>
              <AssetLabel textAlign={'left'}>{t('asset')}</AssetLabel>
              <AssetLabel textAlign={'right'} mobileHide={true}>
                {t('APY')}
              </AssetLabel>
              <AssetLabel textAlign={'right'}>{t('assetBalance')}</AssetLabel>
              <AssetLabel textAlign={'right'}>{t('collateral')}</AssetLabel>
            </AssetWrapLabels>
            <AssetItemWrap onClick={() => setShowLendConfirmation(true)}>
              {suppliedAsset.map((item: CToken) => (
                <ItemPannel marketCToken={item} walletBalances={walletBalances} key={item?.symbol}>
                  <AssetItem
                    key={item?.symbol}
                    onClick={() => {
                      if (TokenLoadState) {
                        setLendToken(item)
                        setShowLendConfirmation(true)
                      }
                    }}
                  >
                    <AssetLogo>
                      {item.logo1 ? (
                        <DoubleAssetLogo logo0={item.logo0} logo1={item.logo1} size={24} />
                      ) : (
                        <CurrencyIcon logo0={item.logo0} style={{ marginRight: '10px' }} />
                      )}
                      <ItemWrap>
                        <SymbolWrap>{item?.symbol}</SymbolWrap>
                        <MobileWrap>{getSupplyApy(item).toFixed(2) ?? 0}%</MobileWrap>
                      </ItemWrap>
                    </AssetLogo>
                    <ItemWrap mobileHide={true}>
                      <div>{getSupplyApy(item).toFixed(2) ?? 0}%</div>
                    </ItemWrap>
                    <ItemWrap>
                      <div>${formatData(getSupplyTotalBalance([item])).toFixed(2) ?? ''}</div>
                      <ItemBottomWrap>
                        {new TokenAmount(item, item.getSupplyBalanceAmount()).toSignificant()}
                        {' ' + item?.symbol}
                      </ItemBottomWrap>
                    </ItemWrap>
                    <Switch
                      isActive={item.canBeCollateral ?? false}
                      toggle={() => {
                        if (TokenLoadState) {
                          setCollateralToken(item)
                          setIsSuppliedMarkets(true)
                          setShowCollateralConfirmation(true)
                        }
                      }}
                    />
                  </AssetItem>
                </ItemPannel>
              ))}
            </AssetItemWrap>
          </AssetWrap>
        </MarketsCard>
      )}
      <MarketsCard>
        <MarketsCardHeader>{t('supplyMarkets')}</MarketsCardHeader>
        <AssetWrap>
          <AssetWrapLabels>
            <AssetLabel textAlign={'left'}>{t('asset')}</AssetLabel>
            <AssetLabel textAlign={'right'} mobileHide={true}>
              {t('APY')}
            </AssetLabel>
            <AssetLabel textAlign={'right'}>{t('assetWallet')}</AssetLabel>
            <AssetLabel textAlign={'right'}>{t('collateral')}</AssetLabel>
          </AssetWrapLabels>
          <AssetItemWrap>
            {!!supplyAsset.length
              ? supplyAsset.map((item: CToken) => (
                  <ItemPannel marketCToken={item} walletBalances={walletBalances} key={item?.symbol}>
                    <AssetItem
                      onClick={() => {
                        if (TokenLoadState) {
                          setLendToken(item)
                          setShowLendConfirmation(true)
                        }
                      }}
                    >
                      <AssetLogo>
                        {item.logo1 ? (
                          <DoubleAssetLogo logo0={item.logo0} logo1={item.logo1} size={24} />
                        ) : (
                          <CurrencyIcon logo0={item.logo0} style={{ marginRight: '10px' }} />
                        )}
                        <ItemWrap>
                          <SymbolWrap>{item?.symbol}</SymbolWrap>
                          <MobileWrap>{getSupplyApy(item).toFixed(2) ?? 0}%</MobileWrap>
                        </ItemWrap>
                      </AssetLogo>
                      <ItemWrap mobileHide={true}>
                        <div>{getSupplyApy(item).toFixed(2) ?? 0}%</div>
                      </ItemWrap>
                      <ItemWrap>
                        {walletBalances[item.address]?.toSignificant(4) ?? '0'}
                        {' ' + item?.symbol}
                      </ItemWrap>
                      <Switch
                        isActive={item?.canBeCollateral ?? false}
                        toggle={() => {
                          if (TokenLoadState) {
                            setCollateralToken(item)
                            setIsSuppliedMarkets(false)
                            setShowCollateralConfirmation(true)
                          }
                        }}
                      />
                    </AssetItem>
                  </ItemPannel>
                ))
              : ''}
          </AssetItemWrap>
        </AssetWrap>
      </MarketsCard>
    </div>
  )
}

export default SupplyMarkets
