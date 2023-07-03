import {
  ButtonFrame,
  ButtonProps as TamaguiButtonProps,
  ButtonText,
  GetProps,
  styled,
} from 'tamagui'

export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

export enum ButtonEmphasis {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  Detrimental = 'detrimental',
  Warning = 'warning',
}

const CustomButtonFrame = styled(ButtonFrame, {
  name: 'Button',
  tag: 'button',
  // instead of setting border: 0 when no border, make it 1px but transparent, so the
  // size or alignment of a button won't change unexpectedly between variants
  borderWidth: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: TODO: figure out why ButtonFrame inherits a hardcoded height value
  height: 'auto',

  variants: {
    buttonSize: {
      [ButtonSize.Small]: {
        padding: '$spacing8',
        borderRadius: '$rounded8',
      },
      [ButtonSize.Medium]: {
        padding: '$spacing12',
        borderRadius: '$rounded16',
      },
      [ButtonSize.Large]: {
        padding: '$spacing16',
        borderRadius: '$rounded20',
      },
    },
  } as const,

  defaultVariants: {
    buttonSize: ButtonSize.Medium,
  },
})

const CustomButtonText = styled(ButtonText, {
  name: 'ButtonText',
  tag: 'span',
})

type CustomButtonProps = GetProps<typeof CustomButtonFrame>

export type ButtonProps = TamaguiButtonProps & CustomButtonProps

// TODO: investigate why styleable doesn't pass theme down to CustomButtonText through theme={props.theme}
export const Button = CustomButtonFrame.styleable(({ children, ...props }: ButtonProps) => {
  return (
    <CustomButtonFrame {...props} opacity={props.disabled ? 0.4 : 1} theme={props.theme}>
      {/* TODO: improve styling button text based on size of button, e.g. derive weight and color from size / theme */}
      <CustomButtonText fontWeight="600">{children}</CustomButtonText>
      {props.icon ? props.icon : null}
    </CustomButtonFrame>
  )
})
