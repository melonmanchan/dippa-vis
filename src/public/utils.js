const sum = label => (acc, curr) => acc + parseInt(curr[label])
const watsonSum = label => (acc, curr) =>
  acc + curr.keywords.reduce(sum(label), 0)

const count = label => (acc, curr) => (curr[label] != 0 ? acc + 1 : acc)

const watsonCount = label => (acc, curr) =>
  acc + curr.keywords.reduce(count(label), 0)

const nanClamp = num => (isNaN(num) ? 0 : num)

const getQueryParam = () => {
  const urlParams = new URLSearchParams(window.location.search)

  return key => urlParams.get(key)
}

async function getRoomData(id) {
  const response = await fetch(`/rooms/${id}`)
  const json = await response.json()
  return json
}

async function getAllRooms() {
  const response = await fetch('/rooms')
  const json = await response.json()
  return json
}

async function submitExportRequest(
  email,
  selectedUserId,
  userEmotion,
  groupEmotion,
  userMarimekkoState,
  groupMarimekkoState
) {
  const payload = {
    email,
    selectedUserId,
    userEmotion,
    groupEmotion,
    userMarimekkoState,
    groupMarimekkoState
  }

  const rawResponse = await fetch('http://localhost:3001/export', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const content = await rawResponse.json()

  return content
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

function googleRadarDatasetFromResponse(response, label, currentEmotion) {
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

  const labels = ['Anger', 'Fear', 'Sadness', 'Joy', 'Surprise', 'Disgust']

  const pointRadius = labels.map(
    l => (l.toLowerCase() === currentEmotion ? 7 : 5)
  )

  return {
    labels: labels,
    datasets: [
      {
        label: label,
        data: average,
        pointBackgroundColor: [
          emotionsToColor.anger,
          emotionsToColor.fear,
          emotionsToColor.sadness,
          emotionsToColor.joy,
          emotionsToColor.surprise,
          emotionsToColor.disgust
        ],
        pointRadius: pointRadius
      }
    ]
  }
}

function watsonWordsFromResponse(response) {
  return R.flatten(response.map(r => r.watson.map(w => w.keywords)))
}

function marimekkoDataFromResponse(response, sampleSize = 24) {
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
    (a, b) => a.timestamp > b.timestamp
  )

  const perSlice = Math.floor(allData.length / sampleSize)
  const out = []
  let prevTimestamp = 0

  for (let i = 0; i < allData.length; i++) {
    if (i % perSlice === 0) {
      prevTimestamp = allData[i].timestamp
    }

    if (!R.isNil(allData[i])) {
      out[i] = Object.assign({}, allData[i], { timestamp: prevTimestamp })
    }
  }

  const grouped = R.groupWith((a, b) => a.timestamp === b.timestamp, out)

  const average = grouped.map(arr => {
    const averageData = arr.reduce(
      (acc, curr) => {
        if (curr.type === 'watson') {
          return {
            joy: curr.joy + acc.joy,
            surprise: acc.surprise,
            anger: curr.anger + acc.anger,
            fear: curr.fear + acc.fear,
            sadness: curr.sadness + acc.sadness,
            disgust: curr.disgust + acc.disgust,
            timestamp: curr.timestamp
          }
        } else if (curr.type === 'google') {
          return {
            joy: curr.joy + acc.joy,
            surprise: curr.surprise + acc.surprise,
            anger: curr.anger + acc.anger,
            fear: acc.fear,
            sadness: curr.sorrow + acc.sadness,
            disgust: acc.disgust,
            timestamp: curr.timestamp
          }
        }

        return acc
      },
      {
        joy: 0,
        surprise: 0,
        anger: 0,
        fear: 0,
        sadness: 0,
        disgust: 0,
        timestamp: 0
      }
    )

    return R.mapObjIndexed(
      (data, key) =>
        typeof data === 'number' && key !== 'timestamp'
          ? data / arr.length
          : data,
      averageData
    )
  })

  const pivotedAverage = average.map(a => [
    { emotion: 'anger', timestamp: a.timestamp, value: a.anger },
    { emotion: 'fear', timestamp: a.timestamp, value: a.fear },
    { emotion: 'sadness', timestamp: a.timestamp, value: a.sadness },
    { emotion: 'joy', timestamp: a.timestamp, value: a.joy },
    { emotion: 'surprise', timestamp: a.timestamp, value: a.surprise },
    { emotion: 'disgust', timestamp: a.timestamp, value: a.disgust }
  ])

  return R.flatten(pivotedAverage)
}

function createRange(start, stop, steps) {
  const out = []

  const diff = stop - start

  for (let i = 0; i <= steps; i++) {
    out[i] = Math.floor(stop - diff * i * 0.1)
  }

  return out.reverse()
}
