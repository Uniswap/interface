export default (matrix, size) => {
  const cellSize = size / matrix.length
  let path = ''

  matrix.forEach((row, i) => {
    row.forEach((column, j) => {
      if (column) {
        path += `
        M ${cellSize * j + cellSize / 2} ${cellSize * i}
        A ${cellSize / 2.2} 0 0 1 1 ${cellSize * j + cellSize / 2 - 0.0001} ${
          cellSize * i - 0.00001
        }`
      }
    })
  })

  return {
    cellSize,
    path,
  }
}
