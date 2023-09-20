import { screen } from '@testing-library/react'
import { Column } from 'react-table'
import { render } from 'test-utils/render'

import { Table } from '.'

describe('Table', () => {
  // Set up test table
  enum ColumnHeader {
    Column1 = 'Column1',
    Column2 = 'Column2',
    Column3 = 'Column3',
    Column4 = 'Column4',
    Column5 = 'Column5',
  }
  interface ColumnProps {
    column1: string
    column2: string
    column3: string
    column4: string
    column5: string
  }

  const columns: Column<ColumnProps>[] = [
    {
      Header: ColumnHeader.Column1,
      accessor: 'column1',
      Cell: ({ value }: { value: string }) => <div>{value}</div>,
      id: ColumnHeader.Column1,
    },
    {
      Header: ColumnHeader.Column2,
      accessor: 'column2',
      Cell: ({ value }: { value: string }) => <div>{value}</div>,
      id: ColumnHeader.Column2,
    },
    {
      Header: ColumnHeader.Column3,
      accessor: 'column3',
      Cell: ({ value }: { value: string }) => <div>{value}</div>,
      id: ColumnHeader.Column3,
    },
    {
      Header: ColumnHeader.Column4,
      accessor: 'column4',
      Cell: ({ value }: { value: string }) => <div>{value}</div>,
      id: ColumnHeader.Column4,
    },
    {
      Header: ColumnHeader.Column5,
      accessor: 'column5',
      Cell: ({ value }: { value: string }) => <div>{value}</div>,
      id: ColumnHeader.Column5,
    },
  ]

  const data = [
    {
      column1: 'column1-data',
      column2: 'column2-data',
      column3: 'column3-data',
      column4: 'column4-data',
      column5: 'column5-data',
    },
  ]
  const smallHiddenColumns: ColumnHeader[] = [ColumnHeader.Column3, ColumnHeader.Column4, ColumnHeader.Column5]
  const mediumHiddenColumns: ColumnHeader[] = [ColumnHeader.Column4, ColumnHeader.Column5]
  const largeHiddenColumns: ColumnHeader[] = [ColumnHeader.Column5]
  const extraLargeHiddenColumns: ColumnHeader[] = []

  it('shows all columns for extra large breakpoint', () => {
    window.innerWidth = 1280

    render(
      <Table
        columns={columns}
        data={data}
        smallHiddenColumns={smallHiddenColumns}
        mediumHiddenColumns={mediumHiddenColumns}
        largeHiddenColumns={largeHiddenColumns}
        extraLargeHiddenColumns={extraLargeHiddenColumns}
      />
    )

    expect(screen.getByText(ColumnHeader.Column1)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column2)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column3)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column4)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column5)).toBeInTheDocument()
  })

  it('shows all columns for large breakpoint', () => {
    window.innerWidth = 1024

    render(
      <Table
        columns={columns}
        data={data}
        smallHiddenColumns={smallHiddenColumns}
        mediumHiddenColumns={mediumHiddenColumns}
        largeHiddenColumns={largeHiddenColumns}
        extraLargeHiddenColumns={extraLargeHiddenColumns}
      />
    )

    expect(screen.getByText(ColumnHeader.Column1)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column2)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column3)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column4)).toBeInTheDocument()
  })

  it('hides some columns at medium breakpoint', () => {
    window.innerWidth = 768

    render(
      <Table
        columns={columns}
        data={data}
        smallHiddenColumns={smallHiddenColumns}
        mediumHiddenColumns={mediumHiddenColumns}
        largeHiddenColumns={largeHiddenColumns}
        extraLargeHiddenColumns={extraLargeHiddenColumns}
      />
    )

    expect(screen.getByText(ColumnHeader.Column1)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column2)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column3)).toBeInTheDocument()
  })

  it('hides some columns at small breakpoint', () => {
    window.innerWidth = 640

    render(
      <Table
        columns={columns}
        data={data}
        smallHiddenColumns={smallHiddenColumns}
        mediumHiddenColumns={mediumHiddenColumns}
        largeHiddenColumns={largeHiddenColumns}
        extraLargeHiddenColumns={extraLargeHiddenColumns}
      />
    )

    expect(screen.getByText(ColumnHeader.Column1)).toBeInTheDocument()
    expect(screen.getByText(ColumnHeader.Column2)).toBeInTheDocument()
  })

  it('displays row of data', () => {
    window.innerWidth = 1280

    render(
      <Table
        columns={columns}
        data={data}
        smallHiddenColumns={smallHiddenColumns}
        mediumHiddenColumns={mediumHiddenColumns}
        largeHiddenColumns={largeHiddenColumns}
        extraLargeHiddenColumns={extraLargeHiddenColumns}
      />
    )

    expect(screen.getByText('column1-data')).toBeInTheDocument()
    expect(screen.getByText('column2-data')).toBeInTheDocument()
    expect(screen.getByText('column3-data')).toBeInTheDocument()
    expect(screen.getByText('column4-data')).toBeInTheDocument()
    expect(screen.getByText('column5-data')).toBeInTheDocument()
  })
})
