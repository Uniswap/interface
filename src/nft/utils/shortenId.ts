export const shortenId = (id: string, chars = 4) => {
  return id.length > chars * 2 + 3 ? `${id.substring(0, chars)}...${id.substring(id.length - chars)}` : id
}
