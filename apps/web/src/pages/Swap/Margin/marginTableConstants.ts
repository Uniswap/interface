// Positions-table geometry shared with MarginTerminalLayout's row budget. It lives here rather than in
// MarginPositionsTable because the layout wraps every swap tab and sits in the main chunk, while the
// table is deferred-imported — reading a constant off the table would pull it into the entry chunk.
export const MARGIN_TABLE_ROW_HEIGHT = 72
// Positions pane chrome above the first row: Active/Closed tabs, the 12px gap under them, and the
// table's own header row with its sticky spacer.
export const MARGIN_TABLE_PANE_CHROME = 106
// The Active tab's column ids. The expanded row lays its figures out under these same columns, so the
// table and the drawer must name them from one place.
export const MARGIN_ACTIVE_COLUMN = {
  pair: 'pair',
  markEntry: 'markEntry',
  pnl: 'pnl',
  liqPrice: 'liqPrice',
  size: 'size',
  margin: 'margin',
  opened: 'opened',
  utility: 'utility',
} as const
export type MarginActiveColumnId = (typeof MARGIN_ACTIVE_COLUMN)[keyof typeof MARGIN_ACTIVE_COLUMN]
