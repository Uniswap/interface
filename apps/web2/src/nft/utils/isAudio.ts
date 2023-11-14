const set = new Set<string>(['mp3', 'wav'])

export const isAudio = (file: string) => {
  if (!file) return false

  const fileType = file.substring(file.lastIndexOf('.') + 1)

  return set.has(fileType)
}
