import { Flex, Separator } from '@universe/mycelium'
import { Text } from '@universe/mycelium'
import { TouchableTextLink } from '@universe/mycelium'
import { Fragment, PropsWithChildren } from 'react'
const SectionHeader = ({ title }: { title: string }): JSX.Element => (
  <>
    <Text variant="heading3">{title}</Text>
    <Flex height="$spacing16" />
  </>
)

const SectionSubHeader = ({ title }: { title: string }): JSX.Element => (
  <>
    <Flex height="$spacing20" />
    <Text variant="subheading1">{title}</Text>
    <Flex height="$spacing16" />
  </>
)

const SectionSeparator = (): JSX.Element => (
  <>
    <Flex height="$spacing16" />
    <Separator />
    <Flex height="$spacing16" />
  </>
)

const PageTitle = ({
  description,
  figmaUrl,
  componentName,
  componentUrl,
}: {
  description: string
  figmaUrl: string
  componentName: string
  componentUrl: string
}): JSX.Element => (
  <>
    <SectionHeader title="Overview" />
    <Text variant="body1">
      <TouchableTextLink color="$neutral2" onlyUseText={true} link={componentUrl} target="_blank">
        {componentName}
      </TouchableTextLink>
      {description}
    </Text>
    <Flex height="$spacing8" />
    <Flex row>
      <TouchableTextLink color="$neutral2" link={figmaUrl} target="_blank">
        Go to Figma
      </TouchableTextLink>
    </Flex>
    <SectionSeparator />
  </>
)

const VariantHeaderContainer = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <Flex px="$padding8" py="$padding6" backgroundColor="$surface3" borderRadius="$rounded12">
      {children}
    </Flex>
  )
}

const EmphasizedText = ({ children }: { children: string }): JSX.Element => (
  <Text variant="body4" fontWeight="bold" fontStyle="italic" color="$statusCritical">
    {children}
  </Text>
)

/**
 * Renders text, wrapping any text between curly braces ({}) with `EmphasizedText`.
 * Example: <EmphasizableText>Normal {emphasized} normal</EmphasizableText>
 */
export const EmphasizableText = ({ children }: { children: string }): JSX.Element => {
  // Split on curly braces, keeping the delimiters
  const parts = children.split(/(\{[^}]+\})/g)

  return (
    <Text variant="body3">
      {parts.map((part, idx) => {
        // If part starts and ends with curly braces, emphasize it
        if (part.startsWith('{') && part.endsWith('}')) {
          const content = part.slice(1, -1)
          return <EmphasizedText key={idx}>{content}</EmphasizedText>
        }
        // Otherwise, render as normal text
        return <Fragment key={idx}>{part}</Fragment>
      })}
    </Text>
  )
}

export const StorybookComponents = {
  SectionHeader,
  SectionSubHeader,
  SectionSeparator,
  PageTitle,
  VariantHeaderContainer,
  EmphasizableText,
}
