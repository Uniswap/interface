import React from 'react'
import { GenericImportForm } from 'src/features/import/GenericImportForm'
import { render, screen } from 'src/test/test-utils'

describe(GenericImportForm, () => {
  it('renders a placeholder when there is no value', async () => {
    const tree = render(
      <GenericImportForm
        errorMessage={undefined}
        placeholderLabel="seed phrase"
        value={undefined}
        onChange={() => {
          return
        }}
      />
    )

    expect(await screen.findByText('seed phrase')).toBeDefined()
    expect(tree.toJSON()).toMatchSnapshot()
  })

  it('renders a value', async () => {
    render(
      <GenericImportForm
        errorMessage={undefined}
        placeholderLabel="seed phrase"
        value="hello"
        onChange={() => {
          return
        }}
      />
    )

    expect(await screen.queryByText('seed phrase')).toBeNull()
    expect(await screen.findByDisplayValue('hello')).toBeDefined()
  })

  it('renders an error message', async () => {
    render(
      <GenericImportForm
        errorMessage="there is an error"
        placeholderLabel="seed phrase"
        value="wrong value"
        onChange={() => {
          return
        }}
      />
    )

    expect(await screen.findByText('there is an error')).toBeDefined()
  })
})
