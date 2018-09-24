const sum = label => (acc, curr) => acc + parseInt(curr[label])
const watsonSum = label => (acc, curr) =>
  acc + curr.keywords.reduce(sum(label), 0)

const count = label => (acc, curr) => (curr[label] != 0 ? acc + 1 : acc)

const watsonCount = label => (acc, curr) =>
  acc + curr.keywords.reduce(count(label), 0)

const nanClamp = num => (isNaN(num) ? 0 : num)

async function getRoomData(id) {
  const response = await fetch(`./rooms/${id}`)
  const json = await response.json()
  return json
}

function separateDataByUsers(response) {
  const { google, watson, users } = response
  const ids = R.keys(users)

  const formatted = ids.map(id => {
    const googleById = google.filter(g => g.user_id == id)
    const watsonById = watson.filter(g => g.user_id == id)

    return {
      user: users[id],
      google: googleById,
      watson: watsonById
    }
  })

  return formatted
}

function googleRadarDatasetFromResponse(response) {
  const data = response.reduce(
    (acc, r) => {
      const gJoy = r.google.reduce(sum('joy'), 0)
      const gSorrow = r.google.reduce(sum('sorrow'), 0)
      const gAnger = r.google.reduce(sum('anger'), 0)
      const gSurprise = r.google.reduce(sum('surprise'), 0)

      const gJoyCount = r.google.reduce(count('joy'), 0)
      const gSorrowCount = r.google.reduce(count('sorrow'), 0)
      const gAngerCount = r.google.reduce(count('anger'), 0)
      const gSurpriseCount = r.google.reduce(count('surprise'), 0)

      const wJoy = r.watson.reduce(watsonSum('joy'), 0)
      const wFear = r.watson.reduce(watsonSum('fear'), 0)
      const wDisgust = r.watson.reduce(watsonSum('disgust'), 0)
      const wAnger = r.watson.reduce(watsonSum('anger'), 0)
      const wSadness = r.watson.reduce(watsonSum('sadness'), 0)

      const wJoyCount = r.watson.reduce(watsonCount('joy'), 0)
      const wFearCount = r.watson.reduce(watsonCount('fear'), 0)
      const wDisgustCount = r.watson.reduce(watsonCount('disgust'), 0)
      const wAngerCount = r.watson.reduce(watsonCount('anger'), 0)
      const wSadnessCount = r.watson.reduce(watsonCount('sadness'), 0)

      const joyMean = (gJoy + wJoy) / (gJoyCount + wJoyCount)
      const surpriseMean = gSurprise / gSurpriseCount
      const angerMean = (gAnger + wAnger) / (gAngerCount + wAngerCount)
      const fearMean = wFear / wFearCount
      const sadnessMean = (gSorrow + wSadness) / (gSorrowCount + wSadnessCount)
      const disgustMean = wDisgust / wDisgustCount

      return [
        acc[0] + angerMean,
        acc[1] + joyMean,
        acc[2] + sadnessMean,
        acc[3] + surpriseMean,
        acc[4] + fearMean,
        acc[5] + disgustMean
      ]
    },
    [0, 0, 0, 0, 0, 0]
  )

  const average = data.map(d => d / response.length)

  return {
    labels: ['Anger', 'Joy', 'Sorrow', 'Surprise', 'Fear', 'Disgust'],
    datasets: [
      {
        label: 'Your emotions',
        data: average
      }
    ]
  }
}

function watsonWordsFromResponse(response) {
  return R.flatten(response.map(r => r.watson.map(w => w.keywords)))
}

//contents: "That test was so long!  Four hours!  I really do not understand why we have to take this test anyway.  Are our grade point averages (GPAs) not good enough for college?"
//created_at: "2018-09-21T12:30:30.002Z"
//id: "1"
//keywords: (4) [{…}, {…}, {…}, {…}]
//relevance: 0.955942988395691
//room_id: 1
//user_id: 1
//watson_id: 1

//anger: 1.40659496188164
//disgust: 0.2797899954020975
//fear: 0.518645010888575
//joy: 0.5065650120377551
//sadness: 0.93511998653412
function marimekkoDataFromResponse(response) {
  const computeAverageEmotions = kw => {
    const keywords = kw.reduce(
      (acc, curr) => {
        return Object.assign(
          {},
          {
            anger: acc.anger + curr.anger,
            disgust: acc.disgust + curr.disgust,
            fear: acc.fear + curr.fear,
            joy: acc.joy + curr.joy,
            sadness: acc.sadness + curr.sadness
          }
        )
      },
      {
        anger: 0,
        disgust: 0,
        fear: 0,
        joy: 0,
        sadness: 0
      }
    )

    const avgKeywords = R.map(val => val / kw.length, keywords)

    return avgKeywords
  }

  const formattedWatsonData = response.watson.map(w =>
    Object.assign(
      computeAverageEmotions(w.keywords),
      {
        type: 'watson',
        timestamp: new Date(w.created_at).getTime()
      },
      R.omit(
        [
          'id',
          'contents',
          'keywords',
          'created_at',
          'relevance',
          'room_id',
          'user_id',
          'watson_id'
        ],
        w
      )
    )
  )

  const formattedGoogleData = response.google.map(g =>
    Object.assign(
      {},
      {
        type: 'google',
        timestamp: new Date(g.created_at).getTime()
      },
      R.omit(
        [
          'id',
          'detection_confidence',
          'image',
          'room_id',
          'user_id',
          'created_at'
        ],
        g
      )
    )
  )

  const allData = [...formattedWatsonData, ...formattedGoogleData].sort(
    (a, b) => a.timestamp < b.timestamp
  )

  // TODO: Make it work for all array sizes
  const SAMPLES = 24
  const perSlice = allData.length / SAMPLES
  const out = []
  let prevTimestamp = 0

  for (let i = 0; i < allData.length; i++) {
    if (i % perSlice === 0) {
      prevTimestamp = allData[i].timestamp
    }

    out[i] = Object.assign({}, allData[i], { timestamp: prevTimestamp })
  }

  out.map(o => console.log(o.timestamp))
}
