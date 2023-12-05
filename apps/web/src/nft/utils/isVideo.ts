import extensions from 'video-extensions'

export const isVideo = (path: string | null) => extensions.find((ext) => path?.endsWith(`.${ext}`)) !== undefined
