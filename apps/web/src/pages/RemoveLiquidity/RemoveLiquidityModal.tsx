// eslint-disable-next-line no-restricted-imports
import { CurrencyAmount } from '@uniswap/sdk-core'
import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { StyledPercentInput } from 'components/PercentInput'
import {
  RemoveLiquidityModalContextProvider,
  useLiquidityModalContext,
} from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import {
  RemoveLiquidityTxContextProvider,
  useRemoveLiquidityTxContext,
} from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { ClickablePill } from 'pages/Swap/Buy/PredefinedAmount'
import { NumericalInputMimic, NumericalInputSymbolContainer, NumericalInputWrapper } from 'pages/Swap/common/shared'
import { useCloseModal } from 'state/application/hooks'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import useResizeObserver from 'use-resize-observer'

function RemoveLiquidityModalInner() {
  const closeModal = useCloseModal(ModalName.RemoveLiquidity)
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { percent, positionInfo, setPercent, percentInvalid } = useLiquidityModalContext()
  const { decreaseGasFeeUsd, v2ApprovalGasFeeUSD } = useRemoveLiquidityTxContext()

  if (!positionInfo) {
    throw new Error('RemoveLiquidityModal must have an initial state when opening')
  }

  const { restPosition, currency0Amount, currency1Amount } = positionInfo

  return (
    <Modal name={ModalName.AddLiquidity} onClose={closeModal} isDismissible>
      <Flex gap="$spacing24">
        <LiquidityModalHeader title={t('pool.removeLiquidity')} closeModal={closeModal} />
        {/* Position info */}
        <LiquidityPositionInfo position={restPosition} />
        {/* Percent input panel */}
        <Flex p="$padding16" gap="$gap12">
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.withdrawal.amount" />
          </Text>
          <Flex row alignItems="center" justifyContent="center" width="100%">
            <NumericalInputWrapper width="100%">
              <StyledPercentInput
                value={percent}
                onUserInput={(value: string) => {
                  setPercent(value)
                }}
                placeholder="0"
                $width={percent && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
                maxDecimals={1}
                maxLength={2}
              />
              <NumericalInputSymbolContainer showPlaceholder={!percent}>%</NumericalInputSymbolContainer>
              <NumericalInputMimic ref={hiddenObserver.ref}>{percent}</NumericalInputMimic>
            </NumericalInputWrapper>
          </Flex>
          <Flex row gap="$gap8" width="100%" justifyContent="center">
            {[25, 50, 75, 100].map((option) => {
              const active = percent === option.toString()
              const disabled = false
              return (
                <ClickablePill
                  key={option}
                  onPress={() => {
                    setPercent(option.toString())
                  }}
                  $disabled={disabled}
                  $active={active}
                  customBorderColor={colors.surface3.val}
                  foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
                  label={option < 100 ? option + '%' : t('swap.button.max')}
                  px="$spacing16"
                  textVariant="buttonLabel2"
                />
              )
            })}
          </Flex>
        </Flex>
        {/* Detail rows */}
        <LiquidityModalDetailRows
          currency0Amount={currency0Amount}
          currency1Amount={currency1Amount}
          networkCost={decreaseGasFeeUsd?.add(
            v2ApprovalGasFeeUSD ?? CurrencyAmount.fromRawAmount(decreaseGasFeeUsd.currency, 0),
          )}
        />
        <Button
          size="large"
          disabled={percentInvalid}
          onPress={() => {
            // TODO: if v2 position and needs approval, submit approval transaction
            // TODO: submit reduce position transaction
          }}
        >
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="buttonLabel1" color="$white" animation="fastHeavy">
              {t('common.button.remove')}
            </Text>
          </Flex>
        </Button>
      </Flex>
    </Modal>
  )
}

export function RemoveLiquidityModal() {
  return (
    <RemoveLiquidityModalContextProvider>
      <RemoveLiquidityTxContextProvider>
        <RemoveLiquidityModalInner />
      </RemoveLiquidityTxContextProvider>
    </RemoveLiquidityModalContextProvider>
  )
}
