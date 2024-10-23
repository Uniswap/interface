// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useCurrencyInfo } from 'hooks/Tokens'
import useSelectChain from 'hooks/useSelectChain'
import {
  useCreatePositionContext,
  useCreateTxContext,
  useDepositContext,
  usePriceRangeContext,
} from 'pages/Pool/Positions/create/CreatePositionContext'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { Trans } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { useAccount } from 'wagmi'

export function CreatePositionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    positionState: { protocolVersion },
  } = useCreatePositionContext()
  const {
    derivedPriceRangeInfo: { baseAndQuoteTokens, prices, ticksAtLimit, isSorted },
  } = usePriceRangeContext()
  const {
    derivedDepositInfo: { formattedAmounts, currencyAmounts, currencyAmountsUSDValue },
  } = useDepositContext()

  const token0CurrencyInfo = useCurrencyInfo(currencyAmounts?.TOKEN0?.currency)
  const token1CurrencyInfo = useCurrencyInfo(currencyAmounts?.TOKEN1?.currency)

  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()
  const [baseCurrency, quoteCurrency] = baseAndQuoteTokens ?? [undefined, undefined]

  const formattedPrices = useMemo(() => {
    const lowerPriceFormatted = ticksAtLimit[isSorted ? 0 : 1]
      ? '0'
      : formatNumberOrString({ value: prices?.[0]?.toSignificant(), type: NumberType.TokenTx })
    const upperPriceFormatted = ticksAtLimit[isSorted ? 1 : 0]
      ? '∞'
      : formatNumberOrString({ value: prices?.[1]?.toSignificant(), type: NumberType.TokenTx })

    return [lowerPriceFormatted, upperPriceFormatted]
  }, [formatNumberOrString, isSorted, prices, ticksAtLimit])

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const dispatch = useDispatch()
  const createTxContext = useCreateTxContext()
  const account = useAccountMeta()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId

  const onFailure = () => {
    setCurrentStep(undefined)
  }

  const onSuccess = useCallback(() => {
    setSteps([])
    setCurrentStep(undefined)
    onClose()
  }, [onClose])

  const handleCreate = useCallback(() => {
    const isValidTx = isValidLiquidityTxContext(createTxContext)
    if (!account || account?.type !== AccountType.SignerMnemonic || !isValidTx) {
      return
    }
    dispatch(
      liquiditySaga.actions.trigger({
        selectChain,
        startChainId,
        account,
        liquidityTxContext: createTxContext,
        setCurrentStep,
        setSteps,
        onSuccess,
        onFailure,
      }),
    )
  }, [account, createTxContext, dispatch, selectChain, startChainId, onSuccess])

  return (
    <Modal name={ModalName.CreatePosition} padding="$none" onClose={onClose} isDismissible isModalOpen={isOpen}>
      <Flex px="$spacing8" pt="$spacing12" pb="$spacing8" gap={24}>
        <Flex px="$spacing12" gap="$spacing16">
          <GetHelpHeader
            title={
              <Text variant="subheading2" color="$neutral2">
                <Trans i18nKey="position.create.modal.header" />
              </Text>
            }
            closeModal={() => onClose()}
          />
          <Flex py="$spacing12" gap="$spacing12">
            <Flex row justifyContent="space-between">
              <Flex row gap="$gap8">
                <Text variant="heading3">{currencyAmounts?.TOKEN0?.currency?.symbol}</Text>
                <Text variant="heading3">/</Text>
                <Text variant="heading3">{currencyAmounts?.TOKEN1?.currency?.symbol}</Text>
              </Flex>
              <DoubleCurrencyLogo
                currencies={[currencyAmounts?.TOKEN0?.currency, currencyAmounts?.TOKEN1?.currency]}
                size={iconSizes.icon36}
              />
            </Flex>
            {(protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4) && (
              <Flex row>
                <Flex fill gap="$gap4">
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="common.min" />
                  </Text>
                  <Text variant="body3">{`${formattedPrices[0]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
                </Flex>
                <Flex fill gap="$gap4">
                  <Text variant="body3" color="$neutral2">
                    <Trans i18nKey="common.max" />
                  </Text>
                  <Text variant="body3">{`${formattedPrices[1]} ${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`}</Text>
                </Flex>
              </Flex>
            )}
          </Flex>
          <Flex gap="$spacing12" pb="$spacing8">
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="common.depositing" />
            </Text>
            <Flex row justifyContent="space-between">
              <Flex gap="$gap4">
                <Flex row gap="$gap8">
                  <Text variant="body1">{formattedAmounts?.TOKEN0}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: currencyAmountsUSDValue?.TOKEN0, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN0?.currency?.chainId}
                name={currencyAmounts?.TOKEN0?.currency?.name}
                symbol={currencyAmounts?.TOKEN0?.currency?.symbol}
                url={token0CurrencyInfo?.logoUrl}
              />
            </Flex>
            <Flex row justifyContent="space-between">
              <Flex gap="$gap4">
                <Flex row gap="$gap8">
                  <Text variant="body1">{formattedAmounts?.TOKEN1}</Text>
                  <Text variant="body1">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Text variant="body3" color="$neutral2">
                  {formatCurrencyAmount({ value: currencyAmountsUSDValue?.TOKEN1, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <TokenLogo
                size={iconSizes.icon36}
                chainId={currencyAmounts?.TOKEN1?.currency?.chainId}
                name={currencyAmounts?.TOKEN1?.currency?.name}
                symbol={currencyAmounts?.TOKEN1?.currency?.symbol}
                url={token1CurrencyInfo?.logoUrl}
              />
            </Flex>
          </Flex>
        </Flex>
        {currentStep ? (
          <ProgressIndicator steps={steps} currentStep={currentStep} />
        ) : (
          <Button flex={1} py="$spacing16" px="$spacing20" onPress={handleCreate}>
            <Text variant="buttonLabel1">
              <Trans i18nKey="common.button.create" />
            </Text>
          </Button>
        )}
      </Flex>
    </Modal>
  )
}
