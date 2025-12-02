import { ApolloError } from '@apollo/client'
import { Row, RowData, Table as TanstackTable } from '@tanstack/react-table'

export type TableBodyProps<T extends RowData = unknown> = {
  table: TanstackTable<T>
  loading?: boolean
  error?: ApolloError | boolean
  v2: boolean
  rowWrapper?: (row: Row<T>, content: JSX.Element) => JSX.Element
}
