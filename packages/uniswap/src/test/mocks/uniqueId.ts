function getUniqueId(): Promise<string> {
  return Promise.resolve(Math.random().toString(36).substring(2, 15))
}

export { getUniqueId }
