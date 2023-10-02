export interface TabbedNav {
  title: React.ReactNode
  key: string
  component: (...args: any[]) => JSX.Element
  loggingElementName: string
}
