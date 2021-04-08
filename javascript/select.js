d3.csv("assets/cleaned_sunshine.csv")
.then(function(data) {

  function ascending(a, b) {
    if (a > b)
      return 1;
    if (a < b)
      return -1;
    return 0;
  }

  grouped = d3.group(data, d=>d.city)
  cities = Array.from(grouped).map(v => v[0])

  alph_cities = cities.sort(ascending)


  d3.select("#city1")
  .selectAll('myOptions')
  .data(alph_cities)
  .enter()
  .append('option')
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; }) // corresponding value returned by the button
  .property("selected", function(d){ return d === "Boston"; })

  d3.select("#city1").on("change", function(d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateChart function with this selected option
    updateFirstLine(selectedOption)
    updateFirstTemp(selectedOption)
    updateFirstDot(selectedOption)
    updateFirstHouse(selectedOption)

  })

  // option 2

  d3.select("#city2")
  .selectAll('myOptions')
  .data(alph_cities)
  .enter()
  .append('option')
  .text(function (d) { return d; }) // text showed in the menu
  .attr("value", function (d) { return d; }) // corresponding value returned by the button
  .property("selected", function(d){ return d === "Los Angeles"; })


  d3.select("#city2").on("change", function(d) {
    // recover the option that has been chosen
    var selectedOption = d3.select(this).property("value")
    // run the updateChart function with this selected option
    updateSecondLine(selectedOption)
    updateSecondTemp(selectedOption)
    updateSecondDot(selectedOption)
    updateSecondHouse(selectedOption)
  })

}).catch(function(error){
  // handle error
})

function isBrushed(brush_coords, cx, cy) {
  if (brush_coords === null) return;



  var x0 = brush_coords[0][0],
      x1 = brush_coords[1][0],
      y0 = brush_coords[0][1],
      y1 = brush_coords[1][1];

  if (cy == -1) {
    return x0 <= cx && cx <= x1;
  }

  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
}


// Event Listener for the Text

window.addEventListener("change", function () {
  var crime = document.getElementById("crime");
  crime.innerHTML = getInfo();

  var sunshine = document.getElementById("sunshine");
  sunshine.innerHTML = getLineInfo()

  var weather = document.getElementById("weather");
  weather.innerHTML = getWeather()

  var home = document.getElementById("home");
  home.innerHTML = getHome()
});
