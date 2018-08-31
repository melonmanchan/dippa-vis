const rooms = require('./rooms')

module.exports = app => {
  app.use('/rooms', rooms)
}
