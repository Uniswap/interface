import { Flex, Text, TouchableArea } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'

type InformationBannerProps = {
  infoText: string
  onPress: () => void
}

export function InformationBanner({ infoText, onPress }: InformationBannerProps): JSX.Element {
  return (
    <TouchableArea backgroundColor="$surface2" borderRadius="$rounded16" my="$padding8" onPress={onPress}>
      <Flex row alignItems="center" px="$spacing12" py="$spacing12">
        <QuestionInCircleFilled color="$neutral2" size="$icon.20" />
        <Flex pl="$spacing8">
          <Text color="$neutral2" variant="body3">
            {infoText}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
