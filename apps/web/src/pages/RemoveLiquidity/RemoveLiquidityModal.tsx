import { LiquidityModalDetailRows } from 'components/Liquidity/LiquidityModalDetailRows'
import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { LiquidityPositionInfo } from 'components/Liquidity/LiquidityPositionInfo'
import { useModalLiquidityPositionInfo } from 'components/Liquidity/utils'
import { StyledPercentInput } from 'components/PercentInput'
import { useAccount } from 'hooks/useAccount'
import { ClickablePill } from 'pages/Swap/Buy/PredefinedAmount'
import { NumericalInputMimic, NumericalInputSymbolContainer, NumericalInputWrapper } from 'pages/Swap/common/shared'
import { useMemo, useState } from 'react'
import { useCloseModal } from 'state/application/hooks'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useReduceLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useReduceLpPositionCalldataQuery'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import useResizeObserver from 'use-resize-observer'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function RemoveLiquidityModal() {
  const positionInfo = useModalLiquidityPositionInfo()
  const closeModal = useCloseModal(ModalName.RemoveLiquidity)
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const { t } = useTranslation()
  const colors = useSporeColors()
  const account = useAccount()
  const { address } = account

  const [percent, setPercent] = useState<string>('')

  const reduceCalldataQueryParams = useMemo(() => {
    if (!positionInfo?.restPosition || !address) {
      return undefined
    }
    // TODO(WEB-4920): build the params object
    return {
      walletAddress: address,
      collectAsWeth: false,
    }
  }, [address, positionInfo?.restPosition])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: reduceCalldata } = useReduceLpPositionCalldataQuery({
    params: reduceCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

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
        <LiquidityModalDetailRows currency0Amount={currency0Amount} currency1Amount={currency1Amount} />
        <Button
          size="large"
          disabled={!percent || percent === '0' || percent === ''}
          onPress={() => {
            // TODO: implement remove liquidity. use Trading API for all protocol versions
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
