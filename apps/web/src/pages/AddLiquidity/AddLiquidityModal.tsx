import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { AddLiquidityContextProvider, useAddLiquidityContext } from 'components/addLiquidity/AddLiquidityContext'
import { InputForm } from 'components/addLiquidity/InputForm'
import { useCloseModal } from 'state/application/hooks'
import { PositionField } from 'types/position'
import { Button, Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTranslation } from 'uniswap/src/i18n'

function AddLiquidityModalInner() {
  const { t } = useTranslation()
  const onClose = useCloseModal(ModalName.AddLiquidity)

  const { addLiquidityState, derivedAddLiquidityInfo, setAddLiquidityState } = useAddLiquidityContext()
  const { formattedAmounts, currencyAmounts, currencyAmountsUSDValue, currencyBalances } = derivedAddLiquidityInfo
  const { position } = addLiquidityState

  if (!position) {
    throw new Error('AddLiquidityModal must have an initial state when opening')
  }

  const { restPosition, currency0Amount, currency1Amount } = position
  const token0 = currency0Amount.currency
  const token1 = currency1Amount.currency

  const handleUserInput = (field: PositionField, newValue: string) => {
    setAddLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: newValue,
    }))
  }

  const handleOnSetMax = (field: PositionField, amount: string) => {
    setAddLiquidityState((prev) => ({
      ...prev,
      exactField: field,
      exactAmount: amount,
    }))
  }

  return (
    <Modal name={ModalName.AddLiquidity} onClose={onClose} isDismissible>
      <Flex gap="$spacing24">
        <LiquidityModalHeader title={t('common.addLiquidity')} closeModal={onClose} />
        <LiquidityPositionInfo position={restPosition} />
      </Flex>
      <InputForm
        token0={token0}
        token1={token1}
        formattedAmounts={formattedAmounts}
        currencyAmounts={currencyAmounts}
        currencyAmountsUSDValue={currencyAmountsUSDValue}
        currencyBalances={currencyBalances}
        onUserInput={handleUserInput}
        onSetMax={handleOnSetMax}
      />
      <LiquidityModalDetailRows currency0Amount={currency0Amount} currency1Amount={currency1Amount} />
      <Button onPress={() => undefined}>{t('common.add.label')}</Button>
    </Modal>
  )
}

export function AddLiquidityModal() {
  return (
    <AddLiquidityContextProvider>
      <AddLiquidityModalInner />
    </AddLiquidityContextProvider>
  )
}
