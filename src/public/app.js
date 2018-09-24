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
    return { text: d.word, size: Math.max(d[label] * 11, 11) }
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

function initEmotionsMarimekko() {
  const margin = { top: 10, right: 20, bottom: 30, left: 30 }

  const emotionsToColor = {
    joy: '#1abc9c',
    surprise: '#e74c3c',
    anger: '#f1c40f',
    fear: '#ecf0f1',
    sadness: '#2c3e50',
    disgust: '#2ecc71'
  }

  const width = 960 - margin.left - margin.right
  const height = 450 - margin.top - margin.bottom
  const color = d3.scale.category10()
  const n = d3.format(',.0f')
  const p = d3.format('%')
  const data = [
    { emotion: 'joy', timestamp: 'Almond lovers', value: 3840 },
    { emotion: 'joy', timestamp: 'Berry buyers', value: 1920 },
    { emotion: 'joy', timestamp: 'Carrots-n-more', value: 960 },
    { emotion: 'joy', timestamp: 'Delicious-n-new', value: 400 },

    { emotion: 'surprise', timestamp: 'Almond lovers', value: 1600 },
    { emotion: 'surprise', timestamp: 'Berry buyers', value: 1440 },
    { emotion: 'surprise', timestamp: 'Carrots-n-more', value: 960 },
    { emotion: 'surprise', timestamp: 'Delicious-n-new', value: 400 },

    { emotion: 'anger', timestamp: 'Almond lovers', value: 640 },
    { emotion: 'anger', timestamp: 'Berry buyers', value: 960 },
    { emotion: 'anger', timestamp: 'Carrots-n-more', value: 640 },
    { emotion: 'anger', timestamp: 'Delicious-n-new', value: 400 },

    { emotion: 'fear', timestamp: 'Almond lovers', value: 320 },
    { emotion: 'fear', timestamp: 'Berry buyers', value: 480 },
    { emotion: 'fear', timestamp: 'Carrots-n-more', value: 640 },
    { emotion: 'fear', timestamp: 'Delicious-n-new', value: 400 },

    { emotion: 'sadness', timestamp: 'Almond lovers', value: 320 },
    { emotion: 'sadness', timestamp: 'Berry buyers', value: 480 },
    { emotion: 'sadness', timestamp: 'Carrots-n-more', value: 640 },
    { emotion: 'sadness', timestamp: 'Delicious-n-new', value: 400 },

    { emotion: 'disgust', timestamp: 'Almond lovers', value: 320 },
    { emotion: 'disgust', timestamp: 'Berry buyers', value: 480 },
    { emotion: 'disgust', timestamp: 'Carrots-n-more', value: 640 },
    { emotion: 'disgust', timestamp: 'Delicious-n-new', value: 400 }
  ]

  function title(d) {
    return d.timestamp + ': ' + d.parent.key + ': ' + n(d.value)
  }

  var nest = d3
    .nest()
    .key(function(d) {
      return d.timestamp
    })
    .key(function(d) {
      return d.emotion
    })

  var treemap = d3.layout
    .treemap()
    .mode('slice-dice')
    //.padding(function(d) { return d.depth > 1 ? 2 : 0; })
    .size([width, height])
    .children(function(d) {
      return d.values
    })
    .sort(null)

  var svg = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('margin-left', -margin.left + 'px')
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .datum({ values: nest.entries(data) })
    .call(chart)

  svg
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + treemap.size()[1] + ')')
    .call(
      d3.svg
        .axis()
        .scale(d3.scale.linear().range([0, treemap.size()[0]]))
        .tickFormat(d3.format('%'))
    )

  function chart(selection) {
    selection.each(function() {
      var cell = d3
        .select(this)
        .selectAll('g.cell')
        .data(treemap.nodes)

      var cellEnter = cell
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })

      cellEnter
        .filter(function(d) {
          return d.depth > 2
        })
        .append('rect')
        .style('fill', function(d) {
          return d.children ? null : emotionsToColor[d.emotion]
        })

      cellEnter.append('title')

      d3
        .transition(cell)
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')'
        })
        .select('rect')
        .attr('width', function(d) {
          return d.dx
        })
        .attr('height', function(d) {
          return d.dy
        })

      cell.select('title').text(function(d) {
        return d.children ? null : title(d)
      })

      d3
        .transition(cell.exit())
        .attr('width', 1e-6)
        .attr('height', 1e-6)
        .remove()
    })
  }
}
