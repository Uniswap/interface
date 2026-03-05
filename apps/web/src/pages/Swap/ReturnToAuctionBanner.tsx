import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowBack } from 'ui/src/components/icons/ArrowBack'

const VALID_RETURN_PATH_PREFIX = '/explore/auctions/'

export function ReturnToAuctionBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const returnTo = searchParams.get('returnTo')
  const returnToLabel = searchParams.get('returnToLabel')

  // Validate the returnTo path to prevent open redirects.
  // Use URL normalization so path traversal sequences (e.g. /explore/auctions/../../../malicious) are resolved before checking.
  try {
    const url = new URL(returnTo ?? '', window.location.origin)
    if (!returnTo || !url.pathname.startsWith(VALID_RETURN_PATH_PREFIX)) {
      return null
    }
  } catch {
    return null
  }

  const handlePress = (): void => {
    navigate(returnTo)
  }

  return (
    <Flex
      row
      justifyContent="center"
      $platform-web={{ position: 'fixed' }}
      bottom={40}
      left={0}
      right={0}
      zIndex="$fixed"
      pointerEvents="box-none"
    >
      <TouchableArea onPress={handlePress}>
        <Flex
          row
          alignItems="center"
          gap="$spacing8"
          px="$spacing16"
          py="$spacing12"
          borderRadius="$rounded16"
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor="$surface3"
          shadowColor="rgba(0,0,0,0.03)"
          shadowOffset={{ width: 0, height: 1 }}
          shadowRadius={6}
        >
          <ArrowBack size="$icon.16" color="$neutral2" />
          <Text variant="body3" color="$neutral1">
            {returnToLabel ? t('toucan.swap.returnTo', { tokenName: returnToLabel }) : t('toucan.swap.returnToAuction')}
          </Text>
        </Flex>
      </TouchableArea>
    </Flex>
  )
}
