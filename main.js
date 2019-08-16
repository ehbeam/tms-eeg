
var file = "https://raw.githubusercontent.com/ehbeam/tms-eeg/master/data/random_data.csv";

var dataXY = []; var dataViolin = [];
var nGroups = 0; var groups = ["Group 1"];
var yExtent = []; var xExtent = [];
var xVar = ""; var yVar = "";
var yScale, xScale;

// Set color scale
var palette = d3.scaleOrdinal(d3.schemeCategory10);
var colors = [];
for (var i = 0; i < 5; i++) { colors.push(palette(i)) };

var duration = 0;

d3.csv(file, function(data){

  var vars = Object.keys(data[0]);
  var categoricalVars = ["Project", " Subject", " Condition"];
  var continuousVars = [""].concat(vars.filter(v => !categoricalVars.includes(v)));
  var varIDs = ["x-data", "y-data"];

  function loadSelect(id, text) {
    var select = document.getElementById(id);
    var option = document.createElement("option")
    option.text = text;
    select.add(option);
  }

  for (var i = 0; i < continuousVars.length; i++) {
    for (var j = 0; j < varIDs.length; j++) {
      loadSelect(varIDs[j], continuousVars[i])
    }
  }

  function extractUnique(arr) {
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
      if (!unique.includes(arr[i])) { unique.push(arr[i]) };
    } 
    return unique;
  }

  var projects = [""]; var conditions = [""];
  for (var i = 0; i < data.length; i++) {
    projects.push(data[i]["Project"])
    conditions.push(data[i][" Condition"])
  }
  projects = extractUnique(projects);
  conditions = extractUnique(conditions);

  for (var i = 1; i < 6; i++) {
    for (var j = 0; j < projects.length; j++) {
      loadSelect("project-" + i, projects[j])
    }
    for (var k = 0; k < conditions.length; k++) {
      loadSelect("condition-" + i, conditions[k])
    }
  }

  function addGroup() {
    if (nGroups < 5) {
      nGroups = nGroups + 1;
      document.getElementById("group-" + nGroups).style.display = "inline-block";
      document.getElementById("color-" + nGroups).style.background = colors[nGroups-1];
    }
  }

  addGroup();
  d3.select("#group-button").on("click", addGroup)

  function updateAxisLabels() {

    var xEl = document.getElementById("x-data");
    var xVar = xEl.options[xEl.selectedIndex].value;
    d3.selectAll("#x-label").text(xVar);
    
    var yEl = document.getElementById("y-data");
    var yVar = yEl.options[yEl.selectedIndex].value;
    d3.selectAll("#y-label").text(yVar);

  }

  function loadData() {
    xVar = " " + d3.select("#x-data").node().value;
    yVar = " " + d3.select("#y-data").node().value;
    dataViolin = []; var v = 0;
    for (var group = 1; group < nGroups + 1; group++) {
      var project = d3.select("#project-" + group).node().value; 
      var condition = " " + d3.select("#condition-" + group).node().value;
      var values = []; var n = 0;
      for (var i = 0; i < data.length; i++) {
        if ((data[i]["Project"] == project) & (data[i][" Condition"] == condition)) {
          n = n + 1;
          if ((typeof data[i][xVar] !== "undefined") & (typeof data[i][yVar] !== "undefined")) {
            values.push({ x: data[i][xVar], y: data[i][yVar], row: i });
            dataViolin.push({group: "Group " + group, color: colors[group],
                             x: data[i][xVar], y: data[i][yVar]});
          }
        }
      }
      document.getElementById("n-" + group).innerHTML = "<i>N</i> = " + n;
      dataXY[group-1] = { key: "group-" + group, values: values };
    }
    groups = [];
    for (var i = 1; i <= nGroups; i++) { groups.push("Group " + i) };
    if (dataXY[0].values.length > 0) {
      updateAxisLabels();
      updateScatter();
      updateViolinY();
      updateViolinX();
    }
  }

  d3.select("#x-data").on("change", loadData);
  d3.select("#y-data").on("change", loadData);

  d3.select("#project-1").on("change", loadData);
  d3.select("#project-2").on("change", loadData);
  d3.select("#project-3").on("change", loadData);
  d3.select("#project-4").on("change", loadData);
  d3.select("#project-5").on("change", loadData);

  d3.select("#condition-1").on("change", loadData);
  d3.select("#condition-2").on("change", loadData);
  d3.select("#condition-3").on("change", loadData);
  d3.select("#condition-4").on("change", loadData);
  d3.select("#condition-5").on("change", loadData);
  
  var zoom = d3.zoom().on('zoom', zoomed);
  $('#myModal').modal('hide');

  var margin = {top: 20, right: 30, bottom: 50, left: 88};

  var width = 440 - margin.left - margin.right,
    height = 395 - margin.top - margin.bottom;

  xExtent = findExtent(dataXY, 'x');
  yExtent = findExtent(dataXY, 'y');
    
  var xScale = d3.scaleLinear()
    .range([0, width])
    .domain(xExtent).nice();

  var yScale = d3.scaleLinear()
    .range([height, 0])
    .domain(yExtent).nice();

  var xAxis = d3.axisBottom(xScale).ticks(12),
    yAxis = d3.axisLeft(yScale).ticks(12 * height / width);

  var plotLine = d3.line()
    .curve(d3.curveMonotoneX)
    .x(function(d) {
      return xScale(d.x);
    })
    .y(function(d) {
      return yScale(d.y);
    });

  // Define the div for the tooltip
  var div = d3.select("body").append("div") 
      .attr("class", "tooltip")       
      .style("opacity", 0);

  var svg = d3.select("#chart-scatter").append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom);

  svg.append("text")
      .transition().duration(duration) 
      .attr("id", "x-label")          
      .attr("transform",
            "translate(" + (width / 2 + margin.left) + " ," + 
                           (height + margin.top + 39) + ")")
      .style("text-anchor", "middle")
      .text("");

  svg.append("text")
      .transition().duration(duration)
      .attr("id", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 123)
      .attr("x", 0 - (height / 2) - margin.top)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(""); 

  // Make a clip path
  svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
        
  var zoomWindow = svg.append("rect")
    .attr("clip-path", "url(#clip)")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height)
    .style("opacity", 1)
    .style("fill", "white");

  // svg.append("g")
  //   .attr("class", "x axis ")
  //   .attr('id', "axis--x")
  //   .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
  //   .call(xAxis);

  // svg.append("g")
  //   .attr("class", "y axis")
  //   .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  //   .attr('id', "axis--y")
  //   .call(yAxis);

  var dot = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  // zoomWindow.call(zoom);

  // updateScatter();

  function findExtent(arr, prop) {
    var max = d3.max(arr, function(array) {
      let values = array.values;
      return d3.max(values, function(v) {return v[prop];});
    });
    
    var min = d3.min(arr, function(array) {
      let values = array.values;
      return d3.min(values, function(v) {return v[prop];});
    });
    
    return [min, max]
  }

  function updateScatter() {

    xExtent = findExtent(dataXY, 'x');
    yExtent = findExtent(dataXY, 'y');
    
    var xScale = d3.scaleLinear()
      .range([0, width])
      .domain(xExtent).nice();

    var yScale = d3.scaleLinear()
      .range([height, 0])
      .domain(yExtent).nice();

    var xAxis = d3.axisBottom(xScale).ticks(12),
      yAxis = d3.axisLeft(yScale).ticks(12 * height / width);

    svg.append("g")
      .attr("class", "x axis ")
      .attr('id', "axis--x")
      .attr("transform", "translate(" + margin.left + "," + (height + margin.top) + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .attr('id', "axis--y")
      .call(yAxis);

    // Adjust scale's domain whenever new data is added
    xScale.domain(xExtent).nice();
    yScale.domain(yExtent).nice();

    // Rescale to zoom's scale
    let t = d3.zoomTransform(zoomWindow.node());
    let new_yScale = t.rescaleY(yScale); 
    let new_xScale = t.rescaleX(xScale);
    
    // Adjust axis labels
    yAxis.scale(new_yScale);
    xAxis.scale(new_xScale);
    
    svg.transition().duration(duration).select('.y.axis').call(yAxis);
    svg.transition().duration(duration).select('.x.axis').call(xAxis);

    svg.selectAll("circle").remove();

    // Add and update to plot data
    dataXY.forEach(function (d, i) {
      dot.append("g")
        .attr("id", "scatter-" + i)
        .attr("clip-path", "url(#clip)")
        .selectAll(".dot")
        .data(d.values)
          .enter().append("circle")
          .attr("class", "dot")
          .on("mouseover", function(d) {  
              div.transition()    
                  .duration(100)    
                  .style("opacity", 0.9);    
              div.html("Row " + d.row)  
                  .style("left", (d3.event.pageX) + 1 + "px")   
                  .style("top", (d3.event.pageY - 26) + "px");  
              })          
          .on("mouseout", function(d) {   
              div.transition()    
                  .duration(100)    
                  .style("opacity", 0); 
          })
          .transition().duration(duration)
          .attr("r", 4)
          .attr("cx", function(d) {
            return new_xScale(d.x);
          })
          .attr("cy", function(d) {
            return new_yScale(d.y);
          })
          .attr("stroke", "white")
          .attr("stroke-width", "2px")
          .style("fill", function() {
            return d.color = colors[i];
          })
  });

}

  d3.select("#x-scales").on('change', setXScale); 
  d3.select("#y-scales").on('change', setYScale);
  d3.select("#resetScales").on("click", resetScales);

  var xChoice = 'Linear', yChoice = 'Linear';
  function setXScale() {
    xChoice = this.value;
    setScales();
  }

  function setYScale() {
    yChoice = this.value;
    setScales();
  }

  function resetScales() {
    d3.select("#x-scales").node().value = 'Linear';
    d3.select("#y-scales").node().value = 'Linear';
    xChoice = 'Linear';
    yChoice = 'Linear';
    setScales();
  }

  function setScales() {
    
    xScale = scales[xChoice].copy();
    yScale = scales[yChoice].copy();
    
    xScale.range([0, width]);
    yScale.range([height, 0]);
    
    updateScatter();
  }

  d3.select("#resetPlot").on('click', resetPlot);

  function resetPlot() {
    zoomWindow.transition().duration(duration)
       .call(zoom.transform, d3.zoomIdentity);
  }
              
  function zoomed() {

      // Update Scales
      var new_yScale = d3.event.transform.rescaleY(yScale);
      var new_xScale = d3.event.transform.rescaleX(xScale);
      
      // Re-scale axes
      svg.select(".y.axis")
          .call(yAxis.scale(new_yScale));

      svg.select(".x.axis")
          .call(xAxis.scale(new_xScale));

      // Re-draw line
      plotLine = d3.line()
          .curve(d3.curveMonotoneX)
          .x(function (d) {
              return new_xScale(d.x);
          })
          .y(function (d) {
              return new_yScale(d.y);
          });
      
      line.selectAll('path').attr("d", plotLine);

      d3.selectAll('circle')
        .attr("cx", function(d) {
          return new_xScale(d.x);
        })
        .attr("cy", function(d) {
          return new_yScale(d.y);
        });
  }
});

// Read the data and compute summary statistics for each species
// Adapted from https://www.d3-graph-gallery.com/graph/violin_basicHist.html
function updateViolinY() {

  document.getElementById("chart-violin-y").innerHTML = "";

  d3.csv(file, function(data) {

    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 50, bottom: 30, left: 50};

    var width = 375 - margin.left - margin.right,
      height = 190 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#chart-violin-y")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add y-axis label
    svg.append("text")
        .attr("id", "y-label-violin-y")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 8)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "6px")
        .text(yVar); 

    // Build and show the Y scale
    var y = d3.scaleLinear()
      .domain(yExtent).nice()          // Note that here the Y scale is set manually
      .range([height, 0])
    svg.append("g")
      .call( d3.axisLeft(y) )

    // Build and show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3.scaleBand()
      .range([0, width])
      .domain(groups)
      .padding(0.05)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    
    // Features of the histogram
    var histogram = d3.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value(d => d)
    
    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()  // nest function allows to group the calculation per level of a factor
      .key(function(d) { return d.group;})
      .rollup(function(d) {   // For each key..
        input = d.map(function(g) { return parseFloat(g.y);})    // Keep the variable called Sepal_Length
        bins = histogram(input)   // And compute the binning on it.
        return(bins)
      })
      .entries(dataViolin)

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for ( i in sumstat ){
      allBins = sumstat[i].value
      lengths = allBins.map(function(a){return a.length;})
      longuest = d3.max(lengths)
      if (longuest > maxNum) { maxNum = longuest }
    }


    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum, maxNum])

    // Add the shape to this svg
    svg
      .selectAll("violin")
      .data(sumstat)
      .enter()        // So now we are working group per group
      .append("g")
        .attr("transform", function(d,i){ return("translate(" + x(d.key) +" ,0)"); }) // Translation on the right to be at the group position
      .append("path")
          .datum(function(d){ return(d.value)})     // So now we are working bin per bin
          .style("stroke", "none")
          .style("fill", function(d,i){ return(colors[i])})
          .style("opacity", "0.65")
          .attr("d", d3.area()
              .x0(function(d){ return(xNum(-d.length)) } )
              .x1(function(d){ return(xNum(d.length)) } )
              .y(function(d){ return(y(d.x0)) } )
              .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
          )

  })

};

function updateViolinX() {

  document.getElementById("chart-violin-x").innerHTML = "";

  d3.csv(file, function(data) {

    // set the dimensions and margins of the graph
    var margin = {top: 15, right: 50, bottom: 40, left: 50};

    var width = 375 - margin.left - margin.right,
      height = 190 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#chart-violin-x")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // Add y-axis label
    svg.append("text")
        .attr("id", "y-label-violin-x")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 8)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "6px")
        .text(xVar); 

    // Build and show the Y scale
    var y = d3.scaleLinear()
      .domain(xExtent).nice()          // Note that here the Y scale is set manually
      .range([height, 0])
    svg.append("g")
      .call( d3.axisLeft(y) )

    // Build and show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3.scaleBand()
      .range([0, width])
      .domain(groups)
      .padding(0.05)     // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    
    // Features of the histogram
    var histogram = d3.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value(d => d)
    
    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()  // nest function allows to group the calculation per level of a factor
      .key(function(d) { return d.group;})
      .rollup(function(d) {   // For each key..
        input = d.map(function(g) { return parseFloat(g.x);})    // Keep the variable called Sepal_Length
        bins = histogram(input)   // And compute the binning on it.
        return(bins)
      })
      .entries(dataViolin)

    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0
    for ( i in sumstat ){
      allBins = sumstat[i].value
      lengths = allBins.map(function(a){return a.length;})
      longuest = d3.max(lengths)
      if (longuest > maxNum) { maxNum = longuest }
    }


    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3.scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum, maxNum])

    // Add the shape to this svg
    svg
      .selectAll("violin")
      .data(sumstat)
      .enter()        // So now we are working group per group
      .append("g")
        .attr("transform", function(d,i){ return("translate(" + x(d.key) +" ,0)"); }) // Translation on the right to be at the group position
      .append("path")
          .datum(function(d){ return(d.value)})     // So now we are working bin per bin
          .style("stroke", "none")
          .style("fill", function(d,i){ return(colors[i])})
          .style("opacity", "0.65")
          .attr("d", d3.area()
              .x0(function(d){ return(xNum(-d.length)) } )
              .x1(function(d){ return(xNum(d.length)) } )
              .y(function(d){ return(y(d.x0)) } )
              .curve(d3.curveCatmullRom)    // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
          )

  })

};