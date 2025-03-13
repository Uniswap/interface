import type { Meta, StoryObj } from '@storybook/react'
import { expect } from '@storybook/test'
import { userEvent, within } from '@storybook/testing-library'
import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import { Anchor, ScrollView, Spacer, XStack } from 'tamagui'
import { Button } from 'ui/src/components/buttons/Button/Button'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { Faceid, Heart } from 'ui/src/components/icons'
import { Flex, Separator } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { colorsLight } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { hexToRGBString } from 'utilities/src/theme/colors'

const meta = {
  title: 'Spore/buttons/Button',
  component: Button,
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const RowOfButtons = (props: ButtonProps): JSX.Element => (
  <XStack justifyContent="space-between" flexWrap="wrap" gap="$gap12">
    <Button variant="default" id="default" {...props}>
      Default
    </Button>
    <Button variant="branded" id="branded" {...props}>
      Branded
    </Button>
    <Button variant="critical" id="critical" {...props}>
      Critical
    </Button>
  </XStack>
)

const SectionHeader = ({ title }: { title: string }): JSX.Element => (
  <>
    <Text variant="heading3">{title}</Text>
    <Spacer size="$spacing16" />
  </>
)

const SectionSubHeader = ({ title }: { title: string }): JSX.Element => (
  <>
    <Text variant="subheading1">{title}</Text>
    <Spacer size="$spacing16" />
  </>
)

const SectionSeparator = (): JSX.Element => (
  <>
    <Spacer size="$spacing16" />
    <Separator />
    <Spacer size="$spacing16" />
  </>
)

export const All: Story = {
  render: (): JSX.Element => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} px="$padding16">
        <SectionHeader title="Overview" />
        <Text variant="body1">
          Button is our primary button component, mirrored with the Button from Spore Design System on Figma.
        </Text>
        <Spacer size="$spacing8" />
        <Flex row>
          <Anchor
            href="https://www.figma.com/design/5j5YUUMWbrPIe8DMK9oyaC/%F0%9F%8D%84-Spore-Library?node-id=17556-18224&m=dev"
            target="_blank"
          >
            <Text color="$blueVibrant">Go to Figma</Text>
          </Anchor>
        </Flex>
        <SectionSeparator />
        <SectionHeader title="The Default" />
        <Flex row>
          <Button>No Props</Button>
        </Flex>

        <SectionSeparator />
        <SectionHeader title="Variants" />
        <RowOfButtons size="large" />

        <SectionSeparator />

        <SectionHeader title="Emphasis" />
        <SectionSubHeader title="Primary" />
        <RowOfButtons emphasis="primary" />

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Secondary" />
        <RowOfButtons emphasis="secondary" />

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Tertiary" />
        <RowOfButtons emphasis="tertiary" />

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Text-Only" />
        <RowOfButtons emphasis="text-only" />

        <SectionSeparator />

        <SectionHeader title="Size" />

        <SectionSubHeader title="XXSmall" />
        <RowOfButtons size="xxsmall" />
        <Spacer size="$spacing16" />

        <SectionSubHeader title="XSmall" />
        <RowOfButtons size="xsmall" />
        <Spacer size="$spacing16" />

        <SectionSubHeader title="Small" />
        <RowOfButtons size="small" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Medium" />
        <RowOfButtons size="medium" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Large" />
        <RowOfButtons size="large" />

        <SectionSeparator />

        <SectionHeader title="Icon Position" />
        <SectionSubHeader title="Before" />

        <RowOfButtons emphasis="secondary" size="small" icon={<Faceid />} iconPosition="before" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="After" />
        <RowOfButtons size="small" icon={<Heart />} iconPosition="after" />

        <SectionSeparator />

        <SectionHeader title="Custom Colors" />
        <SectionSubHeader title="Background" />
        <Flex row>
          <Button backgroundColor="#24a47c">USDT</Button>
        </Flex>

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Text" />
        <Flex row>
          <Button>
            <Button.Text color="$statusCritical">Custom Color Text</Button.Text>
          </Button>
        </Flex>

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Icon" />
        <Flex row>
          <Button icon={<Faceid color="$statusCritical" />}>Custom Color Icon</Button>
        </Flex>

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Text & Icon" />
        <Flex row>
          <Button icon={<Faceid color="$statusCritical" />}>
            <Button.Text color="$statusSuccess">Custom Color Text & Icon</Button.Text>
          </Button>
        </Flex>

        <SectionSeparator />

        <SectionHeader title="Loading" />
        <RowOfButtons loading size="large" />

        <SectionSeparator />

        <SectionHeader title="Disabled" />
        <RowOfButtons isDisabled />
      </ScrollView>
    )
  },
}

const icons = {
  Faceid: <Faceid />,
  Heart: <Heart />,
}

const argTypes = {
  variant: {
    control: 'select',
    options: ['default', 'branded', 'critical'] satisfies ButtonProps['variant'][],
  },
  size: {
    control: 'select',
    options: ['xxsmall', 'xsmall', 'small', 'medium', 'large'] satisfies ButtonProps['size'][],
  },
  emphasis: {
    control: 'select',
    options: ['primary', 'secondary', 'tertiary', 'text-only'] satisfies ButtonProps['emphasis'][],
  },
  isDisabled: {
    control: 'boolean',
  },
  loading: {
    control: 'boolean',
  },
  iconPosition: {
    control: 'select',
    options: ['before', 'after'] satisfies ButtonProps['iconPosition'][],
  },
  icon: {
    options: Object.keys(icons),
    mapping: icons,
    control: {
      type: 'select',
      labels: {
        Faceid: 'Faceid',
        Heart: 'Heart',
      },
    },
  },
} as const

const args = {
  variant: 'default',
  size: 'large',
  emphasis: 'primary',
  isDisabled: false,
  loading: false,
  children: 'Customize Me',
  fill: true,
  alignSelf: 'center',
} as const

const variants = ['default', 'branded', 'critical'] satisfies ButtonProps['variant'][]
const emphases = ['primary', 'secondary', 'tertiary'] satisfies ButtonProps['emphasis'][]

// Use in tests for 'State - Focused' and 'State - Pressed'
// We're directly referencing the `colorsLight` object here and in `backgroundColorsForStates` because if we use `getToken`, the tamagui config may not yet be available
const borderColorsForStates = [
  hexToRGBString(colorsLight.neutral3Hovered),
  hexToRGBString(colorsLight.neutral3Hovered),
  hexToRGBString(colorsLight.neutral3Hovered),
  hexToRGBString(colorsLight.accent1Hovered),
  hexToRGBString(colorsLight.accent1Hovered),
  hexToRGBString(colorsLight.accent1Hovered),
  hexToRGBString(colorsLight.statusCriticalHovered),
  hexToRGBString(colorsLight.statusCriticalHovered),
  hexToRGBString(colorsLight.statusCriticalHovered),
] satisfies string[]

const backgroundColorsForStates = [
  hexToRGBString(colorsLight.black),
  'rgba(34, 34, 34, 0.09)',
  hexToRGBString(colorsLight.white),
  hexToRGBString(colorsLight.accent1Hovered),
  hexToRGBString(colorsLight.accent2Hovered),
  hexToRGBString(colorsLight.white),
  hexToRGBString(colorsLight.statusCriticalHovered),
  hexToRGBString(colorsLight.statusCritical2Hovered),
  hexToRGBString(colorsLight.white),
] satisfies string[]

const VariantEmphasisGrid = (props: Partial<ButtonProps>): JSX.Element => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} px="$padding16" gap="$spacing24">
      {variants.map((variant) => (
        <Flex key={variant} gap="$spacing16">
          <Text>{variant}</Text>
          <Flex gap="$spacing8">
            {emphases.map((emphasis) => (
              <Button
                {...props}
                key={`${variant}-${emphasis}`}
                variant={variant}
                emphasis={emphasis}
                id={`${variant}-${emphasis}`}
              >
                {`${variant} ${emphasis}`}
              </Button>
            ))}
          </Flex>
          <Spacer size="$spacing16" />
        </Flex>
      ))}
    </ScrollView>
  )
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
export const ChangingLoadingState: Story = {
  name: 'State - Loading',
  play: async ({ canvasElement }) => {
    // Set loading to true after 1 second
    const canvas = within(canvasElement)
    const [toggleButton, loadingButton] = canvas.getAllByRole('button')

    if (!toggleButton || !loadingButton) {
      throw new Error('No toggle button or loading button found')
    }

    await expect(loadingButton).toBeEnabled()
    await expect(loadingButton).toHaveTextContent('Not Loading')

    await sleep(1000)

    await userEvent.click(toggleButton)

    await expect(loadingButton).toBeDisabled()
    await expect(loadingButton).toHaveTextContent('Loading')
    await expect(loadingButton).toHaveAttribute('aria-disabled', 'true')

    await sleep(1000)

    await userEvent.click(toggleButton)

    await expect(loadingButton).toBeEnabled()
    await expect(loadingButton).toHaveTextContent('Not Loading')
  },
  render: function ChangingLoadingState(): JSX.Element {
    const { value: isLoading, toggle: toggleLoading } = useBooleanState(false)

    return (
      <>
        <Flex row>
          <Button size="large" variant="branded" flex={1} onPress={toggleLoading}>
            Toggle Loading
          </Button>
        </Flex>
        <Spacer size="$spacing16" />
        <Flex row>
          <Button size="large" variant="default" flex={1} loading={isLoading}>
            {isLoading ? 'Loading' : 'Not Loading'}
          </Button>
        </Flex>
      </>
    )
  },
}

export const HoverState: Story = {
  name: 'Hovered (Forced)',
  render: (): JSX.Element => {
    return <VariantEmphasisGrid forceStyle="hover" />
  },
}

export const PressState: Story = {
  name: 'Pressed (Forced)',
  render: (): JSX.Element => {
    return <VariantEmphasisGrid forceStyle="press" />
  },
}

// NOTE: These tests run in the CI using Playwright in Light mode
export const FocusState: Story = {
  name: 'State - Focused ▶️',
  render: (): JSX.Element => {
    return <VariantEmphasisGrid />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole('button')

    for (let i = 0; i < buttons.length; i++) {
      await userEvent.tab()

      // Get the currently focused button and assert its styles
      const focusedButton = document.activeElement

      if (!focusedButton) {
        throw new Error('No focused button found')
      }

      try {
        await expect(focusedButton).toHaveStyle({
          outlineOffset: '2px',
          outlineColor: borderColorsForStates[i],
          outlineStyle: 'solid',
          transform: 'matrix(0.98, 0, 0, 0.905, 0, 0)',
          backgroundColor: backgroundColorsForStates[i],
        })
      } catch (error) {
        logger.debug(
          'Button.stories.tsx',
          'FocusState.play',
          `If we've updated our theme and the tests break, the error thrown isn't terribly helpful. Check the following logs for differences in styles coming from the test.`,
        )

        const styleProperties = [
          'outlineOffset',
          'outlineColor',
          'outlineStyle',
          'transform',
          'backgroundColor',
        ] as const

        const computedStyle = window.getComputedStyle(focusedButton)
        styleProperties.forEach((styleProperty) => {
          logger.debug(
            'Button.stories.tsx',
            'FocusState.play',
            `button #${i}, ${styleProperty}: ${computedStyle[styleProperty]}`,
          )
        })

        throw error
      }
    }

    // Unfocus the final button
    await userEvent.tab()
  },
}

// NOTE: These tests run in the CI using Playwright in Light mode
export const PressedState: Story = {
  name: 'State - Pressed ▶️',
  render: () => {
    return <VariantEmphasisGrid />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole('button')

    // Press each button with a 500ms delay
    for (const button of buttons) {
      await userEvent.pointer({
        keys: '[MouseLeft>]', // MouseLeft> means mouse down without up
        target: button,
      })
    }

    // Unfocus the final button
    await userEvent.tab()
  },
}

export const WithControls: Story = {
  decorators: (Story) => (
    <Flex grow alignItems="center">
      <Flex px="$padding16" flex={0}>
        <Text>
          {`Note: If you've just come from the 'With Controls RTL' story, you'll need to make a change to the controls in this story to be able to see the expected LTR UI.`}
        </Text>
        <Spacer size="$spacing16" />
        <Flex row>
          <Story />
        </Flex>
      </Flex>
    </Flex>
  ),
  argTypes,
  args,
}

export const WithControlsRTL: Story = {
  render: function WithControlsRTL(storyArgs) {
    useEffect(() => {
      I18nManager.isRTL = true

      return () => {
        I18nManager.isRTL = false
      }
    }, [])

    return (
      <Flex row px="$padding16">
        <Button {...storyArgs} />
      </Flex>
    )
  },
  argTypes,
  args,
}

export default meta
