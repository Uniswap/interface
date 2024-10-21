import { SupportedDex, UserAmounts, withdraw } from '@ichidao/ichi-vaults-sdk'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@ubeswap/analytics-events'
import { Currency, CurrencyAmount, Percent, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { isSupportedChain } from 'constants/chains'
import { parseUnits } from 'ethers/lib/utils'
import { useToken } from 'hooks/Tokens'
import { useIchiVaultDetails, useIchiVaults } from 'hooks/useV3Positions'
import { Trans } from 'i18n'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import { VaultPageUnsupportedContent } from 'pages/IchiVaultDetails'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { TransactionType } from 'state/transactions/types'
import { useTheme } from 'styled-components'
import { HideExtraSmall, ThemedText } from 'theme/components'
import { unwrappedToken } from 'utils/unwrappedToken'

import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { BlueCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import CurrencyLogo from '../../components/Logo/CurrencyLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import Slider from '../../components/Slider'
import { Dots } from '../../components/swap/styled'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import { Field } from '../../state/burn/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import AppBody from '../AppBody'
import { MaxButton, Wrapper } from '../Pool/styled'

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)
const DEPOSIT_GUARD_ADDRESS = '0x238394541dE407Fd494e455eF17C9D991F4FBEd8'

export default function WithdrawIchiWrapper() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <WithdrawIchi />
  } else {
    return <VaultPageUnsupportedContent />
  }
}

function WithdrawIchi() {
  const { vaultAddress } = useParams<{ vaultAddress?: string }>()
  const { account, chainId, provider } = useWeb3React()

  const { loading: userVaultsLoading, amounts: userVaults } = useIchiVaults(account)
  const { loading: vaultLoading, info: vaultDetails } = useIchiVaultDetails(vaultAddress)

  const vaultToken = useToken(vaultAddress)
  const tokenA = useToken(vaultDetails?.tokenA)
  const tokenB = useToken(vaultDetails?.tokenB)
  const vaultCurrency = vaultToken ? unwrappedToken(vaultToken) : undefined
  const currencyA = tokenA ? unwrappedToken(tokenA) : undefined
  const currencyB = tokenB ? unwrappedToken(tokenB) : undefined
  const vaultBalance = useCurrencyBalance(account, vaultCurrency)

  const userAmounts: UserAmounts | undefined = useMemo(() => {
    if (userVaultsLoading || vaultLoading) {
      return
    }
    const userVault = userVaults
      ? userVaults.find((v) => v.vaultAddress.toLowerCase() == vaultAddress?.toLowerCase())
      : undefined
    if (userVault) {
      return userVault.userAmounts
    } else {
      return {
        0: '0',
        1: '0',
        amount0: '0',
        amount1: '0',
      } as UserAmounts
    }
  }, [userVaultsLoading, vaultLoading, userVaults, vaultAddress])

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletDrawer = useToggleAccountDrawer()

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE)

  const [percentToRemove, setPercentToRemove] = useState<Percent>(new Percent(0, 100))
  const liquidityPercentChangeCallback = useCallback((val: number) => {
    setPercentToRemove(new Percent(val, 100))
  }, [])
  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(percentToRemove.toFixed(0)),
    liquidityPercentChangeCallback
  )

  const liquidityValueA =
    userAmounts && currencyA
      ? CurrencyAmount.fromRawAmount(currencyA, parseUnits(userAmounts.amount0, tokenA?.decimals).toString())
      : undefined
  const liquidityValueB =
    userAmounts && currencyB
      ? CurrencyAmount.fromRawAmount(currencyB, parseUnits(userAmounts.amount1, tokenB?.decimals).toString())
      : undefined

  const parsedAmounts: {
    [Field.LIQUIDITY_PERCENT]: Percent
    [Field.LIQUIDITY]?: CurrencyAmount<Token>
    [Field.CURRENCY_A]?: CurrencyAmount<Currency>
    [Field.CURRENCY_B]?: CurrencyAmount<Currency>
  } = {
    [Field.LIQUIDITY_PERCENT]: percentToRemove,
    [Field.LIQUIDITY]:
      vaultToken && vaultBalance && percentToRemove && percentToRemove.greaterThan('0')
        ? CurrencyAmount.fromRawAmount<Token>(vaultToken, percentToRemove.multiply(vaultBalance.quotient).quotient)
        : undefined,
    [Field.CURRENCY_A]:
      tokenA && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueA
        ? CurrencyAmount.fromRawAmount(tokenA, percentToRemove.multiply(liquidityValueA.quotient).quotient)
        : undefined,
    [Field.CURRENCY_B]:
      tokenB && percentToRemove && percentToRemove.greaterThan('0') && liquidityValueB
        ? CurrencyAmount.fromRawAmount(tokenB, percentToRemove.multiply(liquidityValueB.quotient).quotient)
        : undefined,
  }

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]: parsedAmounts[Field.LIQUIDITY]?.toSignificant(6),
    [Field.CURRENCY_A]: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6),
    [Field.CURRENCY_B]: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6),
  }

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect wallet</Trans>
  }

  if (!parsedAmounts[Field.LIQUIDITY] || !parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? <Trans>Enter an amount</Trans>
  }

  const isValid = !error

  // check whether the user has approved the router on the tokens
  const [approval, approveCallback] = useApproveCallback(vaultBalance, DEPOSIT_GUARD_ADDRESS)

  async function onAttemptToApprove() {
    if (!provider) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    await approveCallback()
  }

  // tx sending
  const addTransaction = useTransactionAdder()

  async function onRemove() {
    if (!chainId || !provider || !account || !vaultAddress) return

    const {
      [Field.CURRENCY_A]: currencyAmountA,
      [Field.CURRENCY_B]: currencyAmountB,
      [Field.LIQUIDITY]: vaultTokenAmount,
    } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB || !vaultTokenAmount) {
      throw new Error('missing currency amounts')
    }

    try {
      setAttemptingTxn(true)
      const dex = SupportedDex.Ubeswap
      const txnDetails = await withdraw(account, vaultTokenAmount.toExact(), vaultAddress, provider, dex)
      setTxHash(txnDetails.hash)
      addTransaction(txnDetails, {
        type: TransactionType.CUSTOM,
        summary: 'Withdraw single token liquidty',
      })
      await txnDetails.wait(2)
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      console.log(err)
    } finally {
      setTxHash('')
      setAttemptingTxn(false)
      setShowConfirm(false)
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap="md" style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={535}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size="24px" />
            <Text fontSize={24} fontWeight={535} style={{ marginLeft: '10px' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.neutral2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={535}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size="24px" />
            <Text fontSize={24} fontWeight={535} style={{ marginLeft: '10px' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
        </RowBetween>

        <ThemedText.DeprecatedItalic fontSize={12} color={theme.neutral2} textAlign="left" padding="12px 0 0 0">
          <Trans>
            Output is estimated. If the price changes by more than {{ allowed: allowedSlippage.toSignificant(4) }}% your
            transaction will revert.
          </Trans>
        </ThemedText.DeprecatedItalic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        <RowBetween>
          <Text color={theme.neutral2} fontWeight={535} fontSize={16}>
            <Trans>Vault Tokens Burned</Trans>
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={535} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED)} onClick={onRemove}>
          <Text fontWeight={535} fontSize={20}>
            <Trans>Confirm</Trans>
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const pendingText = (
    <Trans>
      Removing {{ amtA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) }} {{ symA: currencyA?.symbol }} and
      {{ amtB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) }} {{ symB: currencyB?.symbol }}
    </Trans>
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      setInnerLiquidityPercentage(0)
    }
    setTxHash('')
  }, [setInnerLiquidityPercentage, txHash])

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={false} adding={false} autoSlippage={DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            reviewContent={() => (
              <ConfirmationModalContent
                title={<Trans>You will receive</Trans>}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <ThemedText.DeprecatedLabel display="flex" style={{ marginRight: '12px' }}>
                  <Trans>Single sided vault</Trans>
                </ThemedText.DeprecatedLabel>
              </RowFixed>
              <HideExtraSmall>
                <ThemedText.SubHeaderSmall>
                  powered by{' '}
                  <img style={{ width: '50px', verticalAlign: 'middle' }} src="/images/logos/ichi_logo.svg" />
                </ThemedText.SubHeaderSmall>
              </HideExtraSmall>
            </RowBetween>
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                  <Trans>
                    <b>Tip:</b> You are removing liquidity from single sided vault that is managed by ICHI Finance.
                  </Trans>
                </ThemedText.DeprecatedLink>
              </AutoColumn>
            </BlueCard>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <Text fontWeight={535}>
                    <Trans>Withdraw amount</Trans>
                  </Text>
                </RowBetween>
                <Row style={{ alignItems: 'flex-end' }}>
                  <Text fontSize={72} fontWeight={535}>
                    {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                  </Text>
                </Row>

                <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                <RowBetween>
                  <MaxButton onClick={() => setInnerLiquidityPercentage(25)} width="20%">
                    25%
                  </MaxButton>
                  <MaxButton onClick={() => setInnerLiquidityPercentage(50)} width="20%">
                    50%
                  </MaxButton>
                  <MaxButton onClick={() => setInnerLiquidityPercentage(75)} width="20%">
                    75%
                  </MaxButton>
                  <MaxButton onClick={() => setInnerLiquidityPercentage(100)} width="20%">
                    Max
                  </MaxButton>
                </RowBetween>
              </AutoColumn>
            </LightCard>

            <ColumnCenter>
              <ArrowDown size="16" color={theme.neutral2} />
            </ColumnCenter>
            <LightCard>
              <AutoColumn gap="10px">
                <RowBetween>
                  <Text fontSize={24} fontWeight={535}>
                    {formattedAmounts[Field.CURRENCY_A] || '-'}
                  </Text>
                  <RowFixed>
                    <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={535} id="remove-liquidity-tokena-symbol">
                      {currencyA?.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <Text fontSize={24} fontWeight={535}>
                    {formattedAmounts[Field.CURRENCY_B] || '-'}
                  </Text>
                  <RowFixed>
                    <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={535} id="remove-liquidity-tokenb-symbol">
                      {currencyB?.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
              </AutoColumn>
            </LightCard>

            <div style={{ position: 'relative' }}>
              {!account ? (
                <TraceEvent
                  events={[BrowserEvent.onClick]}
                  name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                  properties={{ received_swap_quote: false }}
                  element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                >
                  <ButtonLight onClick={toggleWalletDrawer}>
                    <Trans>Connect wallet</Trans>
                  </ButtonLight>
                </TraceEvent>
              ) : (
                <RowBetween>
                  <ButtonConfirmed
                    onClick={onAttemptToApprove}
                    confirmed={approval === ApprovalState.APPROVED}
                    disabled={approval !== ApprovalState.NOT_APPROVED}
                    mr="0.5rem"
                    fontWeight={535}
                    fontSize={16}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <Dots>
                        <Trans>Approving</Trans>
                      </Dots>
                    ) : approval === ApprovalState.APPROVED ? (
                      <Trans>Approved</Trans>
                    ) : (
                      <Trans>Approve</Trans>
                    )}
                  </ButtonConfirmed>
                  <ButtonError
                    onClick={() => {
                      setShowConfirm(true)
                    }}
                    disabled={!isValid || approval !== ApprovalState.APPROVED}
                    error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                  >
                    <Text fontSize={16} fontWeight={535}>
                      {error || <Trans>Remove</Trans>}
                    </Text>
                  </ButtonError>
                </RowBetween>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
      </AppBody>
    </>
  )
}
