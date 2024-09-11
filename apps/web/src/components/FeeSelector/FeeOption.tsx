import { FeeAmount } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/Column'
import { FeeTierPercentageBadge } from 'components/FeeSelector/FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL } from 'components/FeeSelector/shared'
import { useFeeTierDistribution } from 'hooks/useFeeTierDistribution'
import { PoolState } from 'hooks/usePools'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components'
import { Flex, RadioButton } from 'ui/src'
import { useFormatter } from 'utils/formatNumbers'

const ResponsiveText = styled(ThemedText.DeprecatedLabel)`
  line-height: 16px;
  font-size: 14px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    font-size: 12px;
    line-height: 12px;
  `};
`

interface FeeOptionProps {
  feeAmount: FeeAmount
  selected: boolean
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
  onClick: () => void
}

export function FeeOption({ feeAmount, selected, poolState, distributions, onClick }: FeeOptionProps) {
  const { formatDelta } = useFormatter()

  return (
    <Flex
      alignItems="center"
      py="$padding12"
      px="$padding8"
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      borderColor={selected ? '$accent1' : '$surface3'}
      focusStyle={{
        shadowColor: '$surface3',
        shadowRadius: '$spacing1',
      }}
      pressStyle={{
        shadowColor: '$surface3',
        shadowRadius: '$spacing1',
      }}
      hoverStyle={{
        shadowColor: '$neutral3',
        shadowRadius: '$spacing1',
      }}
      disabledStyle={{
        opacity: 0.5,
        cursor: 'auto',
      }}
    >
      <RadioButton
        position="absolute"
        top="$spacing8"
        right="$spacing8"
        value={feeAmount.toString()}
        onPress={onClick}
        variant="branded"
      />
      <AutoColumn gap="sm" justify="flex-start">
        <AutoColumn justify="flex-start" gap="6px">
          <ResponsiveText>{formatDelta(parseFloat(FEE_AMOUNT_DETAIL[feeAmount].label))}</ResponsiveText>
          <ThemedText.DeprecatedMain fontWeight={485} fontSize="12px" textAlign="left">
            {FEE_AMOUNT_DETAIL[feeAmount].description}
          </ThemedText.DeprecatedMain>
        </AutoColumn>

        {distributions && (
          <FeeTierPercentageBadge distributions={distributions} feeAmount={feeAmount} poolState={poolState} />
        )}
      </AutoColumn>
    </Flex>
  )
}
