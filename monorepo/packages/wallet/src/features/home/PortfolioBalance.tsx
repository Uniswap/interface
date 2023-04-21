import { PollingInterval } from 'wallet/src/constants/misc'
import { usePortfolioBalanceQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'

type WalletBalanceProps = {
  address: Address
}

const TempFakeButton = ({ label }: { label: string }): JSX.Element => {
  return (
    <Flex
      alignItems="center"
      backgroundColor="$accentActionSoft"
      borderRadius="$rounded16"
      flexGrow={1}
      // eslint-disable-next-line react-native/no-inline-styles
      hoverStyle={{ cursor: 'not-allowed' }}
      justifyContent="center"
      paddingHorizontal="$spacing24"
      paddingVertical="$spacing8">
      <Text color="$accentAction" fontWeight="600" variant="bodyLarge">
        {label}
      </Text>
    </Flex>
  )
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { data, loading, error } = usePortfolioBalanceQuery({
    variables: {
      owner: address,
    },
    pollInterval: PollingInterval.Slow,
  })

  const portfolioBalance = data?.portfolios?.[0]
  // const portfolioChange =
  //   portfolioBalance?.tokensTotalDenominatedValueChange?.percentage?.value
  const totalBalance = portfolioBalance?.tokensTotalDenominatedValue?.value

  return (
    <Flex gap="$spacing12" paddingHorizontal="$spacing12">
      {loading ? (
        <Text color="$textTertiary" fontWeight="600" variant="headlineLarge">
          $-,---.--
        </Text>
      ) : error ? (
        <Text color="$accentCritical" variant="bodyLarge">
          Error: {JSON.stringify(error)}
        </Text>
      ) : (
        <>
          <Flex flexDirection="row">
            <Text fontWeight="600" variant="headlineLarge">
              ${totalBalance?.toFixed(2)}
            </Text>
          </Flex>
          <Flex flexDirection="row" gap="$spacing8">
            <TempFakeButton label="Swap" />
            <TempFakeButton label="Send" />
          </Flex>
        </>
      )}
    </Flex>
  )
}
