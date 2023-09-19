import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import InfoCircleIcon from 'ui/src/assets/icons/info-circle.svg'
import { iconSizes } from 'ui/src/theme'
import { formatPercent } from 'utilities/src/format/format'

export type FeeOnTransferInfo = {
  inputTokenInfo: TokenFeeInfo
  outputTokenInfo: TokenFeeInfo
  onShowInfo: () => void
}

export type TokenFeeInfo = {
  tokenSymbol: string
  feePercentage: number
}

export function FeeOnTransferInfo({
  inputTokenInfo,
  outputTokenInfo,
  onShowInfo,
}: FeeOnTransferInfo): JSX.Element | null {
  const inputFee = inputTokenInfo.feePercentage
  const outputFee = outputTokenInfo.feePercentage
  if (!inputFee && !outputFee) {
    return null
  }

  return (
    <Flex gap="$spacing12">
      {inputFee > 0 && <FeeOnTransferInfoRow feeInfo={inputTokenInfo} onShowInfo={onShowInfo} />}
      {outputFee > 0 && <FeeOnTransferInfoRow feeInfo={outputTokenInfo} onShowInfo={onShowInfo} />}
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
  const colors = useSporeColors()

  return (
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      onPress={onShowInfo}>
      <Flex row alignItems="center" gap="$spacing1">
        <Text flex={0} variant="bodySmall">
          {t('{{ token }} fee', { token: feeInfo.tokenSymbol })}
        </Text>
        <Box ml="$spacing4">
          <InfoCircleIcon
            color={colors.neutral1.val}
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Box>
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        <Text flex={0} variant="bodySmall">
          {formatPercent(feeInfo.feePercentage)}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
