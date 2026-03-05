import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import type { Release } from '@universe/cli/src/lib/release-scanner'
import { createContext, type ReactNode, useContext, useReducer } from 'react'

export type Screen =
  | 'welcome'
  | 'release-select'
  | 'team-select'
  | 'config-review'
  | 'execution'
  | 'results'
  | 'bug-input'

export type AnalysisMode = 'release-changelog' | 'team-digest' | 'changelog' | 'bug-bisect'

export interface TeamFilter {
  teams?: string[]
  usernames?: string[]
  emails?: string[]
}

export interface TeamMembersCache {
  emails: string[]
  usernames: string[]
}

interface AppState {
  screen: Screen
  repository: { owner: string; name: string } | null
  releases: Release[]
  selectedRelease: Release | null
  comparisonRelease: Release | null
  analysisMode: AnalysisMode
  bugDescription: string | null
  teamFilter: TeamFilter | null
  teamMembersCache: Record<string, TeamMembersCache>
  timePeriod: string
  config: Partial<OrchestratorConfig>
  executionState: 'idle' | 'running' | 'complete' | 'error'
  results: { changelog: string; metadata: unknown } | null
}

type AppAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_REPOSITORY'; repository: { owner: string; name: string } | null }
  | { type: 'SET_RELEASES'; releases: Release[] }
  | { type: 'SELECT_RELEASE'; release: Release | null }
  | { type: 'SET_COMPARISON_RELEASE'; release: Release | null }
  | { type: 'SET_ANALYSIS_MODE'; mode: AnalysisMode }
  | { type: 'SET_BUG_DESCRIPTION'; description: string | null }
  | { type: 'SET_TEAM_FILTER'; filter: TeamFilter | null }
  | { type: 'CACHE_TEAM_MEMBERS'; teamSlug: string; members: TeamMembersCache }
  | { type: 'SET_TIME_PERIOD'; period: string }
  | { type: 'UPDATE_CONFIG'; config: Partial<OrchestratorConfig> }
  | { type: 'SET_EXECUTION_STATE'; state: 'idle' | 'running' | 'complete' | 'error' }
  | { type: 'SET_RESULTS'; results: { changelog: string; metadata: unknown } | null }

const initialState: AppState = {
  screen: 'welcome',
  repository: null,
  releases: [],
  selectedRelease: null,
  comparisonRelease: null,
  analysisMode: 'release-changelog',
  bugDescription: null,
  teamFilter: null,
  teamMembersCache: {},
  timePeriod: '30 days ago',
  config: {},
  executionState: 'idle',
  results: null,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen }
    case 'SET_REPOSITORY':
      return { ...state, repository: action.repository }
    case 'SET_RELEASES':
      return { ...state, releases: action.releases }
    case 'SELECT_RELEASE':
      return { ...state, selectedRelease: action.release }
    case 'SET_COMPARISON_RELEASE':
      return { ...state, comparisonRelease: action.release }
    case 'SET_ANALYSIS_MODE':
      return { ...state, analysisMode: action.mode }
    case 'SET_BUG_DESCRIPTION':
      return { ...state, bugDescription: action.description }
    case 'SET_TEAM_FILTER':
      return { ...state, teamFilter: action.filter }
    case 'CACHE_TEAM_MEMBERS':
      return {
        ...state,
        teamMembersCache: {
          ...state.teamMembersCache,
          [action.teamSlug]: action.members,
        },
      }
    case 'SET_TIME_PERIOD':
      return { ...state, timePeriod: action.period }
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.config } }
    case 'SET_EXECUTION_STATE':
      return { ...state, executionState: action.state }
    case 'SET_RESULTS':
      return { ...state, results: action.results }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
