const Router = require('express-promise-router')
const db = require('../db')
const router = new Router()

// export our router to be mounted by the parent application
module.exports = router

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
  res.send(rows[0])
})
