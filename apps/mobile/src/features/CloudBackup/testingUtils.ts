import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

const generateRandomId = (): string => {
  let randomId = '0x'
  for (let i = 0; i < 40; i++) {
    randomId += Math.floor(Math.random() * 16).toString(16)
  }
  return randomId
}

const generateRandomDate = (): number => {
  const start = new Date(2023, 4, 12)
  const end = new Date()
  return Math.floor(
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).getTime() / 1000
  )
}

export const useMockCloudBackups = (numberOfBackups?: number): CloudStorageMnemonicBackup[] => {
  const number = numberOfBackups ?? 1

  const mockBackups = Array.from({ length: number }, () => ({
    mnemonicId: generateRandomId(),
    createdAt: generateRandomDate(),
  }))

  return mockBackups
}
