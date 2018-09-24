const Router = require('express-promise-router')
const db = require('../db')
const router = new Router()
const R = require('ramda')

// export our router to be mounted by the parent application
module.exports = router

router.get('/:id', async (req, res) => {
  const { id } = req.params

  const { rows: googleRow } = await db.query(
    'SELECT * FROM google_results WHERE room_id = $1;',
    [id]
  )

  const { rows: watsonRow } = await db.query(
    'SELECT keywords.contents as keyword_content, * FROM keywords JOIN watson_results ON watson_results.id = keywords.watson_id WHERE watson_results.room_id = $1;',
    [id]
  )

  const { rows: roomsRow } = await db.query(
    'SELECT * FROM rooms WHERE id = $1;',
    [id]
  )

  const userIds = R.uniq(
    watsonRow.map(w => w.user_id),
    googleRow.map(g => g.user_id)
  )

  const { rows: usersRow } = await db.query(
    'SELECT * FROM users WHERE id = ANY($1::int[])',
    [userIds]
  )

  const userMap = usersRow.reduce((acc, curr) => {
    acc[curr.id] = curr
    return acc
  }, {})

  res.json({
    google: googleRow.map(googleFixNumeric).sort(sortByDate),
    watson: fixWatsonKeywords(watsonRow).sort(sortByDate),
    rooms: roomsRow,
    users: userMap
  })
})

const googleFixNumeric = g =>
  Object.assign({}, g, {
    anger: parseInt(g.anger),
    detection_confidence: parseInt(g.detection_confidence),
    joy: parseInt(g.joy),
    blurred: parseInt(g.blurred),
    sorrow: parseInt(g.sorrow),
    surprise: parseInt(g.surprise)
  })

function sortByDate(a, b) {
  return new Date(a.created_at) - new Date(b.created_at)
}

function fixWatsonKeywords(kw) {
  return kw
    .reduce((acc, curr) => {
      const ind = acc.findIndex(w => w.watson_id == curr.id)

      if (ind === -1) {
        curr.keywords = [
          {
            word: curr.keyword_content,
            sentiment: 5 * curr.sentiment,
            joy: 5 * curr.joy,
            fear: 5 * curr.fear,
            disgust: 5 * curr.disgust,
            sadness: 5 * curr.sadness,
            anger: 5 * curr.anger
          }
        ]

        acc.push(curr)
        return acc
      }

      acc[ind].keywords = acc[ind].keywords || []

      acc[ind].keywords.push({
        word: curr.keyword_content,
        sentiment: 5 * curr.sentiment,
        joy: 5 * curr.joy,
        fear: 5 * curr.fear,
        disgust: 5 * curr.disgust,
        sadness: 5 * curr.sadness,
        anger: 5 * curr.anger
      })

      return acc
    }, [])
    .map(
      R.omit([
        'keyword_content',
        'anger',
        'sentiment',
        'joy',
        'sadness',
        'fear',
        'disgust',
        'anger'
      ])
    )
}
