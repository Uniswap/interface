import { useTranslation } from 'react-i18next'
import { Flex, Image, Text, Unicon } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function AmountAndRecipientSummary(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex grow gap="$spacing36">
      <Flex gap="$spacing12">
        <Text color="$neutral2" fontSize={16}>
          {t('You’re sending')}
        </Text>

        <Flex centered grow row>
          <Flex fill gap="$spacing8">
            <Flex>
              <Text fontSize={24}>XX.XX ETH</Text>
            </Flex>

            <Flex>
              <Text color="$neutral2" variant="bodySmall">
                $YY.YY
              </Text>
            </Flex>
          </Flex>

          <Flex>
            <Image
              height={iconSizes.icon36}
              source={{
                // TODO: replace with currencyInfo.logoUrl
                uri: 'https://token-icons.s3.amazonaws.com/eth.png',
              }}
              width={iconSizes.icon36}
            />
          </Flex>
        </Flex>
      </Flex>

      <Flex gap="$spacing12">
        <Text color="$neutral2" fontSize={16}>
          {t('To')}
        </Text>

        <Flex centered grow row>
          <Flex fill gap="$spacing8">
            <Flex>
              <Text fontSize={24}>demo.eth</Text>
            </Flex>

            <Flex>
              <Text color="$neutral2" variant="bodySmall">
                0x1234...1234
              </Text>
            </Flex>
          </Flex>

          <Flex>
            {/* TODO: replace with recipient address */}
            <Unicon address="0x76e4dE46c21603545eaaF7DaF25e54c0d06BAfA9" size={iconSizes.icon36} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
