var file = "https://raw.githubusercontent.com/ehbeam/tms-eeg/master/data/random_data.csv";

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

  // Set Color Scale
  let palette = d3.scaleOrdinal(d3.schemeCategory10);
  var colors = [];
  for (var i = 0; i < 5; i++) { colors.push(palette(i)) };
  
  var nGroups = 0;

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
    var xVar = " " + d3.select("#x-data").node().value;
    var yVar = " " + d3.select("#y-data").node().value;
    for (var group = 1; group < nGroups + 1; group++) {
      var project = d3.select("#project-" + group).node().value; 
      var condition = " " + d3.select("#condition-" + group).node().value;
      var values = []; var n = 0;
      for (var i = 0; i < data.length; i++) {
        if ((data[i]["Project"] == project) & (data[i][" Condition"] == condition)) {
          n = n + 1;
          if ((typeof data[i][xVar] !== "undefined") & (typeof data[i][yVar] !== "undefined")) {
            values.push({ x: data[i][xVar], y: data[i][yVar], row: i });
          }
        }
      }
      document.getElementById("n-" + group).innerHTML = "<i>N</i> = " + n;
      dataXY[group-1] = { key: "group-" + group, values: values };
    }
    updateAxisLabels();
    update();
  }

  dataXY = [];

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

  var margin = {
    top: 20,
    right: 50,
    bottom: 50,
    left: 78
  };

  var width = 375 - margin.left - margin.right,
    height = 375 - margin.top - margin.bottom;

  var duration = 350;

  let xExtent = findExtent(dataXY, 'x');
  let yExtent = findExtent(dataXY, 'y');
    
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
                           (height + margin.top + 42) + ")")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .text("");

  svg.append("text")
      .transition().duration(duration)
      .attr("id", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 97)
      .attr("x", 0 - (height / 2) - margin.top)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
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
    
  var dot = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  zoomWindow.call(zoom);

  update();

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

  function update() {

    let xExtent = findExtent(dataXY, 'x');
    let yExtent = findExtent(dataXY, 'y');
    
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

  function modalConfirm(callback){
        $("#myModal").modal('show')
        
        $("#btn-yes-delete").on("click", function(){
          callback(true);
          $("#myModal").modal('hide');
        });

        $("#btn-no-delete").on("click", function(){
          callback(false);
          $("#myModal").modal('hide');
        });
   };

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
    
    update();
  }

  d3.select("#resetPlot").on('click', resetPlot);

  function resetPlot() {
    zoomWindow.transition().duration(duration)
       .call(zoom.transform, d3.zoomIdentity);
  }
              
  function zoomed() {

      // Update Scales
      let new_yScale = d3.event.transform.rescaleY(yScale);
      let new_xScale = d3.event.transform.rescaleX(xScale);
      
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

      // line.selectAll('path').attr("d", plotLine);
      
      d3.selectAll('circle')
        .attr("cx", function(d) {
          return new_xScale(d.x);
        })
        .attr("cy", function(d) {
          return new_yScale(d.y);
        });
  }
});