import { render } from '@testing-library/react-native'
import { Provider } from 'app/src/provider/tamagui-provider'
import { ReactElement } from 'react'

export function renderUi(ui: ReactElement): any {
  return render(ui, { wrapper: Provider })
}
