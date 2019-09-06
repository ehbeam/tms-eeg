
var file = "https://raw.githubusercontent.com/ehbeam/tms-eeg/master/data/random_data.csv";

var dataXY = []; var dataViolin = [];
var nGroups = 2; var groups = [1]; var checkNum = false;
var groupVar = ""; var groupVarVals = []; var groupVals = []; var groupVarLab = "";
var nPlots = 1;
var yExtent = []; var xExtent = [];
var xVar = ""; var yVar = "";
var yScale, xScale;
var dataUpdated = false;

// Set color scale
var palette = d3.scaleOrdinal(d3.schemeCategory10);
var colors = [];
for (var i = 0; i < 10; i++) { colors.push(palette(i)) };

var duration = 0;

d3.csv(file, function(data){

  function updateNGroupVal() {
    nGroups = document.getElementById("n-group-slider").value;
    document.getElementById("n-groups").innerHTML = nGroups;
  }

  nGroups = document.getElementById("n-group-slider").value; 
  d3.select("#update-group-button").on("click", updateNGroupVal);

  // Remove white space from data keys
  var newData = [];
  for (var i = 0; i < data.length; i++) {
    var newRow = {};
    for (var key in data[i]) {
      newKey = key.trim();
      newRow[newKey] = data[i][key].trim()
    }
    newData.push(newRow)
  }
  data = newData;

  var vars = Object.keys(data[0]);

  // Determine which variables are categorical
  var categoricalVars = [];
  for (var i = 0; i < vars.length; i++) {
    if (!(parseFloat(data[0][vars[i]]))) {
      categoricalVars.push(vars[i])
    }
  }

  var continuousVars = [""].concat(vars.filter(v => !categoricalVars.includes(v)));
  // var varIDs = ["group-select", "y-data-1", "y-data-2", "y-data-3", "y-data-4", "y-data-5"];
  var varIDs = ["group-select", "y-data-1"];

  function loadSelect(id, text) {
    var select = document.getElementById(id);
    var option = document.createElement("option")
    option.text = text;
    select.add(option);
  }

  for (var i = 0; i < vars.length + 1; i++) {
    loadSelect("group-select", [""].concat(vars)[i])
  }

  for (var i = 0; i < continuousVars.length; i++) {
    // for (var j = 1; j < 6; j++) {
    for (var j = 1; j < 2; j++) {
      loadSelect("y-data-" + j, continuousVars[i])
    }
  }

  function extractUnique(arr) {
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
      if (!unique.includes(arr[i])) { unique.push(arr[i]) };
    } 
    return unique;
  }

  function dimAdd() {
    document.getElementById("add-plot-button").style.opacity = "0.7";
  }
  
  function brightAdd() {
    document.getElementById("add-plot-button").style.opacity = "1";
  }

  function dimDel() {
    document.getElementById("del-plot-button").style.opacity = "0.7";
  }

  function brightDel() {
    document.getElementById("del-plot-button").style.opacity = "1";
  }

  function updatePlotButtons() {
    if (nPlots == 1) { 
      document.getElementById("del-plot-button").style.background = "#CCCCCC";
      document.getElementById("del-plot-button").style.cursor = "default";
      d3.select("#del-plot-button").on("mouseover", brightDel)
      d3.select("#add-plot-button").on("mouseover", dimAdd)
      d3.select("#add-plot-button").on("mouseout", brightAdd)
    }
    if ((nPlots > 1) & (nPlots < 5)) {
      document.getElementById("del-plot-button").style.background = "white";
      document.getElementById("del-plot-button").style.cursor = "pointer";
      document.getElementById("add-plot-button").style.background = "white";
      document.getElementById("add-plot-button").style.cursor = "pointer";
      d3.select("#add-plot-button").on("mouseover", dimAdd)
      d3.select("#add-plot-button").on("mouseout", brightAdd)
      d3.select("#del-plot-button").on("mouseover", dimDel)
      d3.select("#del-plot-button").on("mouseout", brightDel)
    }
    if (nPlots == 5) { 
      document.getElementById("add-plot-button").style.background = "#CCCCCC";
      document.getElementById("add-plot-button").style.cursor = "default";
      d3.select("#add-plot-button").on("mouseover", brightAdd)
      d3.select("#del-plot-button").on("mouseover", dimDel)
      d3.select("#del-plot-button").on("mouseout", brightDel)
    }
  }

  // updatePlotButtons();

  function delPlot() {
    if (nPlots > 1) {
      document.getElementById("y-data-" + nPlots).style.display = "none";
      nPlots = nPlots - 1;
    } 
    updatePlotButtons();
  }

  function addPlot() {
    if (nPlots < 5) {
      nPlots = nPlots + 1;
      document.getElementById("y-data-" + nPlots).style.display = "inline-block";
    } 
    updatePlotButtons();
  }

  d3.select("#del-plot-button").on("click", delPlot)
  d3.select("#add-plot-button").on("click", addPlot)

  function loadGroupVals(groupVar) {
    isNum = false;
    var groupVarVals = [];
    for (var i = 0; i < data.length; i++) {
      var val = data[i][groupVar];
      if (parseFloat(val)) {
        isNum = true;
        val = parseFloat(val);
      }
      if (!(typeof val == "undefined")) { groupVarVals.push(val) }
    }
    return extractUnique(groupVarVals);
  }

  function updateNGroups() {
    nGroups = document.getElementById("n-group-slider").value;
    document.getElementById("n-groups").innerHTML = nGroups;
  }

  d3.select("#n-group-slider").on("input", updateNGroups);  

  function updateAxisLabels() {

    var xEl = document.getElementById("group-select");
    var xVar = xEl.options[xEl.selectedIndex].value;
    d3.selectAll("#x-label").text(groupVarLab);
    
    var yEl = document.getElementById("y-data-1");
    var yVar = yEl.options[yEl.selectedIndex].value;
    d3.selectAll("#y-label").text(yVar);

  }

  function computeNSubjects(group, groupVar, groupVarVal) {

    var selIdx = 0;
    if (group < groupVarVals.length + 1) { selIdx = group };
    var groupVarVal = groupVarVals[selIdx-1];

    var n = 0;
      for (var j = 0; j < data.length; j++) {
        if (data[j][groupVar] == groupVarVal) {
          n = n + 1;
        }
      } 

    return n;
  }

  function updateNSubjects() {
    var groupVar = document.getElementById("group-select").value;
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      var selVar = document.getElementById("group-val-select-" + group).value;
      var n = 0;
      for (var j = 0; j < data.length; j++) {
        if (data[j][groupVar] == selVar) {
          n = n + 1;
        }
      } 
      document.getElementById("n-" + group).innerHTML = "<b><i>N</i> Subjects:</b>&nbsp;&nbsp;" + n;
    }
  }

  function updateNSubjectsRange() {
    var groupVar = document.getElementById("group-select").value;
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      var groupMin = document.getElementById("group-min-slider-" + group).value;
      var groupMax = document.getElementById("group-max-slider-" + group).value;
      var n = 0;
      for (var j = 0; j < data.length; j++) {
        if ((data[j][groupVar] > groupMin) & (data[j][groupVar] < groupMax)) {
          n = n + 1;
        }
      } 
      document.getElementById("n-" + group).innerHTML = "<b><i>N</i> Subjects:</b>&nbsp;&nbsp;" + n;
    }
  }

  function updateCategoricalSelection() {
    
    updateNSubjects();

    dataViolin = []; dataXY = [];
    for (var i = 0; i < nGroups; i++) {

      var group = i + 1; values = [];
      var groupVal = document.getElementById("group-val-select-" + group).value;

      for (var k = 0; k < data.length; k++) {
        if (data[k][groupVar] == groupVal) {
          var yVal = data[k][yVar];
          values.push({ x: k, y: parseFloat(yVal), row: k });
          dataViolin.push({ group: group, color: colors[group], x: group, y: yVal });
        }
      }
      dataXY[i] = { key: "group-" + group, values: values };
    }

    dataUpdated = true;
  }

  function updateCategorical() {

    nGroups = document.getElementById("n-group-slider").value;
    groupVar = document.getElementById("group-select").value;
    yVar = document.getElementById("y-data-1").value;
    groupVarVals = loadGroupVals(groupVar);
    groupVarLab = "Row";
    dataUpdated = false;

    var groupHTML = "";
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      var n = computeNSubjects(group, groupVar, groupVarVals);
      groupHTML = groupHTML + "<div class='group-toolbar' id='group-toolbar-" + group + "'><div class='group-color' id='color-" + group + "' style='background:" + colors[i] + ";'></div><label class='group-label' style='width:65px;'>Group " + group + "</label><select class='group-val-select' id='group-val-select-" + group + "'>" + groupVals[i] + "</select><span id='n-" + group + "'><b><i>N</i> Subjects:</b>&nbsp;&nbsp;" + n + "</span></div>";
    }
    
    document.getElementById("group-list").innerHTML = groupHTML;

    dataViolin = []; dataXY = [];
    for (var i = 0; i < nGroups; i++) {

      var group = i + 1; values = [];
      for (var j = 0; j < groupVarVals.length + 1; j++) {
        loadSelect("group-val-select-" + group, [""].concat(groupVarVals)[j]);
      }

      var selIdx = 0;
      if (i < (groupVarVals.length + 1)) { selIdx = group };
      document.getElementById("group-val-select-" + group).selectedIndex = selIdx;

      d3.select("#group-val-select-" + group).on("change", updateCategoricalSelection);

      for (var k = 0; k < data.length; k++) {
        if (data[k][groupVar] == groupVarVals[selIdx-1]) {
          var yVal = data[k][yVar];
          values.push({ x: k, y: parseFloat(yVal), row: k });
          dataViolin.push({ group: group, color: colors[group], x: group, y: yVal });
        }
      }
      dataXY[i] = { key: "group-" + group, values: values };
    }

    document.getElementById("group-toolbar-1").style["margin-top"] = "9px";
    document.getElementById("group-toolbar-" + nGroups).style["margin-bottom"] = "5px";

    groups = [];
    for (var i = 1; i <= nGroups; i++) { 
      groups.push(i);
    };

    d3.select("#plot-select").on("change", updateCategoricalSelection);

  }

  function updateMin() {
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      val = document.getElementById("group-min-slider-" + group).value;
      document.getElementById("group-min-" + group).innerHTML = parseFloat(val).toFixed(2);
    }
  }

  function updateMax() {
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      val = document.getElementById("group-max-slider-" + group).value;
      document.getElementById("group-max-" + group).innerHTML = parseFloat(val).toFixed(2);
    }
  }

  function updateNumericalSelection() {

    updateNSubjectsRange();
    updateMin();
    updateMax();

    var yVar = document.getElementById("y-data-1").value;

    dataViolin = []; dataXY = [];
    for (var i = 0; i < nGroups; i++) {

      var group = i + 1; 
      var groupMin = parseFloat(document.getElementById("group-min-slider-" + group).value);
      var groupMax = parseFloat(document.getElementById("group-max-slider-" + group).value);

      values = [];
      for (var k = 0; k < data.length; k++) {
        var xVal = data[k][groupVar];
        if ((parseFloat(xVal) > groupMin) & (parseFloat(xVal) < groupMax)) {
          var yVal = data[k][yVar];
          values.push({ x: parseFloat(xVal), y: parseFloat(yVal), row: k });
          dataViolin.push({ group: group, color: colors[group], x: xVal, y: yVal });
        }
      }
      dataXY[i] = { key: "group-" + group, values: values };
    }

    dataUpdated = true;
  }

  function updateNumerical() {

    nGroups = document.getElementById("n-group-slider").value;
    groupVar = document.getElementById("group-select").value;
    yVar = document.getElementById("y-data-1").value;
    groupVarVals = loadGroupVals(groupVar);
    groupVarLab = groupVar;
    dataUpdated = false;

    var minVal = Math.min.apply(Math, groupVarVals).toFixed(2);
    var maxVal = Math.max.apply(Math, groupVarVals).toFixed(2);
    var step = (maxVal - minVal) / 100;
    var thres = (maxVal - minVal) / parseFloat(nGroups);
    
    var groupHTML = "";
    for (var i = 0; i < nGroups; i++) {
      var group = i + 1;
      var n = 1;
      groupHTML = groupHTML + "<div class='group-toolbar' id='group-toolbar-" + group + "'><div class='group-color' id='color-" + group + "' style='background:" + colors[i] + ";'></div><label class='group-label' style='width:65px;'>Group " + group + "</label><span class='group-val-slider-label'><b>Min: </b></span><div class='group-minmax' id='group-min-" + group + "'>" + minVal + "</div><input type='range' class='slider' id='group-min-slider-" + group + "' min='" + minVal + "' max='" + maxVal + "' step='" + step + "' value='" + minVal + "'></input><span class='group-val-slider-label'><b>Max: </b></span><div class='group-minmax' id='group-max-" + group + "'>" + maxVal + "</div><input type='range' class='slider' id='group-max-slider-" + group + "' min='" + minVal + "' max='" + maxVal + "' step='" + step + "' value='" + maxVal + "'></input><span id='n-" + group + "'><b><i>N</i> Subjects:</b>&nbsp;&nbsp;" + n + "</span></div>";
    }

    document.getElementById("group-list").innerHTML = groupHTML;

    var floor = minVal; dataViolin = []; dataXY = [];
    for (var i = 0; i < nGroups; i++) {

      var group = i + 1; 

      var groupMin = floor;
      document.getElementById("group-min-slider-" + group).value = groupMin;
      document.getElementById("group-min-" + group).innerHTML = parseFloat(groupMin).toFixed(2);
      floor = parseFloat(floor) + parseFloat(thres);

      var groupMax = floor;
      document.getElementById("group-max-slider-" + group).value = groupMax;
      document.getElementById("group-max-" + group).innerHTML = parseFloat(groupMax).toFixed(2);

      ["min", "max"].forEach(function (item, index) {

        document.getElementById("group-" + item + "-slider-" + group).style["width"] = "92px";
        document.getElementById("group-" + item + "-slider-" + group).style["height"] = "13px";
        document.getElementById("group-" + item + "-slider-" + group).style["vertical-align"] = "middle";
        document.getElementById("group-" + item + "-slider-" + group).style["display"] = "inline-block";
        document.getElementById("group-" + item + "-slider-" + group).style["margin-left"] = "6px";
        document.getElementById("group-" + item + "-slider-" + group).style["margin-right"] = "23px";
        document.getElementById("group-" + item + "-" + group).style["width"] = "37px";
        document.getElementById("group-" + item + "-" + group).style["display"] = "inline-block";
        document.getElementById("group-" + item + "-" + group).style["font-size"] = "12px";
        document.getElementById("group-" + item + "-" + group).style["text-align"] = "center";

        d3.select("#group-" + item + "-slider-" + group).on("input", updateNumericalSelection);

      });
            
      document.getElementById("group-toolbar-" + group).style["margin-top"] = "6px";
      document.getElementById("group-toolbar-" + group).style["margin-bottom"] = "6px";

      values = [];
      for (var k = 0; k < data.length; k++) {
        var xVal = data[k][groupVar];
        if ((parseFloat(xVal) > groupMin) & (parseFloat(xVal) < groupMax)) {
          var yVal = data[k][yVar];
          values.push({ x: parseFloat(xVal), y: parseFloat(yVal), row: k });
          dataViolin.push({ group: group, color: colors[group], x: xVal, y: yVal });
        }
      }
      dataXY[i] = { key: "group-" + group, values: values };
      
    }

    document.getElementById("group-toolbar-1").style["margin-top"] = "9px";
    document.getElementById("group-toolbar-" + nGroups).style["margin-bottom"] = "5px";

    updateNSubjectsRange();

    groups = [];
    for (var i = 1; i <= nGroups; i++) { 
      groups.push(i);
    };

    d3.select("#plot-select").on("change", updateNumericalSelection);
    
  }

  function loadData() {

    var groupVar = document.getElementById("group-select").value;
    var checkNum = false;

    for (var i = 0; i < data.length; i++) {
      var val = data[i][groupVar];
      if (parseFloat(val)) {
        checkNum = true;
      }
    }
    
    if (checkNum == false) {
      d3.select("#update-group-button").on("click", updateCategorical);
      if (!(dataUpdated)) { updateCategorical() };
    } else {
      d3.select("#update-group-button").on("click", updateNumerical);
      if (!(dataUpdated)) { updateNumerical() };
    }
  }

  d3.select("#group-select").on("change", loadData);

  function plotData() {

    loadData();

    groupVar = document.getElementById("group-select").value;
    plotVar = document.getElementById("y-data-1").value;

    if ((groupVar == "") & (plotVar != "")) {
      alert("Please select a grouping variable");
    }
    
    if ((groupVar != "") & (plotVar == "")) {
      alert("Please select a plotting variable");
    }
    
    if ((groupVar == "") & (plotVar == "")) {
      alert("Please select grouping and plotting variables");
    }

    if ((groupVar != "") & (plotVar != "")) {

      document.getElementById("footer").style.top = "336px";
      
      updateAxisLabels();
      updateScatter();
      updateViolin();

    }
  }

  d3.select("#update-plot-button").on("click", plotData);

  var margin = {top: 20, right: 55, bottom: 50, left: 63};

  var width = 440 - margin.left - margin.right,
    height = 330 - margin.top - margin.bottom;

  var padding = 15;

  xExtent = findExtent(dataXY, 'x');
  yExtent = findExtent(dataXY, 'y');
    
  var xScale = d3.scaleLinear()
    .range([padding / 2, width - padding / 2])
    .domain(xExtent).nice();

  var yScale = d3.scaleLinear()
    .range([height - padding / 2, padding / 2])
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

  // X-axis label
  svg.append("text")
      .attr("id", "x-label")          
      .attr("transform",
            "translate(" + (width / 2 + margin.left) + " ," + 
                           (height + margin.top + 39) + ")")
      .style("text-anchor", "middle")
      .text("");

  // Y-axis label
  svg.append("text")
      .attr("id", "y-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 73)
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

  var dot = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
      .range([padding / 2, width - padding / 2])
      .domain(xExtent).nice();

    var yScale = d3.scaleLinear()
      .range([height - padding / 2, padding / 2])
      .domain(yExtent).nice();

    var xAxis = d3.axisBottom(xScale).ticks(12),
      yAxis = d3.axisLeft(yScale).ticks(12 * height / width);

    d3.select(".x.axis").remove();
    d3.select(".y.axis").remove();

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
    xAxis.scale(new_xScale);
    yAxis.scale(new_yScale);

    svg.transition().duration(duration).select(".x.axis").call(xAxis);
    svg.transition().duration(duration).select(".y.axis").call(yAxis);

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
                  .duration(duration)    
                  .style("opacity", 0.9);    
              div.html("Row " + d.row)  
                  .style("left", (d3.event.pageX) + 1 + "px")   
                  .style("top", (d3.event.pageY - 26) + "px");  
              })          
          .on("mouseout", function(d) {   
              div.transition()    
                  .duration(duration)    
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
    
    xScale.range([padding / 2, width - padding / 2]);
    yScale.range([height - padding / 2, padding / 2]);
    
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
function updateViolin() {

  document.getElementById("chart-violin").innerHTML = "";

  d3.csv(file, function(data) {

    var margin = {top: 20, right: 30, bottom: 50, left: 88};

    var width = 430 - margin.left - margin.right,
      height = 330 - margin.top - margin.bottom;

    var padding = 15;

    // Append the svg object to the body of the page
    var svg = d3.select("#chart-violin")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    // X-axis label
    svg.append("text")
      .attr("id", "x-label-violin")          
      .attr("y", height + margin.top + 18)
      .attr("x", width / 2)
      .style("text-anchor", "middle")
      .text("Group");

    // Y-axis label
    svg.append("text")
        .attr("id", "y-label-violin")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 35)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yVar); 

    // Build and show the Y scale
    var y = d3.scaleLinear()
      .domain(yExtent).nice() // Note that here the Y scale is set manually
      .range([height - padding / 2, padding / 2])
    svg.append("g")
      .call( d3.axisLeft(y) )

    // Build and show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3.scaleBand()
      .range([padding / 2, width - padding / 2])
      .domain(groups)
      .padding(0.05) // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    
    // Features of the histogram
    var histogram = d3.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(20)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value(d => d)
    
    // Compute the binning for each group of the dataset
    var sumstat = d3.nest()  // Nest function allows to group the calculation per level of a factor
      .key(function(d) { return d.group;})
      .rollup(function(d) {   // For each key...
        input = d.map(function(g) { return parseFloat(g.y);})    // Keep the Y variable
        bins = histogram(input)   // And compute the binning on it
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
      .range([padding / 2, x.bandwidth() - padding / 2])
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

  var barWidth = 100 / nGroups;

  // Load distributions for the Y variable
  var groupCounts = {};
  var globalCounts = [];
  for (var i = 0; i < nGroups; i++) {
    groupCounts[i+1] = [];
  };
  for (var i = 0; i < dataViolin.length; i++) {
    var key = dataViolin[i]["group"];
    var entry = parseFloat(dataViolin[i]["y"]);
    groupCounts[key].push(entry);
    globalCounts.push(entry);
  }

  // Sort group counts so quantile methods work
  for(var key in groupCounts) {
    var groupCount = groupCounts[key];
    groupCounts[key] = groupCount.sort(sortNumber);
  }

  // Prepare the data for the box plots
  var boxPlotData = [];
  for (var [key, groupCount] of Object.entries(groupCounts)) {

    if (groupCount.length > 0) {
      var record = {};
      var localMin = d3.min(groupCount);
      var localMax = d3.max(groupCount);

      record["key"] = key;
      record["counts"] = groupCount;
      record["quartile"] = boxQuartiles(groupCount);
      record["whiskers"] = [localMin, localMax];
      boxPlotData.push(record);
    }
  }


  // Compute an ordinal xScale for the keys in boxPlotData
  var xScale = d3.scaleBand()
      .range([padding / 2, width - padding / 2])
      .domain(groups)
      .padding(0.05) // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.

  // Compute a global y scale based on the global counts
  var min = d3.min(globalCounts);
  var max = d3.max(globalCounts);
  var yScale = d3.scaleLinear()
    .domain(yExtent).nice() // Note that here the Y scale is set manually
    .range([height - padding / 2, padding / 2])

  // Setup the group the box plot elements will render in
  x_shift = margin.left / nGroups;
  y_shift = margin.top / nGroups;
  var g = svg.append("g")
    .attr("transform",
          "translate(" + x_shift + "," + y_shift + ")");

  // Draw the box plot vertical lines
  var verticalLines = g.selectAll(".verticalLines")
    .data(boxPlotData)
    .enter()
    .append("line")
    .attr("x1", function(datum) {
        return xScale(datum.key) + barWidth / 2;
      }
    )
    .attr("y1", function(datum) {
        var whisker = datum.whiskers[0];
        return yScale(whisker);
      }
    )
    .attr("x2", function(datum) {
        return xScale(datum.key) + barWidth / 2;
      }
    )
    .attr("y2", function(datum) {
        var whisker = datum.whiskers[1];
        return yScale(whisker);
      }
    )
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("fill", "white")
    .attr("fill-opacity", "0.5");

  // Draw the boxes of the box plot, filled in white and on top of vertical lines
  var rects = g.selectAll("rect")
    .data(boxPlotData)
    .enter()
    .append("rect")
    .attr("width", barWidth)
    .attr("height", function(datum) {
        var quartiles = datum.quartile;
        var height = yScale(quartiles[0]) - yScale(quartiles[2]);
        return height;
      }
    )
    .attr("x", function(datum) {
        return xScale(datum.key);
      }
    )
    .attr("y", function(datum) {
        if (datum["counts"].length > 0) {
          return yScale(datum.quartile[2]);
        } 
      }
    )
    .attr("fill", "white" )
    .attr("fill-opacity", "0.5")
    .attr("stroke", function(datum) {
      if (datum["counts"].length > 0) {
          return "#000";
        } else { return "none" }
    })
    .attr("stroke-width", function(datum) {
      if (datum["counts"].length > 0) {
          return 1;
        } else { return 0 }
    });

  // Now render all the horizontal lines at once - the whiskers and the median
  var horizontalLineConfigs = [
    // Top whisker
    {
      x1: function(datum) { return xScale(datum.key) },
      y1: function(datum) { return yScale(datum.whiskers[0]) },
      x2: function(datum) { return xScale(datum.key) + barWidth },
      y2: function(datum) { return yScale(datum.whiskers[0]) }
    },
    // Median line
    {
      x1: function(datum) { return xScale(datum.key) },
      y1: function(datum) { return yScale(datum.quartile[1]) },
      x2: function(datum) { return xScale(datum.key) + barWidth },
      y2: function(datum) { return yScale(datum.quartile[1]) }
    },
    // Bottom whisker
    {
      x1: function(datum) { return xScale(datum.key) },
      y1: function(datum) { return yScale(datum.whiskers[1]) },
      x2: function(datum) { return xScale(datum.key) + barWidth },
      y2: function(datum) { return yScale(datum.whiskers[1]) }
    }
  ];

  for (var i = 0; i < horizontalLineConfigs.length; i++) {
    var lineConfig = horizontalLineConfigs[i];

    // Draw the whiskers at the min for this series
    var horizontalLine = g.selectAll(".whiskers")
      .data(boxPlotData)
      .enter()
      .append("line")
      .attr("x1", lineConfig.x1)
      .attr("y1", lineConfig.y1)
      .attr("x2", lineConfig.x2)
      .attr("y2", lineConfig.y2)
      .attr("stroke", "#000")
      .attr("stroke-width", 1)
      .attr("fill", "none");
  }

  function boxQuartiles(d) {
    return [
      d3.quantile(d, .25),
      d3.quantile(d, .5),
      d3.quantile(d, .75)
    ];
  }
    
  // Perform a numeric sort on an array
  function sortNumber(a,b) {
    return a - b;
  }

  })

};