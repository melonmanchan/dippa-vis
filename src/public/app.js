const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}

const color = Chart.helpers.color

function initEmotionsRadarChart(data, selector) {
  const ctx = document.getElementById(selector).getContext('2d')

  const config = {
    type: 'radar',
    data: data
  }

  new Chart(ctx, config)
}

function initEmotionsWordCloud(words, label, selector) {
  console.log(words)
  console.log(label)
  console.log(selector)
  d3
    .select(selector)
    .select('svg')
    .remove()

  const fill = d3.scale.category20()

  const formattedWords = words.map(function(d) {
    return { text: d.word, size: d[label] * 11 }
  })

  d3.layout
    .cloud()
    .size([800, 600])
    .words(formattedWords)
    .padding(5)
    .rotate(function() {
      return 0
    })
    .font('Impact')
    .fontSize(function(d) {
      return d.size
    })
    .on('end', draw)
    .start()

  function draw(words) {
    d3
      .select(selector)
      .append('svg')
      .attr('width', 800)
      .attr('height', 600)
      .append('g')
      .attr('transform', 'translate(400,300)')
      .selectAll('text')
      .data(words)
      .enter()
      .append('text')
      .style('font-size', function(d) {
        return d.size + 'px'
      })
      .style('font-family', 'Impact')
      .attr('text-anchor', 'middle')
      .attr('transform', function(d) {
        return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'
      })
      .text(function(d) {
        return d.text
      })
  }
}
