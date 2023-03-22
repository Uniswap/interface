import { Link } from '@react-navigation/native'
import { Stack } from 'tamagui'
import { Text } from 'ui/src/components/text/Text'

import { useAppDispatch, useAppSelector } from '../../state'

export function HomeScreen(): JSX.Element {
  // const dispatch = useAppDispatch()
  const accounts = useAppSelector((state) => state?.wallet?.accounts)

  return (
    <Stack backgroundColor="$background3" padding="$spacing12">
      <Link to={{ screen: 'onboarding' }}>To Onboarding</Link>
    </Stack>
  )
}
