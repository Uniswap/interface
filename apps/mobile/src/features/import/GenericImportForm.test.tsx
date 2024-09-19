import React from 'react'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { render, screen } from 'src/test/test-utils'
import { noOpFunction } from 'utilities/src/test/utils'
import { TamaguiProvider } from 'wallet/src/providers/tamagui-provider'

describe(GenericImportForm, () => {
  it('renders a placeholder when there is no value', async () => {
    const tree = render(
      <TamaguiProvider>
        <GenericImportForm
          errorMessage={undefined}
          placeholderLabel="seed phrase"
          value={undefined}
          onChange={noOpFunction}
        />
      </TamaguiProvider>,
    )

    expect(await screen.findByText('seed phrase')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders a value', async () => {
    render(
      <TamaguiProvider>
        <GenericImportForm
          errorMessage={undefined}
          placeholderLabel="seed phrase"
          value="hello"
          onChange={noOpFunction}
        />
      </TamaguiProvider>,
    )

    expect(await screen.queryByText('seed phrase')).toBeNull()
    expect(await screen.findByDisplayValue('hello')).toBeDefined()
  })

  it('renders an error message', async () => {
    render(
      <TamaguiProvider>
        <GenericImportForm
          errorMessage="there is an error"
          placeholderLabel="seed phrase"
          value="wrong value"
          onChange={noOpFunction}
        />
      </TamaguiProvider>,
    )

    expect(await screen.findByText('there is an error')).toBeDefined()
  })
})
