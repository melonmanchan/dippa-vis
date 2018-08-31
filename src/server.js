const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const mountRoutes = require('./routes')

const app = express()
const PORT = 3000

mountRoutes(app)
app.get('/', express.static(path.join(__dirname, '/public')))
app.use(bodyParser.json())

app.listen(3000, () => console.log('Example app listening on port 3000!'))
