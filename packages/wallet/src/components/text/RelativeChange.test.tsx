import renderer from 'react-test-renderer'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'
import { RelativeChange } from './RelativeChange'

it('renders a relative change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange change={12} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders with absolute change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange absoluteChange={100} change={12} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})
