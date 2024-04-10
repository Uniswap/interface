import { Flex, Icons, Shine, Skeleton, Text, isWeb, useSporeColors } from 'ui/src'
import { isWarmLoadingStatus } from 'wallet/src/data/utils'
import { usePortfolioTotalValue } from 'wallet/src/features/dataApi/balances'
type WalletBalanceProps = {
  address: Address
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { data, loading, error, networkStatus } = usePortfolioTotalValue({ address })
  const { balanceUSD, percentChange } = data || {}

  // TODO (EXT-297): encapsulate to share better
  const change = percentChange ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const colors = useSporeColors()
  const arrowColor = isPositiveChange ? colors.statusSuccess : colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'
  return (
    <Flex>
      {!data && loading ? (
        <Flex>
          <Skeleton>
            <Text
              loading="no-shimmer"
              loadingPlaceholderText="$-,---.--"
              numberOfLines={1}
              variant={isWeb ? 'heading2' : 'heading1'}
            />
          </Skeleton>

          <Text
            loading="no-shimmer"
            loadingPlaceholderText="--%"
            numberOfLines={1}
            variant="body1"
          />
        </Flex>
      ) : error ? (
        <Text color="$statusCritical" variant="body1">
          {/* TODO(EXT-626): add proper error state */}
          Error: {JSON.stringify(error)}
        </Text>
      ) : (
        <Flex gap="$spacing12">
          <Shine disabled={!isWarmLoadingStatus(networkStatus)}>
            <Flex>
              <Text variant={isWeb ? 'heading2' : 'heading1'}>${balanceUSD?.toFixed(2)}</Text>
              <Flex row alignItems="center">
                <Icons.ArrowChange
                  color={arrowColor.get()}
                  rotation={isPositiveChange ? 180 : 0}
                  size={isWeb ? '$icon.16' : '$icon.20'}
                />
                <Text color="$neutral2" variant={isWeb ? 'body2' : 'body1'}>
                  {/* TODO(EXT-298): add absolute change here too, share from mobile */}
                  {formattedChange}
                </Text>
              </Flex>
            </Flex>
          </Shine>
        </Flex>
      )}
    </Flex>
  )
}
