import './App.css'

import { Button } from 'ui/src/components/button/Button'
import { Stack, TamaguiProvider, Text } from 'ui/src'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import config from '../../tamagui.config'
import { AppDispatch, RootState } from 'app/src/state'
import { importAccountActions } from 'app/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'app/src/features/wallet/import/types'

const hayden = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'

// NOTE(judo): could not import app dispatch from @background, react-redux
// complains about missing Provider context value.
const useAppDispatch: () => AppDispatch = useDispatch
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

function App(): JSX.Element {
  const dispatch = useAppDispatch()
  const onPress = (): void => {
    dispatch(
      importAccountActions.trigger({
        type: ImportAccountType.Address,
        address: hayden,
      })
    )
  }
  const accounts = useAppSelector((state) => state?.wallet?.accounts)

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Text>Imported accounts</Text>{' '}
      {Object.values(accounts).map((a) => a.address)}
      <Button onPress={onPress}>Import Account hayden.eth (readonly)</Button>
      <Stack backgroundColor="$background0" flex={1} height={200} width={300}>
        <Stack
          backgroundColor="$background3"
          borderRadius="$rounded12"
          flex={1}>
          <Stack flex={1} justifyContent="space-between">
            <Stack>
              <Text color="$textPrimary" fontSize={32}>
                Account
              </Text>
              <Text color="$textPrimary">corncobs.eth</Text>
            </Stack>
            <Stack
              alignContent="flex-end"
              alignItems="flex-end"
              justifyContent="flex-end">
              <Text
                backgroundColor="$accentBranded"
                borderRadius="$rounded12"
                padding="$spacing8">
                More
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </TamaguiProvider>
  )
}

export default App
