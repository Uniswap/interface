import { UseSortByColumnOptions, UseSortByColumnProps, UseSortByOptions, UseSortByState } from 'react-table'

/* https://github.com/TanStack/table/issues/2970 */
declare module 'react-table' {
  export interface TableOptions<D extends Record<string, unknown>>
    extends UseExpandedOptions<D>,
      UseSortByOptions<D>,
      Record<string, any> {}

  export interface TableState<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseColumnOrderState<D>,
      UseSortByState<D> {}

  export interface ColumnInterface<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseFiltersColumnOptions<D>,
      UseSortByColumnOptions<D> {}

  export interface ColumnInstance<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseFiltersColumnProps<D>,
      UseSortByColumnProps<D> {}
}
