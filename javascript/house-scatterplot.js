var house_scatterplot
var x_house, y_house

// Get Average
function getAverage(list) {
  sum = list.reduce((total, amount) => total + amount)
  return (sum / list.length).toFixed(2)
}

// Parse Data
d3.csv("assets/all_data.csv")
.then(function(data) {
  // Margins
  var margin = {top: 40, right: 300, bottom: 25, left: 100},
      width = 1200 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom

  // Creates a object
  function makeData(city, avg_house, avg_salary, avg_commute, median_age, rent, unemployment) {
    var obj = {
      city: city,
      avg_house: parseInt(avg_house),
      avg_salary: parseInt(avg_salary),
      avg_commute: parseFloat(avg_commute),
      avg_age: parseFloat(median_age),
      avg_rent: parseInt(rent),
      unemployment: (parseFloat(unemployment) * 100).toFixed(2)
    }
    return obj
  }

  // Filters the house data to only include specific attributes
  house_data = data.map(v => makeData(v.city, v.median_home_price,
      v.average_annual_salary, v.avg_commute_time,
      v.median_age, v.median_monthly_rent, v.unemployment_rate))


  // Create SVG
  house_scatterplot = d3.select("#house-scatterplot")
  .append(
      "svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append(
      "g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  // Creates Brush
  house_brush = d3.brush()
  .extent([[0, 0], [width, height],])
  .on("start", clear_housescatter)
  .on("brush", update_housescatter);

  // Adding Brush to SVG
  house_scatterplot.call(house_brush)

  // X-axis parameters
  x_scatter = d3.scaleLinear()
  .domain(d3.extent(city_data.map(v => v.property_crime)))
  .range([ 0, width ]);

  // Y-axis Parameters
  x_house = d3.scaleLinear()
  .domain(d3.extent(house_data.map(v => v.avg_house)))
  .range([ 0, width]);

  // Add Y-Axis
  house_scatterplot.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x_house))
  .selectAll("text")

  // Add Y axis
  y_house = d3.scaleLinear()
  .domain(d3.extent(house_data.map(v => v.avg_commute)))
  .range([height, 0]);

  // Add Y-axis
  house_scatterplot
  .append("g")
  .call(d3.axisLeft(y_house))

  // Add the dots
  housedots  = house_scatterplot.append('g')
  .selectAll("dot")
  .data(house_data)
  .enter()
  .append("circle")
  .attr("cx", function (d) { return x_house(d.avg_house); } )
  .attr("cy", function (d) { return y_house(d.avg_commute); } )
  .attr("r", function (d) {

    total_avg_salary = parseFloat(getAverage(house_data.map(v => v.avg_salary)))
    var mean_dif = (d.avg_salary - total_avg_salary)/1000;

    if (mean_dif + 10 > 0) {
      return mean_dif + 10
    } else {
      return 1.5
    }
  })
  .style("fill", "grey")
  .style("opacity", .7)
  .attr("pointer-events", "all")
  .on("mouseover",housemouseover)
  .on("mouseout",mouseout)

  // Adding the color for inital choices
  updateFirstHouse("Boston")
  updateSecondHouse("Los Angeles")


  // Adding the inital Text
  var crime = document.getElementById("crime");
  crime.innerHTML = getInfo();

  var home = document.getElementById("home");
  home.innerHTML = getHome()

}).catch(function(error){
})


// Mouseover
function housemouseover(event, d) {
  d3.select(this)
  tooltip
  .html("City: " + d.city + "<br> Med. House Price: $" + d.avg_house.toLocaleString() +
      "<br> Avg. Commute: " + d.avg_commute + " minutes<br> Avg. Salary $" +
      d.avg_salary.toLocaleString() + "<br>Med. Monthly Rent: $" + d.avg_rent.toLocaleString() +
  "<br>Med. Age: " + d.avg_age + "<br>Unemployement: " + d.unemployment + "%")
  .style("display", "")
  .style("left", event.pageX + "px")
  .style("top", event.pageY + "px")
}

// Tooltip
var tooltip = d3
.select("#house-scatterplot")
.append("div")
.style("display", "none")
.attr("class","tooltip")

// Update Functions for the different colors
var firstHouse = ""

// Update the First Color
function updateFirstHouse(selectedGroup) {
  if (selectedGroup !== firstHouse) {
    if (secondHouse != firstHouse) {
      house_scatterplot.selectAll("circle")
      .filter(function(d) { return d.city == firstHouse})
      .transition()
      .duration(0)
      .style("fill", "grey")
    }
  }

  house_scatterplot.selectAll("circle")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color1)

  firstHouse = selectedGroup
}

// Update with the Second Option
var secondHouse = ""

function updateSecondHouse(selectedGroup) {
  if (selectedGroup !== secondHouse) {
    if (secondHouse != firstHouse) {

      house_scatterplot.selectAll("circle")
      .filter(function(d) { return d.city == secondHouse})
      .transition()
      .duration(0)
      .style("fill", "grey")
    }
  }

  house_scatterplot.selectAll("circle")
  .filter(function(d) { return d.city == selectedGroup})
  .transition()
  .duration(0)
  .style("fill", color2)

  secondHouse = selectedGroup
}

// Brushing + Linking
selectedHousedots = new Set()

// Removes Existing
function clear_housescatter() {
  rangebar.call(rangebar_brush.move, null);
  scatterplot.call(scatter_brush.move, null);
  house_scatterplot.call(house_scatterplot.move, null)
  selectedHousedots = new Set()
}

// Updates when brush is
function update_housescatter(brushEvent) {

  extent = brushEvent.selection;

  //Check all the circles that are within the brush region
  housedots.classed("selected", (d) => {
    if (isBrushed(extent, x_house(d.avg_house),
        y_house(d.avg_commute))
        && !selectedHousedots.has(d)) {
     selectedHousedots.add(d)
    }

    // checks if dots are still in the selected area
    if (selectedHousedots.has(d)) {
      if (!isBrushed(extent, x_house(d.avg_house),
          y_house(d.avg_commute))) {
        selectedHousedots.delete(d)
      }
    }

    return isBrushed(extent, x_house(d.avg_house),
        y_house(d.avg_commute));
  });

  // //Select all the data points in plot 2 which have the same id as in plot 1
  bars.classed("selected", (d) => {
    return Array.from(selectedHousedots).filter(v => v.city == d.city).length >= 1;
  });
  //
  dots.classed("selected", (d) => {
    return Array.from(selectedHousedots).filter(v => v.city == d.city).length >= 1;
  });
}

// Gets the various texts for different situations
function getHome() {
  beginning =
      `The size of the bubbles are scaled against the difference from average
      median salary between all the listed cities, which is $${total_avg_salary.toLocaleString()}`
  firstdata = house_data.filter(v => v.city == firstHouse)[0];

  firstInfo = `${firstHouse} has a median home price of $${firstdata.avg_house.toLocaleString()} 
  with an average commute time of 
  ${firstdata.avg_commute.toLocaleString()} minutes,
    and an average salary of $${firstdata.avg_salary.toLocaleString()}`

  seconddata = house_data.filter(v => v.city == secondHouse)[0];
  console.log(seconddata)

  secondInfo = `${secondHouse} which has a median home price of $${seconddata.avg_house.toLocaleString()} 
  with an average commute time of 
   ${seconddata.avg_commute.toLocaleString()}  minutes,
    and an average salary of $${seconddata.avg_salary.toLocaleString()}`

  //
  if (firstdata.avg_commute <= seconddata.avg_commute
      && firstdata.avg_house <= seconddata.avg_house) {
    compare = compareHouse(firstdata.avg_salary, seconddata.avg_salary,
        firstHouse, secondHouse,
        firstdata.avg_commute, seconddata.avg_commute,
        firstdata.avg_house, seconddata.avg_house)

  }
  else if (seconddata.avg_commute <= firstdata.avg_commute
      && seconddata.avg_house <= firstdata.avg_house) {
    compare = compareHouse(seconddata.avg_salary, firstdata.avg_salary,
        secondHouse, firstHouse,
        seconddata.avg_commute, firstdata.avg_commute,
        seconddata.avg_house, firstdata.avg_house)
  }
  else if (firstdata.avg_commute <= seconddata.avg_commute
      && seconddata.avg_house <= firstdata.avg_house) { // second house is less expensive, but longer commute
    // second house is more expensive, but less commute
    if (firstdata.avg_salary <= seconddata.avg_salary) {
      compare = `Though, ${firstHouse} has a
       $${(seconddata.avg_salary - firstdata.avg_salary).toLocaleString()} reduction in their average salary, and
       their house prices are, on average, $${(firstdata.avg_house - seconddata.avg_house).toLocaleString()} more expensive
       compared to ${secondHouse}, 
       their commute is ${(seconddata.avg_commute - firstdata.avg_commute).toFixed(2)} minutes shorter.`
    } else {
      compare = `${secondHouse} has a
       $${(firstdata.avg_salary - seconddata.avg_salary).toLocaleString()} reduction in average salary, and
       their house prices are, on average,  $${(firstdata.avg_house - seconddata.avg_house).toLocaleString()} less expensive 
       than ${firstHouse}
       but the commute is ${(seconddata.avg_commute - firstdata.avg_commute).toFixed(2)} minutes longer.`
    }
  }
  else if (seconddata.avg_commute <= firstdata.avg_commute
      && firstdata.avg_house <= seconddata.avg_house) { //
    // First house has less expensive house, but longer commute
    // Second house is more expensive house but less commute
    if (firstdata.avg_salary < seconddata.avg_salary) {
      compare = `${firstHouse} has a
       $${(seconddata.avg_salary - firstdata.avg_salary).toLocaleString()} reduction in average salary, and
       their house prices, on average, are $${(seconddata.avg_house - firstdata.avg_house).toLocaleString()} less expensive 
       than ${secondHouse}
       but the commute is ${(firstdata.avg_commute - seconddata.avg_commute).toFixed(2)} minutes longer.`
    } else {
      compare = `Though ${secondHouse} has a
       $${(firstdata.avg_salary - seconddata.avg_salary).toLocaleString()} reduction in their average salary, and
       their house prices are, on average,  $${(seconddata.avg_house - firstdata.avg_house).toLocaleString()} more expensive 
       their commute is ${(firstdata.avg_commute - seconddata.avg_commute).toFixed(2)} minutes shorter.`
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

// Specific Comparing House Function
function compareHouse(a, b, aname, bname, acommute, bcommute, ahouse, bhouse) {
  return `${aname} has a commute ${(bcommute - acommute).toFixed(2)} 
  minutes shorter and a 
  $${(bhouse - ahouse).toLocaleString()} reduction in house prices from ${bname},
   ${a <= b ? ` but also with a
   $${(b - a).toLocaleString()} reduction in average salary.`:
      `with a $${(a-b).toLocaleString()} more in average salary.`}`
}