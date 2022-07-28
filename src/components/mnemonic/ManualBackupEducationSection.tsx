import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import BriefcaseIcon from 'src/assets/icons/briefcase.svg'
import EyeIcon from 'src/assets/icons/eye-off.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import { RainbowLinearGradientStops } from 'src/components/gradients'
import { LinearGradientBox } from 'src/components/gradients/LinearGradient'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function ManualBackupEducationSection() {
  const { t } = useTranslation()
  const spacer = <Box borderTopColor="backgroundOutline" borderTopWidth={1} />
  const theme = useAppTheme()
  return (
    <Flex gap="lg" py="xl">
      <EducationRow
        icon={<EyeIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Write it down in private')}
        sublabel={t(
          "Ensure that you're in a private location and write down your recovery phrase's words in order."
        )}
      />
      {spacer}
      <EducationRow
        icon={<BriefcaseIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t('Keep it somewhere safe')}
        sublabel={t('Remember that anyone who has your recovery phrase can access your wallet.')}
      />
      {spacer}
      <EducationRow
        icon={<LockIcon color={theme.colors.textPrimary} height={16} width={16} />}
        label={t("Don't lose it")}
        sublabel={t(
          'If you lose your recovery phrase, you’ll lose access to your wallet and its contents.'
        )}
      />
    </Flex>
  )
}

interface EducationRowProps {
  icon: ReactNode
  label: string
  sublabel: string
}

function EducationRow({ icon, label, sublabel }: EducationRowProps) {
  return (
    <Flex gap="lg">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex centered row>
          <Box height={40} width={40}>
            <LinearGradientBox radius="md" stops={RainbowLinearGradientStops}>
              {/* TODO: simplify Rainbow border */}
              <Box alignItems="center" justifyContent="center" style={styles.padded}>
                <Flex centered bg="backgroundBackdrop" borderRadius="md" height={38} width={38}>
                  {icon}
                </Flex>
              </Box>
            </LinearGradientBox>
          </Box>
          <Flex flex={1} gap="none">
            <Text variant="subhead">{label}</Text>
            <Text color="textSecondary" variant="caption">
              {sublabel}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

const styles = StyleSheet.create({
  padded: {
    padding: 1,
  },
})
