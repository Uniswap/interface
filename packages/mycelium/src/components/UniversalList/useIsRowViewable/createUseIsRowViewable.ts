import { useState } from 'react'
import { ROW_VIEWABILITY_CONFIG_ID } from '../consts'

type ViewabilityReport = { key: string; isViewable: boolean }

/** The subset of Legend's `useViewability` signature shared by its `/react` and `/react-native` entry points. */
type UseViewability = (callback: (viewToken: ViewabilityReport) => void, configId?: string) => void

/** Builds the platform leg of `useIsRowViewable`; only Legend's `useViewability` import differs per platform. */
export function createUseIsRowViewable(useViewability: UseViewability): (rowKey: string | undefined) => boolean {
  return function useIsRowViewable(rowKey: string | undefined): boolean {
    const [report, setReport] = useState<ViewabilityReport | null>(null)

    useViewability((viewToken) => {
      setReport((prev) =>
        prev?.key === viewToken.key && prev.isViewable === viewToken.isViewable
          ? prev
          : { key: viewToken.key, isViewable: viewToken.isViewable },
      )
    }, ROW_VIEWABILITY_CONFIG_ID)

    // Reports are per item key, so a recycled container's last report may be for its previous item.
    if (report === null) {
      return rowKey === undefined
    }
    return report.key === rowKey && report.isViewable
  }
}
