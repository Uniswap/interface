import React, { useCallback, useContext, useState, useEffect } from 'react'
import * as Sentry from '@sentry/react'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Currency, TokenAmount } from '@fuseio/fuse-swap-sdk'
import { currencyId } from '../../utils/currencyId'
import {
  useBridgeActionHandlers,
  useBridgeState,
  useDerivedBridgeInfo,
  useBridgeStatus,
  useDetectBridgeDirection,
  BridgeDirection,
  useDefaultsFromURLSearch
} from '../../state/bridge/hooks'
import { Field } from '../../state/bridge/actions'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import {
  Wrapper,
  Logo,
  ArrowWrapper,
  Loader,
  DestinationWrapper,
  ModalLink,
  ExtLink
} from '../../components/bridge/styleds'
import { ArrowDown } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { BottomGrouping } from '../../components/bridge/styleds'
import { ButtonLight, ButtonPrimary, ButtonError } from '../../components/Button'
import { DarkBlueCard } from '../../components/Card'
import ethLogo from '../../assets/images/ethereum-logo.png'
import fuseLogo from '../../assets/images/fuse-logo-wordmark.svg'
import bnbLogo from '../../assets/svg/bnb.svg'
import loader from '../../assets/svg/loader.svg'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { RowBetween } from '../../components/Row'
import { Dots } from '../Pool/styleds'
import { Text } from 'rebass'
import { useActiveWeb3React, useChain } from '../../hooks'
import { UNSUPPORTED_BRIDGE_TOKENS } from '../../constants'
import { TYPE } from '../../theme'
import UnsupportedBridgeTokenModal from '../../components/UnsupportedBridgeTokenModal'
import { useUserActionHandlers } from '../../state/user/hooks'
import fuseApi from '../../api/fuseApi'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../state'
import { useTransactionAdder } from '../../state/transactions/hooks'
import BridgeDetails from '../../components/bridge/BridgeDetails'
import { getBridge, getApprovalAddress } from '../../utils'
import DestinationButton from '../../components/bridge/DestinationButton'
import FeeModal from '../../components/FeeModal'
import TokenMigrationModal from '../../components/TokenMigration'
import { WrappedTokenInfo } from '../../state/lists/hooks'

export default function Bridge() {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const dispatch = useDispatch<AppDispatch>()

  const { inputCurrencyId: defaultInputCurrencyId } = useDefaultsFromURLSearch()

  const [selectedBridgeDirection, setSelectedBridgeDirection] = useState<BridgeDirection | undefined>()
  const bridgeDirection = useDetectBridgeDirection(selectedBridgeDirection)

  const [migrationCurrency, setMigrationCurrency] = useState<Currency | undefined>()

  const { independentField, typedValue } = useBridgeState()

  const {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError,
    bridgeTransactionStatus,
    inputCurrencyId
  } = useDerivedBridgeInfo(bridgeDirection)

  const { [Field.INPUT]: inputCurrency } = currencies

  const bridgeStatus = useBridgeStatus(bridgeTransactionStatus)

  const { updateCompletedBridgeTransfer } = useUserActionHandlers()

  const { onFieldInput, onSelectBridgeDirection, onSelectCurrency } = useBridgeActionHandlers()

  // unsupportedBridge modal
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const [feeModalOpen, setFeeModalOpen] = useState(false)

  const [migrateModalOpen, setMigrateModalOpen] = useState(false)

  const formattedAmounts = {
    [independentField]: typedValue
  }

  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.INPUT].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmountSpend(currencyBalances[field])
    }
  }, {})

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.INPUT].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
    }
  }, {})

  const toggleWalletModal = useWalletModalToggle()

  const { isHome, isEtheruem } = useChain()

  const approvalAddress = getApprovalAddress(inputCurrencyId, bridgeDirection)

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], approvalAddress)

  const addTransaction = useTransactionAdder()

  async function onTransfer() {
    if (!chainId || !library || !account || !inputCurrency?.symbol || !bridgeDirection) return

    try {
      const { [Field.INPUT]: parsedAmountInput } = parsedAmounts

      if (!parsedAmountInput || !inputCurrencyId) {
        return
      }

      const Bridge = getBridge(inputCurrencyId, bridgeDirection)

      if (!Bridge) return

      const bridge = new Bridge(
        inputCurrencyId,
        inputCurrency.symbol,
        parsedAmountInput,
        library,
        chainId,
        account,
        dispatch,
        isHome,
        addTransaction
      )

      await bridge?.executeTransaction()

      if (isEtheruem) {
        await fuseApi.fund(account)
      }

      onFieldInput('')
      updateCompletedBridgeTransfer()
    } catch (error) {
      if (error?.code !== 4001) {
        Sentry.captureException(error, {
          tags: {
            section: 'Bridge'
          }
        })

        console.log(error)
      }
    }
  }

  const handleDestinationSelect = useCallback(
    (bridgeDirection: BridgeDirection) => {
      setSelectedBridgeDirection(bridgeDirection)
      onSelectBridgeDirection(bridgeDirection)
      // reset currency on bridge selection
      onSelectCurrency('')
    },
    [onSelectBridgeDirection, onSelectCurrency]
  )

  const handleInputCurrencySelect = useCallback(
    (inputCurrency: Currency) => {
      if (inputCurrency.symbol && UNSUPPORTED_BRIDGE_TOKENS.includes(inputCurrency.symbol)) {
        setModalOpen(true)
        return
      }

      const token = inputCurrency instanceof WrappedTokenInfo ? inputCurrency : undefined

      if (token?.isDeprecated) {
        setMigrationCurrency(inputCurrency)
        setMigrateModalOpen(true)
        return
      }

      onSelectCurrency(currencyId(inputCurrency))
    },
    [onSelectCurrency]
  )

  useEffect(() => {
    onSelectCurrency(defaultInputCurrencyId)
  }, [defaultInputCurrencyId, onSelectCurrency])

  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <Wrapper id="bridge-page">
          <UnsupportedBridgeTokenModal isOpen={modalOpen} setIsOpen={setModalOpen} />
          <FeeModal isOpen={feeModalOpen} onDismiss={() => setFeeModalOpen(false)} />
          <TokenMigrationModal
            token={migrationCurrency}
            isOpen={migrateModalOpen}
            onDismiss={() => setMigrateModalOpen(false)}
            listType="Bridge"
          />
          {isHome && (
            <AutoColumn gap="md">
              <TYPE.mediumHeader fontSize="18">Select Destination</TYPE.mediumHeader>
              <DestinationWrapper>
                <DestinationButton
                  text="Ethereum"
                  logoSrc={ethLogo}
                  color={theme.ethereum}
                  selectedBridgeDirection={bridgeDirection}
                  bridgeDirection={BridgeDirection.FUSE_TO_ETH}
                  handleClick={handleDestinationSelect}
                />
                OR
                <DestinationButton
                  text="Binance"
                  logoSrc={bnbLogo}
                  color={theme.binance}
                  selectedBridgeDirection={bridgeDirection}
                  bridgeDirection={BridgeDirection.FUSE_TO_BSC}
                  handleClick={handleDestinationSelect}
                />
              </DestinationWrapper>
            </AutoColumn>
          )}
          <AutoColumn gap={'md'}>
            <TYPE.mediumHeader fontSize="18">Select Currency</TYPE.mediumHeader>
            <CurrencyInputPanel
              label="Amount"
              value={formattedAmounts[Field.INPUT]}
              onUserInput={onFieldInput}
              onCurrencySelect={handleInputCurrencySelect}
              onMax={() => {
                onFieldInput(maxAmounts[Field.INPUT]?.toExact() ?? '')
              }}
              currency={currencies[Field.INPUT]}
              showMaxButton={!atMaxAmounts[Field.INPUT]}
              id="bridge-input-token"
              showETH={isHome}
              listType="Bridge"
            />
          </AutoColumn>
          {!isHome && (
            <>
              <ColumnCenter>
                <ArrowWrapper>
                  <ArrowDown size="16" color={theme.text2} />
                </ArrowWrapper>
              </ColumnCenter>
              <DarkBlueCard>
                <Logo src={fuseLogo} alt="fuse logo" />
              </DarkBlueCard>
            </>
          )}
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approval === ApprovalState.NOT_APPROVED ||
                  approval === ApprovalState.PENDING ||
                  approval === ApprovalState.APPROVED) && (
                  <RowBetween>
                    {approval !== ApprovalState.APPROVED && (
                      <ButtonPrimary
                        onClick={approveCallback}
                        disabled={approval === ApprovalState.PENDING}
                        width="100%"
                      >
                        {approval === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.INPUT]?.symbol}</Dots>
                        ) : (
                          'Approve ' + currencies[Field.INPUT]?.symbol
                        )}
                      </ButtonPrimary>
                    )}
                  </RowBetween>
                )}
                <ButtonError
                  id="bridge-transfer-button"
                  onClick={onTransfer}
                  disabled={approval !== ApprovalState.APPROVED || !!inputError || !!bridgeStatus}
                  error={approval !== ApprovalState.APPROVED || (!bridgeStatus && !!inputError)}
                >
                  {bridgeStatus ? (
                    <>
                      <Loader src={loader} />
                      <Text fontSize={20} fontWeight={500}>
                        {bridgeStatus}
                      </Text>
                    </>
                  ) : (
                    <Text fontSize={20} fontWeight={500}>
                      {inputError ?? 'Transfer'}
                    </Text>
                  )}
                </ButtonError>
                <TYPE.body fontSize={14} textAlign="center">
                  Once you transfer your tokens using the bridge you will be gifted FUSE tokens directly to your wallet
                  which will act as network gas. This will allow you to transact freely on FuseSwap
                </TYPE.body>
                <Wrapper style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <ExtLink target="_blank" href="https://docs.fuse.io/fuseswap/bridge-fuse-erc20-tokens">
                    Learn how to bridge tokens
                  </ExtLink>
                  <ModalLink onClick={() => setFeeModalOpen(true)}>Learn about the fees</ModalLink>
                </Wrapper>
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <BridgeDetails inputCurrencyId={inputCurrencyId} inputAmount={parsedAmounts[Field.INPUT]} />
    </>
  )
}
