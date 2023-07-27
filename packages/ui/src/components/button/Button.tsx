import { ButtonNestingContext } from '@tamagui/web' // TODO export from tamagui
import { FunctionComponent, useContext } from 'react'
import {
  ButtonText,
  GetProps,
  getTokenValue,
  getVariableValue,
  spacedChildren,
  SpecificTokens,
  styled,
  Text,
  TextParentStyles,
  useGetThemedIcon,
  useProps,
  withStaticProperties,
  wrapChildrenInText,
  XStack,
} from 'tamagui'

type ButtonSize = 'small' | 'medium' | 'large'

const CustomButtonFrame = styled(XStack, {
  name: 'Button',
  tag: 'button',
  // instead of setting border: 0 when no border, make it 1px but transparent, so the
  // size or alignment of a button won't change unexpectedly between variants
  borderWidth: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$background',
  borderColor: '$borderColor',
  cursor: 'pointer',
  height: 'auto',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },

  pressStyle: {
    backgroundColor: '$backgroundPress',
  },

  variants: {
    size: {
      small: {
        padding: '$spacing8',
        borderRadius: '$rounded8',
      },
      medium: {
        padding: '$spacing12',
        borderRadius: '$rounded16',
      },
      large: {
        padding: '$spacing16',
        paddingVertical: '$spacing16',
        borderRadius: '$rounded20',
      },
    },

    disabled: {
      true: {
        opacity: 0.4,
        backgroundColor: '$background3',
        pointerEvents: 'none',
        userSelect: 'none',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})

const CustomButtonText = styled(Text, {
  tag: 'span',
  fontFamily: '$button',

  variants: {
    size: {
      micro: {
        fontSize: '$micro',
        lineHeight: '$micro',
      },
      medium: {
        fontSize: '$medium',
        lineHeight: '$medium',
      },
      small: {
        fontSize: '$small',
        lineHeight: '$small',
      },
      large: {
        fontSize: '$large',
        lineHeight: '$large',
      },
    },

    disabled: {
      true: {
        color: '$textTertiary',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})

type CustomButtonProps = GetProps<typeof CustomButtonFrame>

type ButtonIconProps = { color?: string; size?: number }
type IconProp = JSX.Element | FunctionComponent<ButtonIconProps> | null

export type ButtonProps = CustomButtonProps &
  TextParentStyles & {
    /**
     * add icon before, passes color and size automatically if Component
     */
    icon?: IconProp
    /**
     * add icon after, passes color and size automatically if Component
     */
    iconAfter?: IconProp
    /**
     * make the spacing elements flex
     */
    spaceFlex?: number | boolean
    /**
     * remove default styles
     */
    unstyled?: boolean
  }

const ButtonComponent = CustomButtonFrame.styleable<ButtonProps>((props, ref) => {
  const { props: buttonProps } = useButton(props)
  return <CustomButtonFrame ref={ref} {...buttonProps} />
})

export const Button = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
})

const buttonToIconSize: Record<ButtonSize, SpecificTokens> = {
  small: '$icon.12',
  medium: '$icon.16',
  large: '$icon.20',
}

// we do a few things different from tamagui here, and also tamagui is deprecating useButton
// because its just too specific to maintain. we don't allow number sizes for example.

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useButton<Props extends ButtonProps>(propsIn: Props) {
  // careful not to desctructure and re-order props, order is important
  const {
    // not button frame props
    icon,
    iconAfter,
    separator,

    color,

    ...buttonFrameProps
  } = propsIn

  const isNested = useContext(ButtonNestingContext)
  const propsActive = useProps(propsIn) as unknown as ButtonProps
  const size = propsActive.size || 'medium'
  const iconSize = getTokenValue(buttonToIconSize[size])
  const getThemedIcon = useGetThemedIcon({ size: iconSize, color })
  const [themedIcon, themedIconAfter] = [icon, iconAfter].map(getThemedIcon)
  const spaceSize = propsActive.space ?? getVariableValue(iconSize)

  const contents = wrapChildrenInText(
    CustomButtonText,
    // @ts-expect-error the props are alright
    propsActive,
    {
      size,
      disabled: propsActive.disabled,
    }
  )

  const inner = spacedChildren({
    // a bit arbitrary but scaling to font size is necessary so long as button does
    space: spaceSize,
    separator,
    direction:
      propsActive.flexDirection === 'column' || propsActive.flexDirection === 'column-reverse'
        ? 'vertical'
        : 'horizontal',
    children: [themedIcon, ...contents, themedIconAfter],
  })

  // fixes SSR issue + DOM nesting issue of not allowing button in button
  const tag = isNested
    ? 'span'
    : // defaults to <a /> when accessibilityRole = link
    // see https://github.com/tamagui/tamagui/issues/505
    propsIn.accessibilityRole === 'link'
    ? 'a'
    : undefined

  const props = {
    ...(propsActive.disabled && {
      // in rnw - false still has keyboard tabIndex, undefined = not actually focusable
      focusable: undefined,
      // even with tabIndex unset, it will keep focusStyle on web so disable it here
      focusStyle: {
        borderColor: '$background',
      },
    }),
    ...(tag && {
      tag,
    }),
    ...buttonFrameProps,
    children: <ButtonNestingContext.Provider value={true}>{inner}</ButtonNestingContext.Provider>,
  } as Props

  return {
    spaceSize,
    isNested,
    props,
  }
}
