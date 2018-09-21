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
  const sum = label => (acc, curr) => acc + parseInt(curr[label])
  const watsonSum = label => (acc, curr) =>
    acc + curr.keywords.reduce(sum(label), 0)

  const count = label => (acc, curr) => (curr[label] != 0 ? acc + 1 : acc)

  const watsonCount = label => (acc, curr) =>
    acc + curr.keywords.reduce(count(label), 0)

  nanClamp = num => (isNaN(num) ? 0 : num)

  return R.flatten(
    response.map(r => {
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

      return {
        labels: ['Anger', 'Joy', 'Sorrow', 'Surprise', 'Fear', 'Disgust'],
        datasets: [
          {
            label: 'Emotion data',
            data: [
              nanClamp(angerMean),
              nanClamp(joyMean),
              nanClamp(sadnessMean),
              nanClamp(surpriseMean),
              nanClamp(fearMean),
              nanClamp(disgustMean)
            ]
          }
        ]
      }
    })
  )[0]
}
