import React from 'react'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useTranslation } from 'react-i18next'
import { AutoColumn } from 'components/Column'
import { DynamicSection } from 'pages/AddLiquidity/styled'
import { TYPE } from 'theme'
import { RowBetween } from 'components/Row'
import { ButtonRadioChecked } from 'components/Button'

export default function FeeSelector({
  disabled = false,
  feeAmount,
  handleFeePoolSelect,
}: {
  disabled?: boolean
  feeAmount?: FeeAmount
  handleFeePoolSelect: (feeAmount: FeeAmount) => void
}) {
  const { t } = useTranslation()

  return (
    <AutoColumn gap="16px">
      <DynamicSection gap="md" disabled={disabled}>
        <TYPE.label>{t('selectPool')}</TYPE.label>
        <RowBetween>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.LOW}
            onClick={() => handleFeePoolSelect(FeeAmount.LOW)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>0.05% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                Optimized for stable assets.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.MEDIUM}
            onClick={() => handleFeePoolSelect(FeeAmount.MEDIUM)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>0.3% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                The classic Uniswap pool fee.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
          <ButtonRadioChecked
            width="32%"
            active={feeAmount === FeeAmount.HIGH}
            onClick={() => handleFeePoolSelect(FeeAmount.HIGH)}
          >
            <AutoColumn gap="sm" justify="flex-start">
              <TYPE.label>1% {t('fee')}</TYPE.label>
              <TYPE.main fontWeight={400} fontSize="12px" textAlign="left">
                Best for volatile assets.
              </TYPE.main>
            </AutoColumn>
          </ButtonRadioChecked>
        </RowBetween>
      </DynamicSection>
    </AutoColumn>
  )
}
