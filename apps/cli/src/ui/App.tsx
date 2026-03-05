import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import type { Release } from '@universe/cli/src/lib/release-scanner'
import { AppStateProvider, type TeamFilter, useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { BugBisectResultsScreen } from '@universe/cli/src/ui/screens/BugBisectResultsScreen'
import { BugInputScreen } from '@universe/cli/src/ui/screens/BugInputScreen'
import { ConfigReview } from '@universe/cli/src/ui/screens/ConfigReview'
import { ExecutionScreen } from '@universe/cli/src/ui/screens/ExecutionScreen'
import { ReleaseSelector } from '@universe/cli/src/ui/screens/ReleaseSelector'
import { ResultsScreen } from '@universe/cli/src/ui/screens/ResultsScreen'
import { TeamSelectorScreen } from '@universe/cli/src/ui/screens/TeamSelectorScreen'
import { WelcomeScreen } from '@universe/cli/src/ui/screens/WelcomeScreen'
import { useCallback, useEffect } from 'react'

function AppContent(): JSX.Element {
  const { state, dispatch } = useAppState()

  // Clear terminal on initial mount
  useEffect(() => {
    process.stdout.write('\x1Bc') // VT100 clear screen and scrollback
  }, [])
  const handleWelcomeContinue = (mode: 'release-changelog' | 'team-digest' | 'changelog' | 'bug-bisect'): void => {
    // Route based on analysis mode
    switch (mode) {
      case 'release-changelog':
        dispatch({ type: 'SET_SCREEN', screen: 'release-select' })
        break
      case 'bug-bisect':
        dispatch({ type: 'SET_SCREEN', screen: 'release-select' })
        break
      case 'team-digest':
        dispatch({ type: 'SET_SCREEN', screen: 'team-select' })
        break
      case 'changelog':
        // Skip to config review for custom analysis
        dispatch({ type: 'SET_SCREEN', screen: 'config-review' })
        break
    }
  }

  const handleReleaseSelect = (_release: Release, _comparison: Release | null): void => {
    // If bug-bisect mode, go to bug input screen; otherwise go to config review
    if (state.analysisMode === 'bug-bisect') {
      dispatch({ type: 'SET_SCREEN', screen: 'bug-input' })
    } else {
      dispatch({ type: 'SET_SCREEN', screen: 'config-review' })
    }
  }

  const handleBugInputContinue = (): void => {
    dispatch({ type: 'SET_SCREEN', screen: 'config-review' })
  }

  const handleBugInputBack = (): void => {
    dispatch({ type: 'SET_SCREEN', screen: 'release-select' })
  }

  const handleTeamSelect = (_teamFilter: TeamFilter | null): void => {
    dispatch({ type: 'SET_SCREEN', screen: 'config-review' })
  }

  const handleConfigConfirm = (config: OrchestratorConfig): void => {
    dispatch({ type: 'UPDATE_CONFIG', config })
    dispatch({ type: 'SET_SCREEN', screen: 'execution' })
  }

  const handleExecutionComplete = useCallback(
    (results: Record<string, unknown>): void => {
      // Transform orchestrator results to app state format
      // Orchestrator returns { analysis: "markdown content", ... } or JSON for bug-bisect
      const changelog = typeof results.analysis === 'string' ? results.analysis : JSON.stringify(results, null, 2)

      dispatch({ type: 'SET_RESULTS', results: { changelog, metadata: results } })
      // Route to bug-bisect results screen if in bug-bisect mode
      if (state.analysisMode === 'bug-bisect') {
        dispatch({ type: 'SET_SCREEN', screen: 'results' })
      } else {
        dispatch({ type: 'SET_SCREEN', screen: 'results' })
      }
    },
    [dispatch, state.analysisMode],
  )

  const handleExecutionError = useCallback(
    (_error: Error): void => {
      dispatch({ type: 'SET_EXECUTION_STATE', state: 'error' })
      // Could navigate to error screen or show error in execution screen
    },
    [dispatch],
  )

  const handleBack = (): void => {
    // Determine previous screen based on current screen and mode
    if (state.screen === 'config-review') {
      // Go back to appropriate selector based on mode
      switch (state.analysisMode) {
        case 'release-changelog':
          dispatch({ type: 'SET_SCREEN', screen: 'release-select' })
          break
        case 'bug-bisect':
          dispatch({ type: 'SET_SCREEN', screen: 'bug-input' })
          break
        case 'team-digest':
          dispatch({ type: 'SET_SCREEN', screen: 'team-select' })
          break
        case 'changelog':
          dispatch({ type: 'SET_SCREEN', screen: 'welcome' })
          break
      }
    } else if (state.screen === 'bug-input') {
      dispatch({ type: 'SET_SCREEN', screen: 'release-select' })
    } else if (state.screen === 'release-select' || state.screen === 'team-select') {
      dispatch({ type: 'SET_SCREEN', screen: 'welcome' })
    } else if (state.screen === 'execution' || state.screen === 'results') {
      dispatch({ type: 'SET_SCREEN', screen: 'config-review' })
    }
  }

  const handleRestart = (): void => {
    dispatch({ type: 'SET_SCREEN', screen: 'welcome' })
    dispatch({ type: 'SELECT_RELEASE', release: null })
    dispatch({ type: 'SET_COMPARISON_RELEASE', release: null })
    dispatch({ type: 'SET_RESULTS', results: null })
    dispatch({ type: 'SET_EXECUTION_STATE', state: 'idle' })
  }

  switch (state.screen) {
    case 'welcome':
      return <WelcomeScreen key="welcome" onContinue={handleWelcomeContinue} />
    case 'release-select':
      return <ReleaseSelector key="release-select" onSelect={handleReleaseSelect} onBack={handleBack} />
    case 'bug-input':
      return <BugInputScreen key="bug-input" onContinue={handleBugInputContinue} onBack={handleBugInputBack} />
    case 'team-select':
      return <TeamSelectorScreen key="team-select" onSelect={handleTeamSelect} onBack={handleBack} />
    case 'config-review':
      return <ConfigReview key="config-review" onConfirm={handleConfigConfirm} onBack={handleBack} />
    case 'execution':
      return (
        <ExecutionScreen
          key="execution"
          config={state.config as OrchestratorConfig}
          onComplete={handleExecutionComplete}
          onError={handleExecutionError}
        />
      )
    case 'results':
      // Use BugBisectResultsScreen for bug-bisect mode, otherwise ResultsScreen
      if (state.analysisMode === 'bug-bisect') {
        return (
          <BugBisectResultsScreen
            key="results"
            results={state.results || { changelog: '', metadata: {} }}
            onRestart={handleRestart}
          />
        )
      }
      return (
        <ResultsScreen
          key="results"
          results={state.results || { changelog: '', metadata: {} }}
          onRestart={handleRestart}
        />
      )
    default:
      return <WelcomeScreen key="welcome-default" onContinue={handleWelcomeContinue} />
  }
}

export function App(): JSX.Element {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  )
}
