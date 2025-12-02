/* eslint-disable max-lines */
import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import { resolveTeam } from '@universe/cli/src/lib/team-resolver'
import { NumberInput } from '@universe/cli/src/ui/components/NumberInput'
import { TextInput } from '@universe/cli/src/ui/components/TextInput'
import { Toggle } from '@universe/cli/src/ui/components/Toggle'
import { useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text, useInput } from 'ink'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface ConfigReviewProps {
  onConfirm: (config: OrchestratorConfig) => void
  onBack: () => void
}

type AdvancedOption =
  | {
      type: 'toggle'
      label: string
      value: boolean
      onChange: () => void
      help: string
    }
  | {
      type: 'number'
      label: string
      value: number
      onChange: (value: number) => void
      min?: number
      max?: number
      step?: number
      help: string
    }
  | {
      type: 'text'
      label: string
      value: string
      onChange: (value: string) => void
      help: string
    }

type AdvancedOptionsCategory = {
  category: string
  options: AdvancedOption[]
}

interface RenderAdvancedOptionsProps {
  advancedOptions: AdvancedOptionsCategory[]
  flattenedAdvancedOptions: Array<{
    isCategory: boolean
    categoryIndex?: number
    optionIndex?: number
    option?: AdvancedOption
  }>
  advancedStartIndex: number
  focusedIndex: number
  editingIndex: number | null
  editValues: Map<number, string>
}

function renderAdvancedOptions(props: RenderAdvancedOptionsProps): JSX.Element {
  const { advancedOptions, flattenedAdvancedOptions, advancedStartIndex, focusedIndex, editingIndex, editValues } =
    props
  return (
    <Box marginTop={1} flexDirection="column">
      {advancedOptions.map((category, catIndex) => {
        const categoryFlatIndex = flattenedAdvancedOptions.findIndex(
          (item) => item.isCategory && item.categoryIndex === catIndex,
        )
        const categoryGlobalIndex = advancedStartIndex + categoryFlatIndex

        return (
          <Box key={`category-${catIndex}`} flexDirection="column" marginTop={catIndex > 0 ? 1 : 0}>
            <Text
              bold
              color={focusedIndex === categoryGlobalIndex ? colors.primary : 'yellow'}
              dimColor={focusedIndex !== categoryGlobalIndex}
            >
              {category.category}
            </Text>
            {category.options.map((option, optIndex) => {
              const optionFlatIndex = flattenedAdvancedOptions.findIndex(
                (item) => !item.isCategory && item.categoryIndex === catIndex && item.optionIndex === optIndex,
              )
              const optionGlobalIndex = advancedStartIndex + optionFlatIndex
              const isFocused = focusedIndex === optionGlobalIndex

              return (
                <Box key={`option-${catIndex}-${optIndex}`} marginLeft={2}>
                  {option.type === 'toggle' && (
                    <Toggle
                      label={option.label}
                      checked={option.value as boolean}
                      focused={isFocused}
                      onToggle={option.onChange as () => void}
                    />
                  )}
                  {option.type === 'number' && (
                    <NumberInput
                      label={option.label}
                      value={option.value as number}
                      focused={isFocused}
                      isEditing={editingIndex === optionGlobalIndex}
                      editValue={editingIndex === optionGlobalIndex ? editValues.get(optionGlobalIndex) : undefined}
                      min={option.min}
                      max={option.max}
                      step={'step' in option ? option.step : undefined}
                      onChange={option.onChange}
                    />
                  )}
                  {option.type === 'text' && (
                    <TextInput
                      label={option.label}
                      value={option.value as string}
                      focused={isFocused}
                      isEditing={editingIndex === optionGlobalIndex}
                      editValue={editingIndex === optionGlobalIndex ? editValues.get(optionGlobalIndex) : undefined}
                      onChange={option.onChange}
                    />
                  )}
                </Box>
              )
            })}
          </Box>
        )
      })}
    </Box>
  )
}

export function ConfigReview({ onConfirm, onBack }: ConfigReviewProps): JSX.Element {
  const { state, dispatch } = useAppState()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [outputs, setOutputs] = useState<Set<string>>(new Set(['stdout']))

  // Time period presets
  const timePeriodPresets = useMemo(
    () => [
      { label: '1 week', value: '1 week ago' },
      { label: '2 weeks', value: '2 weeks ago' },
      { label: '1 month', value: '1 month ago' },
      { label: '3 months', value: '3 months ago' },
      { label: '6 months', value: '6 months ago' },
    ],
    [],
  )

  // Advanced options state - Diff Configuration
  const [includeDiffs, setIncludeDiffs] = useState(false)
  const [maxDiffSize, setMaxDiffSize] = useState(100)
  const [maxDiffFiles, setMaxDiffFiles] = useState(20)
  const [diffFilePattern, setDiffFilePattern] = useState('\\.(ts|tsx|js|jsx|json)$')
  const [excludeTestFiles, setExcludeTestFiles] = useState(true)

  // Advanced options state - Token & Size Limits
  const [tokenBudget, setTokenBudget] = useState(50000)
  const [prBodyLimit, setPrBodyLimit] = useState(2000)

  // Advanced options state - Debug Options
  const [verbose, setVerbose] = useState(false)
  const [saveArtifacts, setSaveArtifacts] = useState(false)
  const [bypassCache, setBypassCache] = useState(false)

  // Advanced options state - Analysis Options
  const [includeOpenPrs, setIncludeOpenPrs] = useState(state.analysisMode === 'team-digest')

  const buildConfig = useCallback((): OrchestratorConfig => {
    const outputConfigs = Array.from(outputs).map((outputType) => ({
      type: outputType,
      target: outputType === 'file' ? 'changelog.md' : undefined,
    }))

    return {
      analysis: {
        mode: state.analysisMode,
        releaseOptions: state.selectedRelease
          ? {
              platform: state.selectedRelease.platform,
              version: state.selectedRelease.version,
              compareWith: state.comparisonRelease?.version,
            }
          : undefined,
        variables: state.bugDescription
          ? {
              BUG_DESCRIPTION: state.bugDescription,
            }
          : undefined,
      },
      outputs: outputConfigs,
      collect: {
        since: state.timePeriod,
        repository: state.repository || undefined,
        repoPath: process.cwd(),
        includeOpenPrs,
        teamFilter: state.teamFilter?.teams,
        teamUsernames: state.teamFilter?.usernames,
        commitDataConfig: {
          includeFilePaths: true,
          includeDiffs,
          maxDiffSize,
          maxDiffFiles,
          diffFilePattern,
          excludeTestFiles,
          tokenBudget,
          prBodyLimit,
        },
      },
      verbose,
      dryRun: false,
      saveArtifacts,
      bypassCache,
    }
  }, [
    outputs,
    state.analysisMode,
    state.selectedRelease,
    state.comparisonRelease,
    state.bugDescription,
    state.repository,
    state.timePeriod,
    state.teamFilter,
    includeOpenPrs,
    includeDiffs,
    maxDiffSize,
    maxDiffFiles,
    diffFilePattern,
    excludeTestFiles,
    tokenBudget,
    prBodyLimit,
    verbose,
    saveArtifacts,
    bypassCache,
  ])

  // Resolve team slugs to member emails/usernames using cache
  const resolveTeamFilter = useCallback(
    async (teamSlugs: string[]): Promise<{ emails: string[]; usernames: string[] }> => {
      const allEmails: string[] = []
      const allUsernames: string[] = []

      for (const slug of teamSlugs) {
        // Check cache first
        if (state.teamMembersCache[slug]) {
          allEmails.push(...state.teamMembersCache[slug].emails)
          allUsernames.push(...state.teamMembersCache[slug].usernames)
        } else {
          // Fetch if not cached (fallback, should be rare if user viewed details)
          try {
            const { emails, usernames } = await resolveTeam(slug)
            allEmails.push(...emails)
            allUsernames.push(...usernames)

            // Cache for next time
            dispatch({
              type: 'CACHE_TEAM_MEMBERS',
              teamSlug: slug,
              members: { emails, usernames },
            })
          } catch {
            // If resolution fails, continue with what we have
            // Error is silently ignored as this is a fallback scenario
          }
        }
      }

      return {
        emails: [...new Set(allEmails)], // Remove duplicates
        usernames: [...new Set(allUsernames)],
      }
    },
    [state.teamMembersCache, dispatch],
  )

  // Handle confirmation with team resolution
  const handleConfirm = useCallback(async () => {
    let config = buildConfig()

    // If team filter has team slugs, resolve them to member emails/usernames
    if (state.teamFilter?.teams?.length) {
      const resolvedMembers = await resolveTeamFilter(state.teamFilter.teams)

      config = {
        ...config,
        collect: {
          ...config.collect,
          teamFilter: resolvedMembers.emails,
          teamUsernames: resolvedMembers.usernames,
        },
      }
    }

    onConfirm(config)
  }, [buildConfig, state.teamFilter, resolveTeamFilter, onConfirm])

  const outputOptions = useMemo(
    () => [
      { key: 'stdout', label: 'Console (stdout)' },
      { key: 'file', label: 'File (changelog.md)' },
    ],
    [],
  )

  const toggleOutput = useCallback((key: string) => {
    setOutputs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        // Don't allow unchecking if it's the last one
        if (next.size > 1) {
          next.delete(key)
        }
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  // Advanced options configuration with categories
  const advancedOptions = useMemo(
    () => [
      {
        category: '📊 Diff Configuration',
        options: [
          {
            type: 'toggle' as const,
            label: 'Include Diffs',
            value: includeDiffs,
            onChange: () => setIncludeDiffs(!includeDiffs),
            help: 'Include actual code diff content in commits. Warning: increases token usage significantly.',
          },
          {
            type: 'number' as const,
            label: 'Max Diff Size',
            value: maxDiffSize,
            onChange: setMaxDiffSize,
            min: 10,
            max: 1000,
            help: 'Maximum lines changed per file to include in diff (default: 100).',
          },
          {
            type: 'number' as const,
            label: 'Max Diff Files',
            value: maxDiffFiles,
            onChange: setMaxDiffFiles,
            min: 1,
            max: 100,
            help: 'Maximum number of files to include diffs for (default: 20).',
          },
          {
            type: 'text' as const,
            label: 'Diff File Pattern',
            value: diffFilePattern,
            onChange: setDiffFilePattern,
            help: 'Regex pattern for files to include in diffs (default: TypeScript/JavaScript files).',
          },
          {
            type: 'toggle' as const,
            label: 'Exclude Test Files',
            value: excludeTestFiles,
            onChange: () => setExcludeTestFiles(!excludeTestFiles),
            help: 'Exclude test files from diffs to reduce noise (default: true).',
          },
        ],
      },
      {
        category: '🎯 Token & Size Limits',
        options: [
          {
            type: 'number' as const,
            label: 'Token Budget',
            value: tokenBudget,
            onChange: setTokenBudget,
            min: 10000,
            max: 200000,
            step: 5000,
            help: 'Approximate token budget for commit data. Higher values include more detail (default: 50000).',
          },
          {
            type: 'number' as const,
            label: 'PR Body Limit',
            value: prBodyLimit,
            onChange: setPrBodyLimit,
            min: 500,
            max: 10000,
            step: 500,
            help: 'Maximum characters for PR body text. Longer bodies are truncated (default: 2000).',
          },
        ],
      },
      {
        category: '🔧 Debug Options',
        options: [
          {
            type: 'toggle' as const,
            label: 'Verbose Logging',
            value: verbose,
            onChange: () => setVerbose(!verbose),
            help: 'Enable detailed logging output for debugging purposes.',
          },
          {
            type: 'toggle' as const,
            label: 'Save Artifacts',
            value: saveArtifacts,
            onChange: () => setSaveArtifacts(!saveArtifacts),
            help: 'Save analysis artifacts (raw data, prompts) to disk for debugging.',
          },
          {
            type: 'toggle' as const,
            label: 'Bypass Cache',
            value: bypassCache,
            onChange: () => setBypassCache(!bypassCache),
            help: 'Force fresh data fetch, ignoring cached results.',
          },
        ],
      },
      {
        category: '📋 Analysis Options',
        options: [
          {
            type: 'toggle' as const,
            label: 'Include Open PRs',
            value: includeOpenPrs,
            onChange: () => setIncludeOpenPrs(!includeOpenPrs),
            help: 'Include open (unmerged) pull requests in the analysis.',
          },
        ],
      },
    ],
    [
      includeDiffs,
      maxDiffSize,
      maxDiffFiles,
      diffFilePattern,
      excludeTestFiles,
      tokenBudget,
      prBodyLimit,
      verbose,
      saveArtifacts,
      bypassCache,
      includeOpenPrs,
    ],
  )

  // Flatten advanced options for navigation
  const flattenedAdvancedOptions: Array<{
    isCategory: boolean
    categoryIndex?: number
    optionIndex?: number
    option?: (typeof advancedOptions)[number]['options'][number]
  }> = useMemo(() => {
    const flattened: Array<{
      isCategory: boolean
      categoryIndex?: number
      optionIndex?: number
      option?: (typeof advancedOptions)[number]['options'][number]
    }> = []

    if (showAdvanced) {
      advancedOptions.forEach((category, catIndex) => {
        flattened.push({ isCategory: true, categoryIndex: catIndex })
        category.options.forEach((option, optIndex) => {
          flattened.push({
            isCategory: false,
            categoryIndex: catIndex,
            optionIndex: optIndex,
            option,
          })
        })
      })
    }
    return flattened
  }, [showAdvanced, advancedOptions])

  // Calculate total focusable items
  const showTimePeriod = state.analysisMode !== 'release-changelog' && state.analysisMode !== 'bug-bisect'
  const timePeriodStartIndex = 0
  const timePeriodCount = showTimePeriod ? timePeriodPresets.length : 0
  const outputsStartIndex = timePeriodStartIndex + timePeriodCount
  const advancedToggleIndex = outputsStartIndex + outputOptions.length
  const advancedStartIndex = advancedToggleIndex + 1
  const confirmIndex = advancedStartIndex + flattenedAdvancedOptions.length
  const totalItems = confirmIndex + 1

  // Track editing state for inputs
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Map<number, string>>(new Map())

  // Track focus state for navigation
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Reset editing when focus changes away from editing field
  useEffect(() => {
    if (editingIndex !== null && focusedIndex !== editingIndex) {
      setEditingIndex(null)
      setEditValues((prev) => {
        const next = new Map(prev)
        next.delete(editingIndex)
        return next
      })
    }
  }, [focusedIndex, editingIndex])

  // Help text for focused advanced option
  const helpText = useMemo((): JSX.Element | null => {
    if (!showAdvanced || focusedIndex < advancedStartIndex || focusedIndex >= confirmIndex) {
      return null
    }
    const advOptIndex = focusedIndex - advancedStartIndex
    const item = flattenedAdvancedOptions[advOptIndex]
    if (item && !item.isCategory && item.option) {
      return <Text color="gray">{item.option.help}</Text>
    }
    return null
  }, [showAdvanced, focusedIndex, advancedStartIndex, confirmIndex, flattenedAdvancedOptions])

  // Get current focused item
  const getFocusedItem = useCallback(() => {
    if (focusedIndex >= timePeriodStartIndex && focusedIndex < outputsStartIndex) {
      // Time period preset
      return { type: 'time-period' as const }
    }
    if (focusedIndex >= outputsStartIndex && focusedIndex < advancedToggleIndex) {
      const outputIndex = focusedIndex - outputsStartIndex
      return { type: 'toggle' as const, option: outputOptions[outputIndex] }
    }
    if (focusedIndex >= advancedStartIndex && focusedIndex < confirmIndex) {
      const advOptIndex = focusedIndex - advancedStartIndex
      const item = flattenedAdvancedOptions[advOptIndex]
      return item && !item.isCategory && item.option ? { type: item.option.type, option: item.option } : null
    }
    return null
  }, [
    focusedIndex,
    outputsStartIndex,
    outputOptions,
    advancedToggleIndex,
    advancedStartIndex,
    confirmIndex,
    flattenedAdvancedOptions,
  ])

  // Handle editing input
  const handleEditingInput = useCallback(
    (params: {
      input: string
      key: { return?: boolean; escape?: boolean; backspace?: boolean; delete?: boolean }
      focusedItem: {
        type: 'text' | 'number'
        option: { value: string | number; onChange: (value: string | number) => void; min?: number; max?: number }
      }
    }): boolean => {
      const { input, key, focusedItem } = params
      const currentEditValue = editValues.get(focusedIndex) || String(focusedItem.option.value)

      if (key.return) {
        // Save edit
        if (focusedItem.type === 'number') {
          const numValue = Number.parseInt(currentEditValue, 10)
          if (!Number.isNaN(numValue)) {
            const min = 'min' in focusedItem.option ? focusedItem.option.min : 0
            const max = 'max' in focusedItem.option ? focusedItem.option.max : Number.MAX_SAFE_INTEGER
            const clampedValue = Math.max(min ?? 0, Math.min(max ?? Number.MAX_SAFE_INTEGER, numValue))
            ;(focusedItem.option.onChange as (value: number) => void)(clampedValue)
          }
        } else {
          // eslint-disable-next-line no-extra-semi
          ;(focusedItem.option.onChange as (value: string) => void)(currentEditValue)
        }
        setEditingIndex(null)
        setEditValues((prev) => {
          const next = new Map(prev)
          next.delete(focusedIndex)
          return next
        })
        return true
      }

      if (key.escape) {
        // Cancel edit
        setEditingIndex(null)
        setEditValues((prev) => {
          const next = new Map(prev)
          next.delete(focusedIndex)
          return next
        })
        return true
      }

      if (key.backspace || key.delete) {
        // Delete character
        setEditValues((prev) => {
          const next = new Map(prev)
          const current = next.get(focusedIndex) || String(focusedItem.option.value)
          next.set(focusedIndex, current.slice(0, -1))
          return next
        })
        return true
      }

      if (input && input.length === 1) {
        // Add character
        if (focusedItem.type === 'number' && /^\d$/.test(input)) {
          setEditValues((prev) => {
            const next = new Map(prev)
            const current = next.get(focusedIndex) || String(focusedItem.option.value)
            next.set(focusedIndex, current + input)
            return next
          })
          return true
        }
        if (focusedItem.type === 'text') {
          setEditValues((prev) => {
            const next = new Map(prev)
            const current = next.get(focusedIndex) || String(focusedItem.option.value)
            next.set(focusedIndex, current + input)
            return next
          })
          return true
        }
      }

      return false
    },
    [focusedIndex, editValues],
  )

  // Handle selection (Enter/Space)
  const handleSelection = useCallback(
    (key: { return?: boolean; space?: boolean }) => {
      if (!key.return && !(key as { space?: boolean }).space) {
        return
      }

      if (focusedIndex >= timePeriodStartIndex && focusedIndex < outputsStartIndex) {
        // Time period preset selection
        const presetIndex = focusedIndex - timePeriodStartIndex
        const preset = timePeriodPresets[presetIndex]
        if (preset) {
          dispatch({ type: 'SET_TIME_PERIOD', period: preset.value })
        }
        return
      }

      if (focusedIndex >= outputsStartIndex && focusedIndex < advancedToggleIndex) {
        // Output toggles
        const outputIndex = focusedIndex - outputsStartIndex
        const optionKey = outputOptions[outputIndex]?.key
        if (optionKey) {
          toggleOutput(optionKey)
        }
        return
      }

      if (focusedIndex === advancedToggleIndex) {
        // Advanced toggle button
        const newShowAdvanced = !showAdvanced
        setShowAdvanced(newShowAdvanced)
        // When hiding advanced options, move focus if needed
        if (!newShowAdvanced && focusedIndex > advancedToggleIndex) {
          setFocusedIndex(advancedToggleIndex)
        }
        return
      }

      if (focusedIndex >= advancedStartIndex && focusedIndex < confirmIndex) {
        // Advanced options
        const advOptIndex = focusedIndex - advancedStartIndex
        const item = flattenedAdvancedOptions[advOptIndex]
        if (item && !item.isCategory && item.option) {
          if (item.option.type === 'toggle') {
            item.option.onChange()
          } else {
            // Start editing
            setEditingIndex(focusedIndex)
            setEditValues((prev) => {
              const next = new Map(prev)
              const optionValue = item.option?.value
              if (optionValue !== undefined) {
                next.set(focusedIndex, String(optionValue))
              }
              return next
            })
          }
        }
        return
      }

      if (focusedIndex === confirmIndex) {
        // Confirm button - resolve teams if needed
        // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
        handleConfirm()
      }
    },
    [
      focusedIndex,
      outputsStartIndex,
      dispatch,
      outputOptions,
      advancedToggleIndex,
      showAdvanced,
      advancedStartIndex,
      confirmIndex,
      flattenedAdvancedOptions,
      toggleOutput,
      handleConfirm,
      timePeriodPresets,
    ],
  )

  // Handle escape key
  const handleEscape = useCallback(
    (isEditing: boolean): boolean => {
      if (!isEditing) {
        onBack()
        return true
      }
      return false
    },
    [onBack],
  )

  // Handle navigation (up/down arrows)
  const handleNavigation = useCallback(
    (key: { upArrow?: boolean; downArrow?: boolean }, isEditing: boolean): boolean => {
      if (isEditing) {
        return false
      }
      if (key.upArrow) {
        setFocusedIndex((prev) => Math.max(0, prev - 1))
        return true
      }
      if (key.downArrow) {
        setFocusedIndex((prev) => Math.min(totalItems - 1, prev + 1))
        return true
      }
      return false
    },
    [totalItems],
  )

  // Handle number input arrow keys (left/right)
  const handleNumberArrows = useCallback(
    (params: {
      key: { leftArrow?: boolean; rightArrow?: boolean }
      focusedItem: ReturnType<typeof getFocusedItem>
      isEditing: boolean
    }): boolean => {
      const { key, focusedItem, isEditing } = params
      if (!focusedItem || focusedItem.type !== 'number' || isEditing) {
        return false
      }
      const step = 'step' in focusedItem.option ? focusedItem.option.step : 1
      const minValue = focusedItem.option.min ?? 0
      const maxValue = focusedItem.option.max ?? Number.MAX_SAFE_INTEGER
      if (key.leftArrow) {
        const newValue = Math.max(minValue, (focusedItem.option.value as number) - step)
        ;(focusedItem.option.onChange as (value: number) => void)(newValue)
        return true
      }
      if (key.rightArrow) {
        const newValue = Math.min(maxValue, (focusedItem.option.value as number) + step)
        ;(focusedItem.option.onChange as (value: number) => void)(newValue)
        return true
      }
      return false
    },
    [],
  )

  // Consolidated input handler - handles all input centrally
  const handleInput = useCallback(
    (
      input: string,
      key: {
        escape?: boolean
        return?: boolean
        upArrow?: boolean
        downArrow?: boolean
        tab?: boolean
        leftArrow?: boolean
        rightArrow?: boolean
      },
    ): void => {
      const focusedItem = getFocusedItem()
      const isEditing = editingIndex === focusedIndex

      // Handle escape key
      if (key.escape && handleEscape(isEditing)) {
        return
      }

      // Handle navigation (up/down) - blocked when editing
      if (handleNavigation(key, isEditing)) {
        return
      }

      // Handle editing mode input
      if (isEditing && focusedItem && (focusedItem.type === 'text' || focusedItem.type === 'number')) {
        // Type assertion: we've already checked it's text or number
        const editableItem = focusedItem as {
          type: 'text' | 'number'
          option: { value: string | number; onChange: (value: string | number) => void; min?: number; max?: number }
        }
        if (handleEditingInput({ input, key, focusedItem: editableItem })) {
          return
        }
      }

      // Handle arrow keys for number inputs (when not editing)
      if (handleNumberArrows({ key, focusedItem, isEditing })) {
        return
      }

      // Handle Enter/Space for selection
      handleSelection(key)
    },
    [
      focusedIndex,
      editingIndex,
      getFocusedItem,
      handleEditingInput,
      handleSelection,
      handleEscape,
      handleNavigation,
      handleNumberArrows,
    ],
  )

  useInput(handleInput)

  const renderConfigSummary = useCallback((): JSX.Element => {
    const analysisModeLabel =
      state.analysisMode === 'release-changelog'
        ? '📋 Release Changelog'
        : state.analysisMode === 'bug-bisect'
          ? '🐛 Bug Finder'
          : state.analysisMode === 'team-digest'
            ? '👥 Team Digest'
            : '✏️  Custom Analysis'

    return (
      <>
        <Text>
          <Text bold>Analysis Mode:</Text> {analysisModeLabel}
        </Text>

        {state.selectedRelease && (
          <>
            <Text>
              <Text bold>Release:</Text> {state.selectedRelease.platform}/{state.selectedRelease.version}
            </Text>
            {state.comparisonRelease && (
              <Text>
                <Text bold>Compare with:</Text> {state.comparisonRelease.platform}/{state.comparisonRelease.version}
              </Text>
            )}
          </>
        )}

        {state.bugDescription && (
          <Text>
            <Text bold>Bug:</Text> {state.bugDescription}
          </Text>
        )}

        {state.teamFilter && (
          <Text>
            <Text bold>Team Filter:</Text>{' '}
            {[
              ...(state.teamFilter.teams || []),
              ...(state.teamFilter.usernames || []),
              ...(state.teamFilter.emails || []),
            ].join(', ')}
          </Text>
        )}
      </>
    )
  }, [state.analysisMode, state.selectedRelease, state.comparisonRelease, state.bugDescription, state.teamFilter])

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Configuration Review
        </Text>
      </Box>
      <Box flexDirection="column">
        {renderConfigSummary()}

        {showTimePeriod ? (
          <Box marginTop={1} flexDirection="column">
            <Box marginBottom={1}>
              <Text bold>Time Period:</Text>
            </Box>
            {timePeriodPresets.map((preset, index) => {
              const isFocused = focusedIndex === timePeriodStartIndex + index
              const isSelected = state.timePeriod === preset.value
              return (
                <Box key={preset.value}>
                  <Text color={isFocused ? colors.primary : undefined} bold={isFocused}>
                    {isFocused ? '❯ ' : '  '}
                    {isSelected ? '● ' : '○ '}
                    {preset.label}
                    {isSelected ? ` (${state.timePeriod})` : ''}
                  </Text>
                </Box>
              )
            })}
          </Box>
        ) : (
          <Box marginTop={1}>
            <Text dimColor>Time period based on release commits</Text>
          </Box>
        )}

        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Outputs:</Text>
          </Box>
          {outputOptions.map((option, index) => {
            const optionGlobalIndex = outputsStartIndex + index
            return (
              <Toggle
                key={option.key}
                label={option.label}
                checked={outputs.has(option.key)}
                focused={focusedIndex === optionGlobalIndex}
                onToggle={() => toggleOutput(option.key)}
              />
            )
          })}
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text
            color={focusedIndex === advancedToggleIndex ? colors.primary : undefined}
            bold={focusedIndex === advancedToggleIndex}
          >
            {focusedIndex === advancedToggleIndex ? '❯ ' : '  '}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Text>
        </Box>

        {showAdvanced &&
          renderAdvancedOptions({
            advancedOptions,
            flattenedAdvancedOptions,
            advancedStartIndex,
            focusedIndex,
            editingIndex,
            editValues,
          })}

        <Box marginTop={1} flexDirection="column">
          <Text color={focusedIndex === confirmIndex ? colors.primary : undefined} bold={focusedIndex === confirmIndex}>
            {focusedIndex === confirmIndex ? '❯ ' : '  '}
            Confirm and Generate
          </Text>
        </Box>

        {/* Help text for focused advanced option */}
        {helpText && (
          <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="gray">
            {helpText}
          </Box>
        )}

        <Box marginTop={2}>
          <Text dimColor>Use ↑↓ to navigate, Space/Enter to toggle/select, Esc to go back</Text>
        </Box>
      </Box>
    </Box>
  )
}
