import React, { useCallback, useContext, useState, useEffect, useMemo } from 'react'
import * as Sentry from '@sentry/react'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Currency, TokenAmount, ChainId } from '@fuseio/fuse-swap-sdk'
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
import { getBridge, getApprovalAddress, supportRecipientTransfer } from '../../utils'
import DestinationButton from '../../components/bridge/DestinationButton'
import FeeModal from '../../components/FeeModal'
import TokenMigrationModal from '../../components/TokenMigration'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import AutoSwitchNetwork from '../../components/AutoSwitchNetwork'
import AddressInputPanel from '../../components/AddressInputPanel'
import { FUSE_CHAIN } from '../../constants/chains'
import useAddChain from '../../hooks/useAddChain'
import AddTokenToMetamaskModal from '../../components/AddTokenToMetamaskModal'

export default function Bridge() {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const dispatch = useDispatch<AppDispatch>()
  const { addChain, isAddChainEnabled } = useAddChain()

  const {
    inputCurrencyId: defaultInputCurrencyId,
    sourceChain,
    amount,
    recipient: defaultRecipient
  } = useDefaultsFromURLSearch()

  const [selectedBridgeDirection, setSelectedBridgeDirection] = useState<BridgeDirection | undefined>()
  const bridgeDirection = useDetectBridgeDirection(selectedBridgeDirection)

  const [migrationCurrency, setMigrationCurrency] = useState<Currency | undefined>()

  const { independentField, typedValue, recipient } = useBridgeState()

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

  const { onFieldInput, onSelectBridgeDirection, onSelectCurrency, onSetRecipient } = useBridgeActionHandlers()

  // unsupportedBridge modal
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const [feeModalOpen, setFeeModalOpen] = useState(false)

  const [migrateModalOpen, setMigrateModalOpen] = useState(false)

  const [addTokenModalOpen, setAddTokenModalOpen] = useState(false)

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

  const { isHome, isEtheruem, isBsc } = useChain()

  const approvalAddress = getApprovalAddress(inputCurrencyId, bridgeDirection)

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], approvalAddress)

  const addTransaction = useTransactionAdder()

  const supportRecipient = useMemo(() => {
    return supportRecipientTransfer(inputCurrencyId, bridgeDirection) && !isHome
  }, [bridgeDirection, inputCurrencyId, isHome])

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
        addTransaction,
        recipient
      )

      const response = await bridge?.executeTransaction()
      if (response) {
        if (isEtheruem || isBsc) {
          await fuseApi.fund(account)
        }

        onSetRecipient('')
        updateCompletedBridgeTransfer()
        setAddTokenModalOpen(true)
      }

      onFieldInput('')
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

  // set defaults from url params

  useEffect(() => {
    onSelectCurrency(defaultInputCurrencyId)
  }, [defaultInputCurrencyId, onSelectCurrency])

  useEffect(() => {
    if (amount) onFieldInput(amount)
  }, [amount, onFieldInput])

  useEffect(() => {
    if (defaultRecipient && supportRecipient) onSetRecipient(defaultRecipient)
  }, [defaultRecipient, onSetRecipient, supportRecipient])

  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <Wrapper id="bridge-page">
          <AutoSwitchNetwork chainId={sourceChain} />
          <UnsupportedBridgeTokenModal isOpen={modalOpen} setIsOpen={setModalOpen} />
          <FeeModal isOpen={feeModalOpen} onDismiss={() => setFeeModalOpen(false)} />
          <TokenMigrationModal
            token={migrationCurrency}
            isOpen={migrateModalOpen}
            onDismiss={() => setMigrateModalOpen(false)}
            listType="Bridge"
          />
          <AddTokenToMetamaskModal
            isOpen={addTokenModalOpen}
            setIsOpen={setAddTokenModalOpen}
            currency={inputCurrency}
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
              showETH={isHome || isBsc}
              listType="Bridge"
            />
          </AutoColumn>
          {recipient && supportRecipient && (
            <AutoColumn gap="md" style={{ marginTop: '1rem' }}>
              <AddressInputPanel
                id="recipient"
                value={recipient}
                onChange={onSetRecipient}
                readOnly
                chainId={ChainId.FUSE}
              />
            </AutoColumn>
          )}
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
              isAddChainEnabled ? (
                <ButtonLight onClick={() => addChain(FUSE_CHAIN)}>Switch to Fuse</ButtonLight>
              ) : (
                <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
              )
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
                <TYPE.body fontSize={14} textAlign="center" color={theme.red1}>
                  Note: Please note that there are minimum limits to bridge the tokens back from fuse network to
                  ethereum network. This is due to the high gas fees on ethereum network.
                </TYPE.body>
                <Wrapper style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <ExtLink target="_blank" href="https://docs.fuse.io/fuseswap/bridge-fuse-erc20-tokens">
                    Learn how to bridge tokens
                  </ExtLink>
                  <ModalLink onClick={() => setFeeModalOpen(true)}>Learn about the fees</ModalLink>
                </Wrapper>
                <Wrapper style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <TYPE.body fontSize={14} textAlign="center">
                    <ExtLink target="_blank" href="https://docs.fuse.io/fuseswap/migration-tutorial">
                      Learn about token migration
                    </ExtLink>
                  </TYPE.body>
                  <TYPE.body fontSize={14}>
                    <ExtLink
                      target="_blank"
                      href="https://docs.fuse.io/fuseswap/bridge-fuse-network-less-than-greater-than-bsc"
                    >
                      Learn about BSC bridge
                    </ExtLink>
                  </TYPE.body>
                </Wrapper>
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <BridgeDetails
        inputCurrencyId={inputCurrencyId}
        inputAmount={parsedAmounts[Field.INPUT]}
        bridgeDirection={bridgeDirection}
      />
    </>
  )
}
