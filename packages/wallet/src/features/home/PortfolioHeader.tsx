import { useDispatch } from 'react-redux'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSize } from 'ui/src/theme/tokens'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { authActions } from '../auth/saga'

type PortfolioHeaderProps = {
  address: Address
}

export function PortfolioHeader({
  address,
}: PortfolioHeaderProps): JSX.Element {
  const dispatch = useDispatch()

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      justifyContent="space-between"
      padding="$spacing12">
      <Flex
        alignItems="center"
        flexDirection="row"
        gap="$spacing8"
        justifyContent="center">
        <Unicon address={address} size={iconSize.icon36} />
        <Text variant="subheadSmall">
          {sanitizeAddressText(shortenAddress(address))}
        </Text>
      </Flex>
      <Button
        theme="tertiary"
        onPress={(): void => {
          return dispatch(authActions.reset())
        }}>
        Lock
      </Button>
    </Flex>
  )
}
