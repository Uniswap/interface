import { Trans, t } from '@lingui/macro'
import { darken, rgba } from 'polished'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { DefaultTheme, css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Deposit from 'components/Icons/Deposit'
import Harvest from 'components/Icons/Harvest'
import Withdraw from 'components/Icons/Withdraw'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { MEDIA_WIDTHS } from 'theme'

export enum ButtonColorScheme {
  Red = 'Red',
  Gray = 'Gray',
  Green = 'Green',
  APR = 'APR',
}

const BtnLight = styled(ButtonLight)`
  padding: 8px 12px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px;
  `};
`

const generateButtonOutlinedCSS = (theme: DefaultTheme, colorScheme?: ButtonColorScheme, disabled?: boolean) => {
  const colorMap = {
    [ButtonColorScheme.Red]: theme.red,
    [ButtonColorScheme.Gray]: theme.subText,
    [ButtonColorScheme.Green]: theme.primary,
    [ButtonColorScheme.APR]: theme.apr,
  }
  colorScheme ||= ButtonColorScheme.Green
  const mainColor = colorMap[colorScheme]

  return css`
    border-color: ${mainColor};
    background-color: ${`${mainColor}20`};
    color: ${mainColor};

    &:hover {
      background-color: ${!disabled ? darken(0.03, `${mainColor}20`) : undefined};
    }

    &:active {
      box-shadow: ${!disabled ? `0 0 0 1pt ${darken(0.05, `${mainColor}20`)}` : undefined};
      background-color: ${!disabled ? darken(0.05, `${mainColor}20`) : undefined};
    }
  `
}

const ButtonOutlined = styled(ButtonLight)<{ colorScheme?: ButtonColorScheme }>`
  padding: 8px 12px;
  width: fit-content;
  white-space: nowrap;

  ${({ theme, colorScheme, disabled }) => generateButtonOutlinedCSS(theme, colorScheme, disabled)}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px;
  `};
`

export const DepositButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  disabled,
  onClick,
  style,
  ...others
}) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const renderButton = () => {
    return (
      <ButtonOutlined
        disabled={disabled}
        onClick={onClick}
        style={{
          width: upToExtraSmall ? '100%' : 'max-content',
          height: '38px',
          padding: '12px',
          ...style,
        }}
        {...others}
      >
        <Deposit width={20} height={20} />
        <Text fontSize="14px" marginLeft="4px">
          <Trans>Deposit</Trans>
        </Text>
      </ButtonOutlined>
    )
  }

  if (disabled) {
    return renderButton()
  }

  return (
    <MouseoverTooltipDesktopOnly
      text={t`Deposit your liquidity positions (i.e. your NFT tokens) into the farming contract. Then stake them into the farm`}
      style={{ flex: 1 }}
    >
      {renderButton()}
    </MouseoverTooltipDesktopOnly>
  )
}

export const WithdrawButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  disabled,
  onClick,
  style,
  ...others
}) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const renderButton = () => {
    return (
      <ButtonOutlined
        colorScheme={ButtonColorScheme.Red}
        onClick={onClick}
        disabled={disabled}
        style={{
          width: upToExtraSmall ? '100%' : 'max-content',
          height: '38px',
          padding: '12px',
          ...style,
        }}
        {...others}
      >
        <Withdraw width={20} height={20} />
        <Text fontSize="14px" marginLeft="4px">
          <Trans>Withdraw</Trans>
        </Text>
      </ButtonOutlined>
    )
  }

  if (disabled) {
    return renderButton()
  }

  return (
    <MouseoverTooltipDesktopOnly
      text={t`Withdraw your liquidity positions (i.e. your NFT tokens) from the farming contract`}
      style={{ flex: 1 }}
    >
      {renderButton()}
    </MouseoverTooltipDesktopOnly>
  )
}

export const HarvestAllButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  disabled,
  onClick,
  style,
  ...others
}) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <ButtonPrimary
      onClick={onClick}
      disabled={disabled}
      style={{
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.16)',
        whiteSpace: 'nowrap',
        width: upToExtraSmall ? '100%' : 'max-content',
        height: '38px',
        ...style,
      }}
      {...others}
    >
      <Harvest width={20} height={20} />
      <Text fontSize="14px" marginLeft="4px">
        <Trans>Harvest All</Trans>
      </Text>
    </ButtonPrimary>
  )
}

export const ConnectWalletButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  onClick,
  style,
  ...others
}) => {
  return (
    <BtnLight style={{ flex: 1, height: '38px', padding: '8px 16px' }} onClick={onClick} {...others}>
      <Trans>Connect Wallet</Trans>
    </BtnLight>
  )
}

const generateActionButtonCSS = (theme: DefaultTheme, colorScheme?: ButtonColorScheme, disabled?: boolean) => {
  const colorMap = {
    [ButtonColorScheme.Red]: theme.red,
    [ButtonColorScheme.Gray]: theme.subText,
    [ButtonColorScheme.Green]: theme.primary,
    [ButtonColorScheme.APR]: theme.apr,
  }
  colorScheme ||= ButtonColorScheme.Green
  const mainColor = colorMap[colorScheme]

  return css`
    background-color: ${`${mainColor}20`};
    color: ${mainColor};

    &:hover {
      background-color: ${!disabled ? darken(0.03, `${mainColor}20`) : undefined};
    }

    &:active {
      box-shadow: ${!disabled ? `0 0 0 1pt ${darken(0.05, `${mainColor}20`)}` : undefined};
      background-color: ${!disabled ? darken(0.05, `${mainColor}20`) : undefined};
    }
  `
}

export const MinimalActionButton = styled(ButtonLight)<{ colorScheme?: ButtonColorScheme }>`
  background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;

  ${({ theme, colorScheme, disabled }) => generateActionButtonCSS(theme, colorScheme, disabled)}

  :disabled {
    background: ${({ theme }) => theme.buttonGray};
    cursor: not-allowed;
  }
`

export const ForceWithdrawButton: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
  onClick,
  style,
  ...others
}) => {
  const mergedStyle = {
    padding: '8px',
    ...style,
  }

  return (
    <ButtonOutlined colorScheme={ButtonColorScheme.Red} style={mergedStyle} onClick={onClick} {...others}>
      <Withdraw width={20} height={20} />
      <Text fontSize="14px" marginLeft="4px">
        <Trans>Force Withdraw</Trans>
      </Text>
    </ButtonOutlined>
  )
}
