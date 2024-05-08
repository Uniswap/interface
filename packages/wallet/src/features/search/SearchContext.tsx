export interface SearchContext {
  category?: string
  query?: string
  position?: number
  suggestionCount?: number
  isHistory?: boolean // history item click
}
