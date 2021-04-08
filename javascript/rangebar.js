var rangebar
var x_rangebar, y_rangebar
var max_height = 90
var bars
var temps, firstCurdata, secondCurdata;
var rb_selected_by_others

// Parse Data
d3.csv("assets/all_data.csv")
.then(function(data) {

  // Makes an object
  function makeData(city, avg_low, avg_high, avg_rainfall) {
    var obj = {
      city: city,
      avg_low: parseFloat(avg_low),
      avg_high: parseFloat(avg_high),
      avg_rainfall: parseFloat(avg_rainfall)
    }
    return obj
  }

  // Sorts data/x-axis by ascending rainfall
  function ascending(a, b) {
    if (parseFloat(a.avg_annual_rainfall) > parseFloat(b.avg_annual_rainfall))
      return 1;
    if (parseFloat(a.avg_annual_rainfall) < parseFloat(b.avg_annual_rainfall))
      return -1;
    return 0;
  }

  // Filter Data
  temps = data.map(a => makeData(a.city, a.avg_low, a.avg_high, a.avg_annual_rainfall))
  citiesbyrainfall = data.sort(ascending).map(a => a.city)


  // Margins
  var margin = {top: 10, right: 100, bottom: 75, left: 90},
      width = 1000 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom


  // Create SVG
  rangebar = d3.select("#rangebar")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")

  // Caption X-axis
  rangebar.append("text")
  .attr("x", 0 )
  .attr("y", 0 )
  .style("text-anchor", "middle")
  .text("Date");

  rangebar
  .append("text")
  .attr("text-anchor", "start")
  .attr("x", -height / 2 - (margin.bottom))
  .attr("y", -margin.left * .6)
  .attr("transform", "rotate(-90)")
  .attr("width", 90)
  .html("sunshine duration (in hours)")
  .attr("class", "legend")

  rangebar
  .append("text")
  .attr("x", width / 2 - (margin.left / 2))
  .attr("y", height + margin.bottom / 2)
  .html("month")
  .attr("class", "legend")

  // create brush
  rangebar_brush = d3
  .brush().extent([[0, 0], [width, height],])
  .on("start", clear)
  .on("brush", update_rangebar);

  //Adding brush to the svg
  rangebar.call(rangebar_brush)

  // Create X Axis
  x_rangebar = d3.scaleBand()
  .domain(citiesbyrainfall)
  .range([ 0, width])
  .padding(.2);

  // Call X axis
  rangebar.append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class", "axes")
  .call(d3.axisBottom(x_rangebar))
  .selectAll("text")
  .attr("transform", "rotate(-45)")    // rotate text and moves backward
  .style("text-anchor", "end")

  // create y-axis
  y_rangebar = d3.scaleLinear()
  .domain([30, max_height])
  .range([ height, 0 ]);

  // call y-axis
  rangebar.append("g")
  .attr("class", "axes")
  .call(d3.axisLeft(y_rangebar))
  .selectAll("text")

  // add bars
  bars = rangebar.append("g")
  .selectAll("bars")
  .data(temps)
  .enter()
  .append("rect")
  .attr("x", function(d) {return x_rangebar(d.city)})
  .attr("y",  function(d) {return y_rangebar(d.avg_high)})
  .attr("height", function(d) {
    return y_rangebar(max_height - (d.avg_high - d.avg_low))

  })
  .attr("width", x_rangebar.bandwidth())
  .style("fill", "grey")
  .style("opacity",function(d) {return (d.avg_rainfall / 100) * 1.5})
  // .style("stroke", "black")
  // .style("stroke-width", 1)
  .attr("pointer-events", "all")
  .on("mouseover",rangemouseover)
  .on("mouseout",mouseout)

  // Set up inital
  updateFirstTemp("Boston")
  updateSecondTemp("Los Angeles")

  // second graph (so caption can load)
  var sunshine = document.getElementById("sunshine");
  sunshine.innerHTML = getLineInfo()

}).catch(function(error){
  // handle error
})

// updating the colors
var firstcurTemp = ""

function updateFirstTemp(selectedGroup) {

  if (selectedGroup != firstcurTemp) {
    if (secondcurTemp != firstcurTemp) {
    rangebar.selectAll("rect")
    .filter(function(d) { return d.city == firstcurTemp})
    .transition()
    .duration(0)
    .style("fill", function (d) { return "grey"
    })
    } else {
      updateSecondTemp(firstcurTemp)
    }
  }
  rangebar.selectAll("rect")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color1)

  firstcurTemp = selectedGroup
}

// Second
var secondcurTemp = ""

function updateSecondTemp(selectedGroup) {
  if (selectedGroup != secondcurTemp) {
    if (secondcurTemp != firstcurTemp) {
    rangebar.selectAll("rect")
    .filter(function(d) { return d.city == secondcurTemp})
    .transition()
    .duration(0)
    .style("fill", "grey")
    } else {
      updateFirstTemp(secondcurTemp)
    }
  }

  secondCurdata = temps.filter(v => v.city == selectedGroup)
  rangebar.selectAll("rect")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color2)

  secondcurTemp = selectedGroup
}



function rangemouseover(event, d) {
  d3.select(this)
  tooltip
  .html("City: " + d.city + "<br> Avg. High: " + d.avg_high +
      " F <br> Avg. Low: " + d.avg_low + " F <br> Avg. Annual Rainfall " +
      d.avg_rainfall + " inches")
  .style("display", "")
  .style("left", event.pageX + "px")
  .style("top", event.pageY + "px")

  console.log(d.city)
}


// tool-tip
var tooltip = d3
.select("#rangebar")
.append("div")
.style("display", "none")
.attr("class","tooltip")


// Burshing & Linking
var selectedBars = new Set()

//Removes existing brushes from svg
function clear() {
  rangebar.call(rangebar_brush.move, null);
  scatterplot.call(scatter_brush.move, null);
  house_scatterplot.call(house_scatterplot.move, null)

  selectedBars = new Set()
}

//Is called when we brush on scatterplot #1
function update_rangebar(brushEvent) {

  extent = brushEvent.selection;

  //Check all the circles that are within the brush region
  bars.classed("selected", (d) => {

    if (isBrushed(extent, x_rangebar(d.city), -1)
        && !selectedBars.has(d)) {
      selectedBars.add(d)
    }

    // checks if dots are still in the selected area
    if (selectedBars.has(d)) {
      if (!isBrushed(extent, x_rangebar(d.city),-1)) {
        selectedBars.delete(d)
      }
    }

    return isBrushed(extent, x_rangebar(d.city),-1);
  });

  //Select all the data points in plot 2 which have the same id as in plot 1
  dots.classed("selected", (d) => {
    return Array.from(selectedBars).filter(v => v.city == d.city).length >= 1;
  });

  housedots.classed("selected", (d) => {
    return Array.from(selectedBars).filter(v => v.city == d.city).length >= 1;
  });
}


// Weather Text Blurb
function getWeather() {
  const firstdata = temps.filter(v => v.city == firstcurTemp)[0]
  const seconddata = temps.filter(v => v.city == secondcurTemp)[0]

  const firstDataInfo = `In ${firstcurTemp}, the average temp has a range of 
  ${(firstdata.avg_high - firstdata.avg_low).toFixed(2)} F degrees. The average high is ${firstdata.avg_high} F, 
  and the low is ${firstdata.avg_low} F. The average rainfall is ${firstdata.avg_rainfall} inches.`

  const secondDataInfo = `In ${secondcurTemp}, the average temp has a range of 
  ${(seconddata.avg_high - seconddata.avg_low).toFixed(2)} F degrees. The average high is ${seconddata.avg_high} F, 
  and the low is ${seconddata.avg_low} F. The average rainfall is ${seconddata.avg_rainfall} inches.`

  if (firstdata.avg_high >= seconddata.avg_high && firstdata.avg_low >= seconddata.avg_low) {
    if (firstdata.avg_rainfall >=  seconddata.avg_rainfall) {
      moreInfo = `${firstcurTemp} is generally warmer than ${secondcurTemp} and has 
      ${(firstdata.avg_rainfall - seconddata.avg_rainfall).toFixed(2)} more
      inches, on average, more rainfall per year.`
    } else {
      moreInfo = `${firstcurTemp} is generally warmer than ${secondcurTemp} but has
      ${(seconddata.avg_rainfall - firstdata.avg_rainfall).toFixed(2)}  less
      inches, on average, less rainfall per year.`
    }
  } else if (seconddata.avg_high >= firstdata.avg_high && seconddata.avg_low >= firstdata.avg_low) {
    if (seconddata.avg_rainfall >=  firstdata.avg_rainfall) {
      moreInfo = `${secondcurTemp} is generally warmer than ${firstcurTemp} and has 
      ${(seconddata.avg_rainfall - firstdata.avg_rainfall).toFixed(2)} 
      more inches of rainfall, on average, per year.`
    } else {
      moreInfo = `${secondcurTemp} is generally warmer than ${firstcurTemp} but has
      ${(firstdata.avg_rainfall - seconddata.avg_rainfall).toFixed(2)} 
      less inches of rainfall, on average, per year.`
    }
  } else if (firstdata.avg_high >= seconddata.avg_high && firstdata.avg_low <= seconddata.avg_low) {
    if (firstdata.avg_rainfall >=  seconddata.avg_rainfall) {
      moreInfo = `${firstcurTemp} has warmer peaks and colder peaks than ${secondcurTemp} and has 
      ${(firstdata.avg_rainfall - seconddata.avg_rainfall).toFixed(2)} 
      more inches of rainfall, on average, per year.`
    } else {
      moreInfo = `${firstcurTemp} has warmer peaks and colder peaks than ${secondcurTemp} but has
      ${(seconddata.avg_rainfall - firstdata.avg_rainfall).toFixed(2)} 
      less inches of rainfall, on average, per year.`
    }
  } else {
    if (seconddata.avg_rainfall >=  firstdata.avg_rainfall) { // second rainfall is more than
      moreInfo = `${secondcurTemp} has warmer peaks and colder peaks than ${firstcurTemp} and has 
      ${(seconddata.avg_rainfall - firstdata.avg_rainfall).toFixed(2)} more
      inches of rainfall, on average, per year.`
    } else {
      moreInfo = `${secondcurTemp} has warmer peaks and colder peaks than ${firstcurTemp} but has
      ${(firstdata.avg_rainfall - seconddata.avg_rainfall).toFixed(2)} less
      inches of rainfall, on average, per year.`
    }
  }

  if (firstcurTemp == secondcurTemp) {
    return firstDataInfo
  }

  return firstDataInfo + "<br><br>" + secondDataInfo + "<br><br>" + moreInfo
}
