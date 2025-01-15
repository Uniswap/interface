import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { I18nManager } from 'react-native'
import { Anchor, ScrollView, Spacer, XStack } from 'tamagui'
import { Button } from 'ui/src/components/buttons/Button/Button'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { Faceid, Heart } from 'ui/src/components/icons'
import { Flex, Separator } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useInterval } from 'utilities/src/time/timing'

const meta = {
  title: 'Spore/Button',
  component: Button,
} satisfies Meta<typeof Button>

type Story = StoryObj<typeof meta>

const RowOfButtons = (props: ButtonProps): JSX.Element => (
  <XStack justifyContent="space-between" flexWrap="wrap" gap="$gap12">
    <Button variant="default" {...props}>
      Default
    </Button>
    <Button variant="branded" {...props}>
      Branded
    </Button>
    <Button variant="critical" {...props}>
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

const ChangingLoadingStateButton = (): JSX.Element => {
  const { value: isLoading, toggle: toggleLoading } = useBooleanState(false)

  useInterval(toggleLoading, 1000)

  return (
    <Button size="large" variant="default" flex={1} loading={isLoading}>
      {isLoading ? 'Loading' : 'Not Loading'}
    </Button>
  )
}

export const All: Story = {
  render: (_args) => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} px="$padding16">
        <SectionHeader title="Overview" />
        <Text variant="body1">
          Button is our primary button component, mirrored with the Button from Spore Design System on Figma.
        </Text>
        <Spacer size="$spacing8" />
        <Anchor
          href="https://www.figma.com/design/5j5YUUMWbrPIe8DMK9oyaC/%F0%9F%8D%84-Spore-Library?node-id=17556-18224&m=dev"
          target="_blank"
        >
          <Text color="$blueVibrant">Go to Figma</Text>
        </Anchor>
        <Spacer size="$spacing8" />

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

        <SectionSeparator />

        <SectionSubHeader title="Tertiary" />
        <RowOfButtons emphasis="tertiary" />

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

        <RowOfButtons size="small" icon={<Faceid />} iconPosition="before" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="After" />
        <RowOfButtons size="small" icon={<Heart />} iconPosition="after" />

        <SectionSeparator />

        <SectionHeader title="Loading" />
        <RowOfButtons loading size="large" />

        <SectionSeparator />

        <SectionHeader title="Disabled" />
        <RowOfButtons disabled />

        <SectionSeparator />

        <SectionHeader title="Changing Loading State" />
        <Flex row>
          <ChangingLoadingStateButton />
        </Flex>

        <SectionSeparator />
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
    options: ['primary', 'secondary', 'tertiary'] satisfies ButtonProps['emphasis'][],
  },
  disabled: {
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
  disabled: false,
  loading: false,
  children: 'Customize Me',
  fill: true,
  alignSelf: 'center',
} as const

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
      <Flex grow alignItems="center">
        <Flex row px="$padding16" flex={0}>
          <Button {...storyArgs} />
        </Flex>
      </Flex>
    )
  },
  argTypes,
  args,
}

export default meta
