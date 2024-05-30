export default (matrix, size) => {
  const cellSize = size / matrix.length;
  const radius = cellSize / 2;
  let path = '';

  matrix.forEach((row, i) => {
    row.forEach((column, j) => {
      if (column) {
        const cx = j * cellSize + radius;
        const cy = i * cellSize + radius;

        path += `
          M ${cx - radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx + radius},${cy}
          A ${radius},${radius} 0 1,0 ${cx - radius},${cy}
        `;
      }
    });
  });

  return {
    cellSize,
    path,
  };
};
