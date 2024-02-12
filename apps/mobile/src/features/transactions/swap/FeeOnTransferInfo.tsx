import { Percent } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'

export type FeeOnTransferInfo = {
  inputTokenInfo: TokenFeeInfo
  outputTokenInfo: TokenFeeInfo
  onShowInfo: () => void
}

export type TokenFeeInfo = {
  tokenSymbol: string
  fee: Percent
}

export function FeeOnTransferInfo({
  inputTokenInfo,
  outputTokenInfo,
  onShowInfo,
}: FeeOnTransferInfo): JSX.Element | null {
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {inputTokenInfo.fee.greaterThan(0) && (
        <FeeOnTransferInfoRow feeInfo={inputTokenInfo} onShowInfo={onShowInfo} />
      )}
      {outputTokenInfo.fee.greaterThan(0) && (
        <FeeOnTransferInfoRow feeInfo={outputTokenInfo} onShowInfo={onShowInfo} />
      )}
    </Flex>
  )
}

function FeeOnTransferInfoRow({
  feeInfo,
  onShowInfo,
}: {
  feeInfo: TokenFeeInfo
  onShowInfo: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      onPress={onShowInfo}>
      <Flex row alignItems="center" gap="$spacing1">
        <Text color="$neutral2" flex={0} variant="body3">
          {t('{{ token }} fee', { token: feeInfo.tokenSymbol })}
        </Text>
        <Flex ml="$spacing4">
          <Icons.InfoCircleFilled color="$neutral3" size="$icon.16" />
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        <Text flex={0} variant="body3">
          {formatPercent(feeInfo.fee.toFixed(6))}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
