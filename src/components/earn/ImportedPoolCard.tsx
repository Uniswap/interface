import { isEqual } from 'lodash'
import { FarmSummary, useImportedFarmRegistry } from 'pages/Earn/useFarmRegistry'
import React, { useEffect, useState } from 'react'

interface Props {
  farmAddress: string
  onUpdateFarm: (farmSummary: FarmSummary) => void
}

export const ImportedPoolCard: React.FC<Props> = ({ farmAddress, onUpdateFarm }: Props) => {
  const farmSummary = useImportedFarmRegistry(farmAddress)
  const [prevFarmSummary, setPrevFarmSummary] = useState<FarmSummary | undefined>(undefined)
  useEffect(() => {
    if (farmSummary && !isEqual(farmSummary, prevFarmSummary)) {
      setPrevFarmSummary(farmSummary)
      onUpdateFarm(farmSummary)
    }
  }, [farmSummary, onUpdateFarm, prevFarmSummary])
  return null
}
