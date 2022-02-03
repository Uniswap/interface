import { Story } from '@storybook/react/types-6-0'
import styled from 'styled-components/macro'
import React from 'react'
import {
  ButtonConfirmed,
  ButtonDropdown,
  ButtonDropdownGrey,
  ButtonDropdownLight,
  ButtonEmpty,
  ButtonError,
  ButtonGray,
  ButtonLight,
  ButtonOutlined,
  ButtonPink,
  ButtonPrimary,
  ButtonRadio,
  ButtonSecondary,
  ButtonUNIGradient,
  ButtonWhite,
} from './index'

const Main = styled.main`
  font-size: 2em;
  margin: 3em;
  max-width: 300px;
`

export default {
  title: 'Buttons',
  argTypes: {
    disabled: { control: { type: 'boolean' } },
    onClick: { action: 'clicked' },
  },
  decorators: [
    (Component: Story) => (
      <Main>
        <Component />
      </Main>
    ),
  ],
}

const Unicorn = () => (
  <span role="img" aria-label="unicorn">
    🦄
  </span>
)

export const Radio = () => (
  <ButtonRadio>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonRadio>
)
export const DropdownLight = () => (
  <ButtonDropdownLight>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonDropdownLight>
)
export const DropdownGrey = () => (
  <ButtonDropdownGrey>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonDropdownGrey>
)
export const Dropdown = () => (
  <ButtonDropdown>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonDropdown>
)
export const Error = () => (
  <ButtonError>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonError>
)
export const Confirmed = () => (
  <ButtonConfirmed>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonConfirmed>
)
export const White = () => (
  <ButtonWhite>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonWhite>
)
export const Empty = () => (
  <ButtonEmpty>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonEmpty>
)
export const Outlined = () => (
  <ButtonOutlined>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonOutlined>
)
export const UNIGradient = () => (
  <ButtonUNIGradient>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonUNIGradient>
)
export const Pink = () => (
  <ButtonPink>
    <Unicorn />
    &nbsp;UNISWAP&nbsp;
    <Unicorn />
  </ButtonPink>
)
export const Secondary = () => <ButtonSecondary>Create Pair</ButtonSecondary>
export const Gray = () => <ButtonGray>Diffusion</ButtonGray>
export const Light = () => <ButtonLight>Connect Wallet</ButtonLight>
export const Primary = () => <ButtonPrimary>Accept</ButtonPrimary>
