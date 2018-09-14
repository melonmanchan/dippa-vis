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

function googleDatasetFromResponse(response) {
  return R.flatten(
    response.map(r => {
      // TODO: other kinds of data
      const joyData = r.google.map(g => {
        const data = { x: g.created_at, y: g.joy }
        return data
      })

      const sorrowData = r.google.map(g => {
        const data = { x: g.created_at, y: g.sorrow }
        return data
      })

      const surpriseData = r.google.map(g => {
        const data = { x: g.created_at, y: g.surprise }
        return data
      })

      const angerData = r.google.map(g => {
        const data = { x: g.created_at, y: g.anger }
        return data
      })

      return [
        {
          label: 'Anger',
          backgroundColor: color(chartColors.red)
            .alpha(0.5)
            .rgbString(),
          borderColor: chartColors.green,
          fill: false,
          data: angerData
        },
        {
          label: 'Joy',
          backgroundColor: color(chartColors.red)
            .alpha(0.5)
            .rgbString(),
          borderColor: chartColors.red,
          fill: false,
          data: joyData
        },
        {
          label: 'Sorrow',
          backgroundColor: color(chartColors.blue)
            .alpha(0.5)
            .rgbString(),
          borderColor: chartColors.blue,
          fill: false,
          data: sorrowData
        },
        {
          label: 'Surprise',
          backgroundColor: color(chartColors.yellow)
            .alpha(0.5)
            .rgbString(),
          borderColor: chartColors.yellow,
          fill: false,
          data: surpriseData
        }
      ]
    })
  )
}
