import React, { ReactElement } from 'react'
import { ScrollView } from 'react-native'
import { Switch } from 'src/components/buttons/Switch'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { Text } from 'src/components/Text'
import { isEnabled, useTestConfigManager } from 'src/features/remoteConfig'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'

export function SettingsTestConfigs(): ReactElement {
  const [testConfigs, toggleLocalConfig] = useTestConfigManager()

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={{ ...flex.fill, paddingTop: theme.spacing.xxl }}>
        <Flex>
          <BackHeader alignment="left">
            <Text variant="subheadLarge">Test Configs</Text>
          </BackHeader>

          <Text variant="bodyLarge">List of all test configs available to the app</Text>
          <Text variant="bodySmall">
            Remote-only test configs cannot be toggled locally. Use the Firebase console instead.
          </Text>
          <ScrollView>
            {testConfigs.map(([name, configValue]) => {
              const enabled = isEnabled(name)

              return (
                <Flex key={name} row alignItems="center" justifyContent="space-between">
                  <Text variant="bodyLarge">{name}</Text>
                  {configValue.getSource() === 'default' ? (
                    <Switch
                      value={enabled}
                      onValueChange={(): Promise<void> =>
                        toggleLocalConfig({ config: name, enabled: !enabled })
                      }
                    />
                  ) : (
                    <Text variant="bodySmall">Remote only</Text>
                  )}
                </Flex>
              )
            })}
          </ScrollView>
        </Flex>
      </ScrollView>
    </SheetScreen>
  )
}
