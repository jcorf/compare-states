var scatterplot
var x_scatter, y_scatter
var city_data

// Parse Data
d3.csv("assets/all_data.csv")
.then(function(data) {
  const margin = {top: 10, right: 100, bottom: 50, left: 90},
      width = 1000 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom

  // Create object
  function makeData(city, violent_crime, property_crime, metro_pop, salary) {
    var obj = {
      city: city,
      violent_crime: parseInt(violent_crime),
      property_crime: parseInt(property_crime),
      metro_pop: parseInt(metro_pop),
      salary: parseInt(salary)
    }

    return obj
  }

  // Sort by Descending Metro Pop
  function descending(a, b) {
    if (parseInt(a.metro_population) > parseInt(b.metro_population))
      return -1;
    if (parseInt(a.metro_population) < parseInt(b.metro_population))
      return 1;
    return 0;
  }

  // filter data
  city_data = data.sort(descending).map(v => makeData(v.city, v.violent_crime,
      v.property_crime, v.metro_population, v.average_annual_salary))


  // Create SVG
  scatterplot = d3.select("#scatterplot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  // create brush
  scatter_brush = d3
  .brush()
  .extent([
    [0, 0],
    [width, height],
  ])
  .on("start", clear_scatter)
  .on("brush", update_scatterplot);

  //Adding brush to the svg
  scatterplot.call(scatter_brush)
  // x-axis
  x_scatter = d3.scaleLinear()
  .domain(d3.extent(city_data.map(v => v.property_crime)))
  .range([ 0, width ]);

  // Call x-axis
  scatterplot.append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class", "axes")
  .call(d3.axisBottom(x_scatter))
  .selectAll("text")
  .attr("class","x-axis");


  // Add Y axis
  y_scatter = d3.scaleLinear()
  .domain(d3.extent(city_data.map(v => v.violent_crime)))
  .range([ height, 0]);

  // Call Y-axis
  scatterplot.append("g")
  .attr("class", "axes")
  .call(d3.axisLeft(y_scatter))
  .selectAll("text")
  .attr("class","y-axis")

  // Add dots
  dots = scatterplot.append('g')
  .selectAll("dot")
  .data(city_data)
  .enter()
  .append("circle")
  .attr("cx", function (d) { return x_scatter(d.property_crime); } )
  .attr("cy", function (d) { return y_scatter(d.violent_crime); } )
  .attr("r", function(d) {
    return (d.metro_pop / 1000000) * 2
  })
  .style("fill", "grey")
  .style("opacity", .5)
  .attr("pointer-events", "all")
  .on("mouseover",scattermouseover)
  .on("mouseout",mouseout)

  // Initalize beginning options
  updateFirstDot("Boston")
  updateSecondDot("Los Angeles")

  // Add text
  var weather = document.getElementById("weather");
  weather.innerHTML = getWeather()

}).catch(function(error){
  // handle error
})


// Mouseover
function scattermouseover(event, d) {
  d3.select(this)
  tooltip
  .html("City: " + d.city + "<br> Property Crime: " + d.property_crime.toLocaleString() +
      "<br> Violent Crime: " + d.violent_crime.toLocaleString() + "<br> Metro. Population: " +
  d.metro_pop.toLocaleString())
  .style("display", "")
  .style("left", event.pageX + "px")
  .style("top", event.pageY + "px")
}

// Tooltip
var tooltip = d3
.select("#scatterplot")
.append("div")
.style("display", "none")
.attr("class","tooltip")


// COLOR
var firstDot = ""

// Update First Color
function updateFirstDot(selectedGroup) {

  if (selectedGroup != firstDot) {
    if (secondDot != firstDot) {
      scatterplot.selectAll("circle")
      .filter(function(d) { return d.city == firstDot})
      .transition()
      .duration(0)
      .style("fill", function (d) { return "grey"
      })
    }
  }

 scatterplot.selectAll("circle")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color1)

  firstDot = selectedGroup

}

var secondDot = ""

// Update Second Color
function updateSecondDot(selectedGroup) {
  if (selectedGroup != secondDot) {
    if (secondDot != firstDot) {

      scatterplot.selectAll("circle")
      .filter(function(d) { return d.city == secondDot})
      .transition()
      .duration(0)
      .style("fill", "grey")
    }
  }

  scatterplot.selectAll("circle")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color2)


  secondDot = selectedGroup
}

// Brushing + Linking

selectedDots = new Set()

// Removes existing
function clear_scatter() {
  scatterplot.call(scatter_brush.move, null);
  house_scatterplot.call(house_brush.move, null);
  rangebar.call(rangebar_brush.move,null)

  selectedDots = new Set()
}


//Is called when we brush on scatterplot #1
function update_scatterplot(brushEvent)  {
  extent = brushEvent.selection;

  //Check all the circles that are within the brush region
  dots.classed("selected", (d) => {

    if (isBrushed(extent, x_scatter(d.property_crime), y_scatter(d.violent_crime))
        && !selectedDots.has(d)) {
      selectedDots.add(d)
    }

    // checks if dots are still in the selected area
    if (selectedDots.has(d)) {
      if (!isBrushed(extent, x_scatter(d.property_crime),y_scatter(d.violent_crime))) {
        selectedDots.delete(d)
      }
    }

    return isBrushed(extent, x_scatter(d.property_crime),y_scatter(d.violent_crime));
  });



  bars.classed("selected", (d) => {
    return Array.from(selectedDots).filter(v => v.city == d.city).length >= 1;
  });
  //
  housedots.classed("selected", (d) => {
    return Array.from(selectedDots).filter(v => v.city == d.city).length >= 1;
  });
}

// Text information
function getInfo() {

  beginning =
      `Property Crime is defined as crime against private property, 
      including burglary, vandalism, and shoplifting, etc. Violent 
      crime includes homicide, (sexual) assault, harassment, etc.`
  firstdata = city_data.filter(v => v.city == firstDot)[0];

  firstInfo = `${firstDot} has ${firstdata.property_crime.toLocaleString()} 
  (${((firstdata.property_crime/ 100000) * 100).toFixed(2)}%)
  property crimes per 100,000 people and 
  ${firstdata.violent_crime.toLocaleString()}
   (${((firstdata.violent_crime / 100000) * 100).toFixed(2)}%) 
   violent crimes per 100,000 people, with a metro. population of ${firstdata.metro_pop.toLocaleString()}`

  seconddata = city_data.filter(v => v.city == secondDot)[0];

  secondInfo = `${secondDot} has ${seconddata.property_crime.toLocaleString()} 
   (${((seconddata.property_crime/ 100000) * 100).toFixed(2)}%)
  property crimes per 100,000 people and ${seconddata.violent_crime.toLocaleString()}
   (${((seconddata.violent_crime / 100000) * 100).toFixed(2)}%) 
   violent crimes per 100,000 people, with a metro. population of ${seconddata.metro_pop.toLocaleString()}`

  //
  if (firstdata.violent_crime < seconddata.violent_crime
      && firstdata.property_crime < seconddata.property_crime) {
    compare = compareCrime(firstdata.metro_pop, seconddata.metro_pop,
        firstDot, secondDot,
        firstdata.violent_crime, seconddata.violent_crime,
        firstdata.property_crime, seconddata.property_crime)

  }
  else if (seconddata.violent_crime < firstdata.violent_crime
      && seconddata.property_crime < firstdata.property_crime) {
    compare = compareCrime(seconddata.metro_pop, firstdata.metro_pop,
        secondDot, firstDot,
        seconddata.violent_crime, firstdata.violent_crime,
        seconddata.property_crime, firstdata.property_crime)
  }
  else if (firstdata.violent_crime < seconddata.violent_crime
  && seconddata.property_crime < firstdata.property_crime) { // second dot has more violent crime/less property,
    // first has more property/less violent
    if (firstdata.metro_pop < seconddata.metro_pop) {
      compare = `Despite ${firstDot} having a
       x${divide(seconddata.metro_pop, firstdata.metro_pop)} smaller population, 
       they proportionally have
        ${(createPct(firstdata.property_crime,100000) - 
          createPct(seconddata.property_crime, 100000)).toFixed(2)}% 
       more property crime, but proportionally 
       ${(createPct(seconddata.violent_crime,100000) - 
          createPct(firstdata.violent_crime, 100000)).toFixed(2)}% 
       less violent crime.`
    } else {
      compare = `Despite ${secondDot} having a
       x${divide(firstdata.metro_pop, seconddata.metro_pop)} smaller population, 
       they proportionally have
        ${(createPct(seconddata.violent_crime,100000) -
          createPct(firstdata.violent_crime, 100000)).toFixed(2)}% 
        more violent crime, but proportionally 
       ${(createPct(firstdata.property_crime,100000) -
          createPct(seconddata.property_crime, 100000)).toFixed(2)}% 
       less property crime.`
    }
  }
  else if (seconddata.violent_crime < firstdata.violent_crime
  && firstdata.property_crime < seconddata.property_crime) { //
    // Second dot has less violent/more property, first has less property/more violent
    if (firstdata.metro_pop < seconddata.metro_pop) {
      compare = `Despite ${firstDot} having a
       x${divide(seconddata.metro_pop, firstdata.metro_pop)} smaller population, 
       they proportionally have
        ${(createPct(firstdata.violent_crime,100000) -
          createPct(seconddata.violent_crime, 100000)).toFixed(2)}% 
       more violent crime, but proportionally 
       ${(createPct(seconddata.property_crime,100000) -
          createPct(firstdata.property_crime, 100000)).toFixed(2)}% 
       less property crime.`
    } else {
      compare = `Despite ${secondDot} having a
       x${divide(firstdata.metro_pop, seconddata.metro_pop)} smaller population, 
       they proportionally have
        ${(createPct(seconddata.property_crime,100000) -
          createPct(firstdata.property_crime, 100000)).toFixed(2)}% 
        more property crime, but proportionally 
       ${(createPct(firstdata.violent_crime,100000) -
          createPct(seconddata.violent_crime, 100000)).toFixed(2)}% 
       less violent crime.`
    }
  }
  else {
    compare = "error"
  }



  if (firstdata.city == seconddata.city) {
    return beginning + "<br><br>" + firstInfo
  }

  return beginning + "<br><br>" +firstInfo + ", compared to " + secondInfo + ". <br><br>" + compare

}
function compareCrime(a, b, aname, bname, avcrime, bvcrime, apcrime, bpcrime) {
  return `${aname} proportionally has
   ${(createPct(bpcrime,100000) - createPct(apcrime, 100000)).toFixed(2)}%
     less property crime and
  ${(createPct(bvcrime,100000) - createPct(avcrime, 100000)).toFixed(2)}% 
  proportionally less violent crime and
   than ${bname},
   ${a <= b ? `with a 
   x${divide(b, a)} smaller population.`:
      `despite having a x${divide(a,b)} bigger population.`}`
}

function createPct(a, b) {
  return ((a / b) * 100).toFixed(2)
}
function divide(a,b) {
  return (a / b).toFixed(2)
}