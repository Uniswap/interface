import { createContext, Fragment, FunctionComponent, useContext } from 'react'
import {
  ButtonText,
  GetProps,
  getTokenValue,
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
import type { IconProps } from 'ui/src/components/factories/createIcon'

type DeprecatedButtonSize = 'small' | 'medium' | 'large'

const ButtonNestingContext = createContext(false)

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
    opacity: 0.7,
  },

  variants: {
    size: {
      small: {
        padding: '$spacing8',
        borderRadius: '$rounded12',
        gap: '$spacing4',
      },
      medium: {
        padding: '$spacing12',
        borderRadius: '$rounded16',
        gap: '$spacing8',
      },
      large: {
        padding: '$spacing18',
        paddingVertical: '$spacing16',
        borderRadius: '$rounded20',
        gap: '$spacing12',
      },
    },

    fill: {
      true: {
        flex: 1,
      },
    },

    backgroundless: {
      true: {
        backgroundColor: 'transparent',
        hoverStyle: {
          backgroundColor: 'transparent',
          opacity: 0.9,
        },
        pressStyle: {
          backgroundColor: 'transparent',
          opacity: 0.7,
        },
      },
    },

    // TODO(WEB-6347): change variant name back to `disabled`
    isDisabled: {
      true: {
        opacity: 0.4,
        pointerEvents: 'none',
        userSelect: 'none',
      },
    },

    fadeIn: {
      true: {
        enterStyle: {
          opacity: 0,
        },
      },
    },

    fadeOut: {
      true: {
        enterStyle: {
          opacity: 0,
        },
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
  color: '$color',
  cursor: 'pointer',

  variants: {
    size: {
      micro: {
        fontSize: '$small',
        fontWeight: '$medium',
        lineHeight: '$small',
      },
      small: {
        fontSize: '$medium',
        fontWeight: '$medium',
        lineHeight: '$medium',
      },
      medium: {
        fontSize: '$large',
        fontWeight: '$medium',
        lineHeight: '$large',
      },
      large: {
        fontSize: '$large',
        fontWeight: '$medium',
        lineHeight: '$large',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})

type CustomButtonProps = GetProps<typeof CustomButtonFrame>

type IconProp = JSX.Element | FunctionComponent<IconProps> | null

export type DeprecatedButtonProps = CustomButtonProps &
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

const ButtonComponent = CustomButtonFrame.styleable<DeprecatedButtonProps>((props, ref) => {
  const { props: buttonProps } = useButton(props)
  return (
    <CustomButtonFrame
      ref={ref}
      onPressIn={undefined} // or remove this line entirely if onPressIn is not needed
      {...buttonProps}
    />
  )
})

ButtonComponent.defaultProps = {
  theme: 'primary',
}

/** @deprecated Please use `Button` from `ui/src` */
export const DeprecatedButton = withStaticProperties(ButtonComponent, {
  Text: ButtonText,
})

const buttonToIconSize: Record<DeprecatedButtonSize, SpecificTokens> = {
  small: '$icon.12',
  medium: '$icon.20',
  large: '$icon.24',
}

// we do a few things different from tamagui here, and also tamagui is deprecating useButton
// because its just too specific to maintain. we don't allow number sizes for example.

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useButton<Props extends DeprecatedButtonProps>(propsIn: Props) {
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
  const propsActive = useProps(propsIn) as unknown as DeprecatedButtonProps
  const size = propsActive.size || 'medium'
  const iconSize = getTokenValue(buttonToIconSize[size])
  const getThemedIcon = useGetThemedIcon({ size: iconSize, color })
  const [themedIcon, themedIconAfter] = [icon, iconAfter].map(getThemedIcon)

  const contents = wrapChildrenInText(
    CustomButtonText,
    // @ts-expect-error the props are alright
    propsActive,
    {
      size,
      disabled: propsActive.disabled,
      maxFontSizeMultiplier: 1.2,
    },
  )

  const inner = spacedChildren({
    separator,
    direction:
      propsActive.flexDirection === 'column' || propsActive.flexDirection === 'column-reverse'
        ? 'vertical'
        : 'horizontal',
    children: [<Fragment key="icon">{themedIcon}</Fragment>, ...contents, themedIconAfter],
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
    isNested,
    props,
  }
}
