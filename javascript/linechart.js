
var line1, circles1
var line2, circles2
var x_line, y_line
var grouped
var place1, place2
var timeperiods

// Create function
function create_linechart(place) {
  const margin = {top: 10, right: 100, bottom: 100, left: 100},
      width = 1000 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom

  place1 = place[0]
  place2 = place[1]

  // Create SVG
  var linechart = d3.select("#linechart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  // Adding captions
  linechart
  .append("text")
  .attr("text-anchor", "start")
  .attr("x", -height / 2 - (margin.bottom))
  .attr("y", -margin.left * .6)
  .attr("transform", "rotate(-90)")
  .attr("width", 90)
  .html("sunshine duration (in hours)")
  .attr("class", "legend")

  linechart
  .append("text")
  .attr("x", width / 2 - (margin.left / 2))
  .attr("y", height + margin.bottom / 2)
  .html("month")
  .attr("class", "legend")


  timeperiods = ["jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug","sep","oct","nov","dec"]

  // Parse Data
  d3.csv("assets/cleaned_sunshine.csv")
  .then(function(data) {
    grouped = d3.group(data, d=>d.city)

    // Make x-axis
    x_line = d3.scaleBand()
    .domain(timeperiods)
    .range([ 0, width])
    .padding(.2);

    // Call y-axis
    linechart.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "axes")
    .call(d3.axisBottom(x_line))
    .selectAll("text")                                   // text
    .attr("transform", "rotate(-45)")    // rotate text and moves backward
    .style("text-anchor", "end")

    // Make Y-axis
    y_line = d3.scaleLinear()
    .domain([0, 500])
    .range([ height, 0 ]);

    // call Y-axis
    linechart.append("g")
    .attr("class", "axes")
    .call(d3.axisLeft(y_line))
    .selectAll("text")

    // Adding path 1
    line1 = linechart.append("path")
    .data([grouped.get(place[0])])
    .attr("class", "line")
    .style("stroke", color1)
    .style("stroke-width", "2px")
    .style("fill","none")
    .attr("d", d3.line()
    .x(function(d) { return x_line(d.month) })
    .y(function(d) { return y_line(d.value) }))

    circles1 = linechart.selectAll("myCircles")
    .data(grouped.get(place[0]))
    .enter()
    .append("circle")
    .attr("fill",color1)
    .attr("stroke", "none")
    .attr("cx", function(d) {return x_line(d.month)})
    .attr("cy", function(d) {return y_line(d.value)})
    .attr("r", 4)
    .attr("pointer-events", "all")
    .on("mouseover", linemouseover)
    .on("mouseout", linemouseout)

    // line 2

    line2 = linechart.append("path")
    .data([grouped.get(place[1])])
    .attr("class", "line")
    .style("stroke", color2)
    .style("stroke-width", "2px")
    .style("fill","none")
    .attr("d", d3.line()
    .x(function(d) { return x_line(d.month) })
    .y(function(d) { return y_line(d.value) }))

    circles2 = linechart.selectAll("myCircles")
    .data(grouped.get(place[1]))
    .enter()
    .append("circle")
    .attr("fill",color2)
    .attr("stroke", "none")
    .attr("cx", function(d) {return x_line(d.month)})
    .attr("cy", function(d) {return y_line(d.value)})
    .attr("r", 4)
    .attr("pointer-events", "all")
    .on("mouseover", linemouseover)
    .on("mouseout", linemouseout)
  }).catch(function(error){
    // handle error
  })
}

// Updating the colors

function updateFirstLine(selectedGroup) {

  place1 = selectedGroup

  // Create new data with the selection?
  var dataFilter = grouped.get(selectedGroup)

  // Give these new data to update line
  line1
  .data([dataFilter])
  .transition()
  .duration(1000)
  .attr("d", d3.line()
      .x(function(d) { return x_line(d.month) })
      .y(function(d) { return y_line(d.value) })
  )

  circles1
  .data(dataFilter)
  .transition()
  .duration(1000)
  .attr("cx", function(d) {return x_line(d.month)})
  .attr("cy", function(d) {return y_line(d.value)})

}

function updateSecondLine(selectedGroup) {

  place2 = selectedGroup

  // Create new data with the selection?
  var dataFilter = grouped.get(selectedGroup)

  // Give these new data to update line
  line2
  .data([dataFilter])
  .transition()
  .duration(1000)
  .attr("d", d3.line()
      .x(function(d) { return x_line(d.month) })
      .y(function(d) { return y_line(d.value) })
  )

  circles2
  .data(dataFilter)
  .transition()
  .duration(1000)
  .attr("cx", function(d) {return x_line(d.month)})
  .attr("cy", function(d) {return y_line(d.value)})

}


// Mouseover
function linemouseover(event, d) {
  d3.select(this).style("stroke", "black").style("stroke-width",3);
  tooltip
  .html("City: " + d.city + "<br> Month: " + d.month +
      "<br> Monthly Sunshine Duration: " + d.value + " hours" + "<br>~"
  + (d.value/30).toFixed(2) + " hrs/day")
  .style("display", "")
  .style("left", event.pageX + "px")
  .style("top", event.pageY + "px")
}

// ONMOUSEOUT p2
function linemouseout() {
  d3.select(this).style("stroke-width", 0)
  tooltip.style("display", "none");
}


// Tooltip
var tooltip = d3
.select("#linechart")
.append("div")
.style("display", "none")
.attr("class","tooltip")


create_linechart(["Boston", "Los Angeles"])

// Textual info
function getLineInfo() {
  months =
      ["January", "February", "March", "April", "May", "June",
        "July", "August","September","October","November","December"]

  beginning = "Sunshine duration is the duration of sunshine each month. It "
      + "is unclear what particular year this data was collected but assumed to "
      + "be around 2015-2016. Duration measurements can be used characterize "
      + "the climate of places, and comparing against the psychological benefits"
      + "of  Sun for humans. Sunshine duration doesn't mean it's neccesarily night but it's not "
      + "sunny (can be cloudy)."


  place1Data = grouped.get(place1).map(v => parseFloat(v.value))
  place2Data = grouped.get(place2).map(v => parseFloat(v.value))

  place1info = `In ${place1}, ${months[place1Data.indexOf(d3.max(place1Data))]} 
  has the highest sunshine duration of ${d3.max(place1Data)} hours (~${(d3.max(place1Data)/30).toFixed(2)} hrs/day).
   ${months[place1Data.indexOf(d3.min(place1Data))]} has the lowest 
   sunshine duration of ${d3.min(place1Data)} hours (~${(d3.min(place1Data)/30).toFixed(2)} hrs/day).
  `

  place2info = `In ${place2}, ${months[place2Data.indexOf(d3.max(place2Data))]} 
  has the highest sunshine duration of ${d3.max(place2Data)} hours (~${(d3.max(place2Data)/30).toFixed(2)} hrs/day).
   ${months[place2Data.indexOf(d3.min(place2Data))]} has the lowest 
   sunshine duration of ${d3.min(place2Data)} hours (~${(d3.min(place2Data)/30).toFixed(2)} hrs/day).
  `


  if (place1 == place2) {
    return beginning + " <br><br>" + place1info
  }

  return beginning + " <br><br>" + place1info + "<br><br>" + place2info

}



