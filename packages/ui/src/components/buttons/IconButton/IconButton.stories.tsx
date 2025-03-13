import type { Meta, StoryObj } from '@storybook/react'
import { Anchor, ScrollView, Spacer, XStack } from 'tamagui'
import type { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { IconButton, IconButtonProps } from 'ui/src/components/buttons/IconButton/IconButton'
import { AlertTriangle, Faceid, Heart } from 'ui/src/components/icons'
import { Flex, Separator } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useInterval } from 'utilities/src/time/timing'

const meta: Meta<typeof IconButton> = {
  title: 'Spore/buttons/IconButton',
  component: IconButton,
}

type Story = StoryObj<typeof meta>

const RowOfIconButtonVariants = (props: Omit<IconButtonProps, 'icon'>): JSX.Element => (
  <XStack gap="$gap12">
    <IconButton {...props} variant="default" icon={<Faceid />} />
    <IconButton {...props} variant="branded" icon={<Heart />} />
    <IconButton {...props} variant="critical" icon={<AlertTriangle />} />
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

  return <IconButton size="large" variant="default" loading={isLoading} icon={<AlertTriangle />} />
}

export const All: Story = {
  render: (_args) => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} px="$padding16">
        <SectionHeader title="Overview" />
        <Text variant="body1">
          IconButton is a button component variant, mirrored with the Icon Button from Spore Design System on Figma.
        </Text>
        <Spacer size="$spacing8" />
        <Anchor
          href="https://www.figma.com/design/5j5YUUMWbrPIe8DMK9oyaC/%F0%9F%8D%84-Spore-Library?node-id=14891-2474&m=dev"
          target="_blank"
        >
          <Text color="$blueVibrant">Go to Figma</Text>
        </Anchor>
        <Spacer size="$spacing8" />
        <SectionSeparator />
        <SectionHeader title="The Default" />
        <Flex row>
          <IconButton icon={<Faceid />} />
        </Flex>

        <SectionSeparator />
        <SectionHeader title="Variants" />
        <RowOfIconButtonVariants size="large" />

        <SectionSeparator />

        <SectionHeader title="Emphasis" />
        <SectionSubHeader title="Primary" />
        <RowOfIconButtonVariants emphasis="primary" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Secondary" />
        <RowOfIconButtonVariants emphasis="secondary" />

        <Spacer size="$spacing16" />

        <SectionSubHeader title="Tertiary" />
        <RowOfIconButtonVariants emphasis="tertiary" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Text-Only" />
        <RowOfIconButtonVariants emphasis="text-only" />

        <SectionSeparator />

        <SectionHeader title="Size" />

        <SectionSubHeader title="XXSmall" />
        <RowOfIconButtonVariants size="xxsmall" />
        <Spacer size="$spacing16" />

        <SectionSubHeader title="XSmall" />
        <RowOfIconButtonVariants size="xsmall" />
        <Spacer size="$spacing16" />

        <SectionSubHeader title="Small" />
        <RowOfIconButtonVariants size="small" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Medium" />
        <RowOfIconButtonVariants size="medium" />
        <Spacer size="$spacing16" />
        <SectionSubHeader title="Large" />
        <RowOfIconButtonVariants size="large" />

        <SectionSeparator />

        <SectionHeader title="Loading" />
        <RowOfIconButtonVariants loading size="large" />

        <SectionSeparator />

        <SectionHeader title="Disabled" />
        <RowOfIconButtonVariants isDisabled />

        <SectionSeparator />

        <SectionHeader title="Changing Loading State" />
        <Flex row>
          <ChangingLoadingStateButton />
        </Flex>
      </ScrollView>
    )
  },
}

const icons = {
  Faceid: <Faceid />,
  Heart: <Heart />,
  AlertTriangle: <AlertTriangle />,
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
        AlertTriangle: 'AlertTriangle',
      },
    },
  },
} as const

const args: IconButtonProps = {
  variant: 'default',
  size: 'large',
  emphasis: 'primary',
  isDisabled: false,
  loading: false,
  iconPosition: 'before',
  // @ts-expect-error - This is so Storybook is able to serialize the args; they're mapped above in `argTypes.icon`.
  icon: 'Faceid',
}

export const WithControls: Story = {
  render: function WithControlsRTL(storyArgs) {
    return (
      <Flex grow alignItems="center">
        <Flex row px="$padding16" flex={0}>
          <IconButton {...storyArgs} />
        </Flex>
      </Flex>
    )
  },
  argTypes,
  args,
}

export default meta
