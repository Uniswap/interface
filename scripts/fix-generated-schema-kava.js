/* eslint-env node */
const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, '../src/graphql/data/__generated__/types-and-hooks.ts')

const content = fs.readFileSync(filePath)
// console.log(content.toString().replace("Polygon = 'POLYGON',", "Polygon = 'POLYGON',Kava = 'KAVA',"))
fs.writeFileSync(filePath, content.toString().replace("Polygon = 'POLYGON',", "Polygon = 'POLYGON',Kava = 'KAVA',"))
