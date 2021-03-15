// Use this script to serve the build folder.
// You can use this to serve the app
// over providers like heroku or your own web server

const express = require('express')
const path = require('path')

const app = express()
const distDir = path.join(__dirname, 'build/')
const port = process.env.PORT || 8080

app.use(express.static(distDir))

// Handle get requests to return the build app.
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distDir, 'index.html'))
})

app.listen(port)
