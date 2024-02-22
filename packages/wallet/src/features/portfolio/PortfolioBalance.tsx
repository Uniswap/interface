import { Flex, getTokenValue, Icons, Text, useSporeColors } from 'ui/src'
import { usePortfolioTotalValue } from 'wallet/src/features/dataApi/balances'

type WalletBalanceProps = {
  address: Address
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { data, loading, error } = usePortfolioTotalValue({ address })
  const { balanceUSD, percentChange } = data || {}

  // TODO (EXT-297): encapsulate to share better
  const change = percentChange ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const colors = useSporeColors()
  const arrowColor = isPositiveChange ? colors.statusSuccess : colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'
  return (
    <Flex>
      {loading ? (
        <Flex>
          <Text color="$neutral3" fontWeight="600" variant="heading1">
            $-,---.--
          </Text>
          <Text color="$neutral3" variant="body1">
            --%
          </Text>
        </Flex>
      ) : error ? (
        <Text color="$statusCritical" variant="body1">
          Error: {JSON.stringify(error)}
        </Text>
      ) : (
        <Flex gap="$spacing12">
          <Flex>
            <Text variant="heading1">${balanceUSD?.toFixed(2)}</Text>
            <Flex row alignItems="center">
              <Icons.ArrowChange
                color={arrowColor.get()}
                rotation={isPositiveChange ? 180 : 0}
                size={getTokenValue('$icon.20')}
              />
              <Text color="$neutral2" variant="body1">
                {/* TODO(EXT-298): add absolute change here too, share from mobile */}
                {formattedChange}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
