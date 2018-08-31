async function getRoomData(id) {
  const response = fetch(`./rooms/${id}`)
  const json = response.json()
  return json
}
