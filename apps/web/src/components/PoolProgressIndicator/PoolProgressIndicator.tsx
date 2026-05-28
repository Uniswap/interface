import { Fragment } from 'react'
import { Trans } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, FlexProps, Text } from 'ui/src'
import { assert } from 'utilities/src/errors'

export function PoolProgressIndicator({
  steps,
  ...rest
}: { steps: { label: string; active: boolean; onPress?: () => void }[] } & FlexProps) {
  assert(steps.length > 0, 'PoolProgressIndicator: steps must have at least one step')
  return (
    <Flex
      width="100%"
      borderRadius="$rounded24"
      py="$padding8"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$padding16"
      {...rest}
    >
      {steps.map((step, index) => (
        <Fragment key={step.label + index}>
          <Flex
            row
            gap="$gap12"
            alignItems="center"
            onPress={step.onPress}
            {...(step.onPress ? ClickableTamaguiStyle : {})}
          >
            <Flex
              height="$spacing32"
              width="$spacing32"
              borderRadius="$roundedFull"
              backgroundColor={step.active ? '$neutral1' : '$surface3'}
              alignItems="center"
              justifyContent="center"
            >
              <Text variant="subheading2" color={step.active ? '$surface1' : '$neutral2'} userSelect="none">
                {index + 1}
              </Text>
            </Flex>
            <Flex gap="$spacing2">
              <Text variant="body3" color={step.active ? '$neutral2' : '$neutral3'} userSelect="none">
                <Trans i18nKey="common.step.number" values={{ number: index + 1 }} />
              </Text>
              <Text variant="subheading2" color={step.active ? '$neutral1' : '$neutral2'} userSelect="none">
                {step.label}
              </Text>
            </Flex>
          </Flex>
          {index !== steps.length - 1 && (
            <Flex
              width="$spacing2"
              height="$spacing32"
              backgroundColor="$surface3"
              ml={15}
              my="$spacing8"
              borderRadius="$roundedFull"
            />
          )}
        </Fragment>
      ))}
    </Flex>
  )
}
