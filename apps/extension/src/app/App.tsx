import './App.css'

import { Button } from 'ui/src/components/button/Button'
import { Stack, TamaguiProvider, Text } from 'ui/src'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import config from '../../tamagui.config'
import { AppDispatch, RootState } from 'app/src/state'
import { importAccountActions } from 'app/src/features/wallet/import/importAccountSaga'
import { ImportAccountType } from 'app/src/features/wallet/import/types'

// NOTE(judo): could not import app dispatch from @background, react-redux
// complains about missing Provider context value.
const useAppDispatch: () => AppDispatch = useDispatch
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

function App(): JSX.Element {
  const dispatch = useAppDispatch()
  const accounts = useAppSelector((state) => state?.wallet?.accounts)

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Stack margin='$spacing8' space='$spacing16'>
        <Stack backgroundColor={'$background3'} space='$spacing8'>
          <Text>Imported accounts</Text>{' '}
          {Object.values(accounts).map((a) => <Text>{a.address}</Text>)}
        </Stack>
        <form onSubmit={(e) => {
          e.preventDefault()

          // TODO: use Tamagui
          const form = e.target as HTMLFormElement
          const formData = new FormData(form)

          dispatch(importAccountActions.trigger({
            type: ImportAccountType.Mnemonic,
            validatedMnemonic: formData.get('mnemonic')
          }))
        }}>
          {/* dummy seed phrase as default value */}
          <label>Seed phrase: <input name="mnemonic" placeholder='Enter seed phrase to import' defaultValue="stereo gain space check elbow say usual help cinnamon inquiry snap expose" />
          </label>
          <button type='submit'>Import</button>
        </form>
      </Stack>
    </TamaguiProvider>
  )
}

export default App
