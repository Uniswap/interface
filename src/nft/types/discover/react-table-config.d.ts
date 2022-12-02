import { UseSortByColumnOptions, UseSortByColumnProps, UseSortByOptions, UseSortByState } from 'react-table'

/* https://github.com/TanStack/table/issues/2970 */
declare module 'react-table' {
  // eslint-disable-next-line import/no-unused-modules
  export interface TableOptions<D extends Record<string, unknown>>
    extends UseExpandedOptions<D>,
      UseSortByOptions<D>,
      Record<string, any> {}

  // eslint-disable-next-line import/no-unused-modules
  export interface TableState<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseColumnOrderState<D>,
      UseSortByState<D> {}

  // eslint-disable-next-line import/no-unused-modules
  export interface ColumnInterface<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseFiltersColumnOptions<D>,
      UseSortByColumnOptions<D> {}

  // eslint-disable-next-line import/no-unused-modules
  export interface ColumnInstance<D extends Record<string, unknown> = Record<string, unknown>>
    extends UseFiltersColumnProps<D>,
      UseSortByColumnProps<D> {}
}
