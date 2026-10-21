import { Flex, Text } from '@universe/mycelium'
import { UNICHAIN_LOGO } from '@universe/mycelium/assets'
import { useTranslation } from 'react-i18next'
import { Image } from 'ui/src'

const UNICHAIN_LOGO_SIZE = 14
const UNICHAIN_LOGO_BORDER_RADIUS = 4.2
const SHOW_TIME_THRESHOLD = 0.95

export function UnichainPoweredMessage({ swappedInTime }: { swappedInTime?: number }): JSX.Element | null {
  const { t } = useTranslation()

  return (
    <Flex row centered gap="$spacing6" py="$spacing4" mb="$spacing4">
      <Image
        source={UNICHAIN_LOGO}
        width={UNICHAIN_LOGO_SIZE}
        height={UNICHAIN_LOGO_SIZE}
        borderRadius={UNICHAIN_LOGO_BORDER_RADIUS}
      />
      <Text color="$accent1" variant="body4" textAlign="center">
        {swappedInTime && swappedInTime < SHOW_TIME_THRESHOLD
          ? t('swap.details.swappedIn.unichain', { time: swappedInTime })
          : t('swap.details.fasterUnichainSwaps')}
      </Text>
    </Flex>
  )
}
