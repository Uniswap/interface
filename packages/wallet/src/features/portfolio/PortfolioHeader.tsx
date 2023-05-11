import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSize } from 'ui/src/theme/tokens'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type PortfolioHeaderProps = {
  address: Address
  onLockPress?: () => void
}

export function PortfolioHeader({ address, onLockPress }: PortfolioHeaderProps): JSX.Element {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      padding="$spacing12">
      <Flex alignItems="center" flexDirection="row" gap="$spacing8" justifyContent="center">
        <Unicon address={address} size={iconSize.icon36} />
        <Text variant="subheadSmall">{sanitizeAddressText(shortenAddress(address))}</Text>
      </Flex>
      <Button theme="tertiary" onPress={onLockPress}>
        Lock
      </Button>
    </Flex>
  )
}
