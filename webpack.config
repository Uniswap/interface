module.exports = {
  entry: [
    path.join(process.cwd(), 'app/app.tsx'), // or whatever the path of your root file is
  ]
  module: {
    rules:[{ test: /\.tsx?$/, loader: 'awesome-typescript-loader' }], // other loader configuration goes in the array
    resolve: {extensions: ['.js', '.jsx', '.react.js', '.ts', '.tsx']} 
  }
}