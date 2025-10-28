import { Experiments, getOverrideAdapter, LayerProperties, Layers, useExperiment, useLayer } from '@universe/gating'
import { useCallback } from 'react'
import { Flex, Input, Switch, Text } from 'ui/src'

export function LayerRow({
  value: layerName,
  layerDefault = false,
}: {
  value: Layers
  layerDefault?: unknown
}): JSX.Element {
  const { get: getLayerValue } = useLayer(layerName)

  const value = Object.values(LayerProperties[layerName]).reduce(
    (acc, key) => ({ ...acc, [key]: getLayerValue(key) ?? layerDefault }),
    {},
  )

  const overrideValue = useCallback(
    <T,>(newPairs: Record<string, T>) => {
      getOverrideAdapter().overrideLayer(layerName, { ...value, ...newPairs })
    },
    [layerName, value],
  )

  return <Row target={layerName} values={value} overrideValue={overrideValue} />
}

export function ExperimentRow({ value: experimentName }: { value: Experiments }): JSX.Element {
  const { value } = useExperiment(experimentName)

  const overrideValue = useCallback(
    <T,>(newPairs: Record<string, T>) => {
      getOverrideAdapter().overrideExperiment(experimentName, newPairs)
    },
    [experimentName],
  )

  return <Row target={experimentName} values={value} overrideValue={overrideValue} />
}

function Row({
  target,
  values,
  overrideValue,
}: {
  target: Experiments | Layers
  values: Record<string, unknown>
  overrideValue: <T>(newPairs: Record<string, T>) => void
}): JSX.Element {
  const handleBooleanChange = useCallback(
    (key: string) => (newValue: boolean) => {
      overrideValue<boolean>({ [key]: newValue })
    },
    [overrideValue],
  )

  const handleNumberChange = useCallback(
    (key: string) => (newValue: string) => {
      overrideValue<number>({ [key]: Number(newValue) })
    },
    [overrideValue],
  )

  const handleStringChange = useCallback(
    (key: string) => (newValue: string) => {
      overrideValue<string>({ [key]: newValue })
    },
    [overrideValue],
  )

  const paramRows = Object.entries(values).map(([key, val]) => {
    let valueElement: JSX.Element | undefined

    if (typeof val === 'boolean') {
      valueElement = <Switch key={key} checked={val} variant="branded" onCheckedChange={handleBooleanChange(key)} />
    } else if (typeof val === 'number') {
      valueElement = <Input value={val.toString()} onChangeText={handleNumberChange(key)} />
    } else if (typeof val === 'string') {
      valueElement = <Input value={val} onChangeText={handleStringChange(key)} />
    }

    return (
      valueElement && (
        <Flex key={key} row alignItems="center" gap="$spacing16" justifyContent="space-between">
          <Text variant="body1">{key}</Text>
          {valueElement}
        </Flex>
      )
    )
  })

  return (
    <Flex>
      <Text variant="body1">{target}</Text>
      <Flex>
        <Flex gap="$spacing8" pl="$spacing8">
          {paramRows}
        </Flex>
      </Flex>
    </Flex>
  )
}
