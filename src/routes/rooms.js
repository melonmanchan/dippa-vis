const Router = require('express-promise-router')
const db = require('../db')
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

router.get('/:id', async (req, res) => {
  const { id } = req.params

  const { rows: googleRow } = await db.query(
    'SELECT * FROM google_results WHERE room_id = $1;',
    [id]
  )

  const { rows: watsonRow } = await db.query(
    'SELECT * FROM watson_results WHERE room_id = $1;',
    [id]
  )

  const { rows: roomsRow } = await db.query(
    'SELECT * FROM rooms WHERE id = $1;',
    [id]
  )

  res.json({
    google: googleRow,
    watson: watsonRow,
    rooms: roomsRow
  })
})
