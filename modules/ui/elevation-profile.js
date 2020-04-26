"use strict";

function showEPForRoute(node) {
  const points = [];
  debug.select("#controlPoints").selectAll("circle").each(function() {
    const i = findCell(this.getAttribute("cx"), this.getAttribute("cy"));
    points.push(i);
  });

  const routeLen = node.getTotalLength() * distanceScaleInput.value;
  showElevationProfile(points, routeLen, false);
}

function showEPForRiver(node) {
  const points = [];
  debug.select("#controlPoints").selectAll("circle").each(function() {
    const i = findCell(this.getAttribute("cx"), this.getAttribute("cy"));
    points.push(i);
  });

  const riverLen = (node.getTotalLength() / 2) * distanceScaleInput.value;
  showElevationProfile(points, riverLen, true);
}

function resizeElevationProfile() {
}

function showElevationProfile(data, routeLen, isRiver) {
  // data is an array of cell indexes, routeLen is the distance, isRiver should be true for rivers, false otherwise
  document.getElementById("elevationGraph").innerHTML = "";

  $("#elevationProfile").dialog({
    title: "Elevation profile", resizable: false, width: window.width,
    position: {my: "left top", at: "left+20 bottom-240", of: window, collision: "fit"}
  });

  // Azgaar asked if we can prevent river graphs from showing rivers as flowing uphill
  var slope = 0;
  if (isRiver) {
    if (pack.cells.h[data[0]] < pack.cells.h[data[data.length-1]]) {
      slope = 1; // up-hill
    } else if (pack.cells.h[data[0]] > pack.cells.h[data[data.length-1]]) {
      slope = -1; // down-hill 
    }
  }

  const points = [];
  var prevB=0, prevH=-1, i=0, j=0, cell=0, b=0, ma=0, mi=100, h=0;
  for (var i=0; i<data.length; i++) {
    cell = data[i];

    h = pack.cells.h[cell];
    if (h < 20) h = 20;

    // check for river up-hill
    if (prevH != -1) {
      if (isRiver) {
        if (slope == 1 && h < prevH) h = prevH;
        else if (slope == 0 && h != prevH) h = prevH;
        else if (slope == -1 && h > prevH) h = prevH;
      }
    }
    prevH = h;
    // river up-hill checks stop here

    mi = Math.min(mi, h);
    ma = Math.max(ma, h);

    b = pack.cells.burg[cell];
    if (b == prevB) b = 0;
    else prevB = b;
    points.push({x:j, y:h, b:b});
    j++;
  }

  const heightDiff = ma-mi+1;


//  const w = document.getElementById("elevationProfile").clientWidth - 32;
  const w = window.innerWidth-280;
  h = 100;

  const xOffset = 100;
  const yOffset = 80;

  var chart = d3.select("#elevationGraph").append("svg").attr("width", w+200).attr("height", h+yOffset).attr("id", "elevationGraph");
  // arrow-head definition
  chart.append("defs").append("marker").attr("id", "arrowhead").attr("orient", "auto").attr("markerWidth", "2").attr("markerHeight", "4").attr("refX", "0.1").attr("refY", "2").append("path").attr("d", "M0,0 V4 L2,2 Z");

  // main graph line
  var lineFunc = d3.line()
    .x(function(d) { return d.x * w / points.length + xOffset})
    .y(function(d) { return h-d.y + yOffset });

  chart.append("path").attr("d", lineFunc(points)).attr("stroke", "purple").attr("fill", "none").attr("id", "elevationLine");

  // y-axis labels for starting and ending heights
  chart.append("text").attr("id", "epy0").attr("x", xOffset-10).attr("y", h-points[0].y + yOffset).attr("text-anchor", "end");
  document.getElementById("epy0").innerHTML = getHeight(points[0].y);
  chart.append("text").attr("id", "epy1").attr("x", w+100).attr("y", h-points[points.length-1].y + yOffset).attr("text-anchor", "start");
  document.getElementById("epy1").innerHTML = getHeight(points[points.length-1].y);

  // y-axis labels for minimum and maximum heights (if not too close to start/end heights)
  if (Math.abs(ma - points[0].y) > 3 && Math.abs(ma - points[points.length-1].y) > 3) {
    chart.append("text").attr("id", "epy2").attr("x", xOffset-10).attr("y", h-ma + yOffset).attr("text-anchor", "end");
    document.getElementById("epy2").innerHTML = getHeight(ma);
  }
  if (Math.abs(mi - points[0].y) > 3 && Math.abs(mi - points[points.length-1].y) > 3) {
    chart.append("text").attr("id", "epy3").attr("x", xOffset-10).attr("y", h-mi + yOffset).attr("text-anchor", "end");
    document.getElementById("epy3").innerHTML = getHeight(mi);
  }
  
  // x-axis label for start, quarter, halfway and three-quarter, and end
  chart.append("text").attr("id", "epx1").attr("x", xOffset).attr("y", h+yOffset).attr("text-anchor", "middle");
  chart.append("text").attr("id", "epx2").attr("x", w / 4 + xOffset).attr("y", h+yOffset).attr("text-anchor", "middle");
  chart.append("text").attr("id", "epx3").attr("x", w / 2 + xOffset).attr("y", h+yOffset).attr("text-anchor", "middle");
  chart.append("text").attr("id", "epx4").attr("x", w / 4*3 + xOffset).attr("y", h+yOffset).attr("text-anchor", "middle");
  chart.append("text").attr("id", "epx5").attr("x", w + xOffset).attr("y", h+yOffset).attr("text-anchor", "middle");
  document.getElementById("epx1").innerHTML = "0 " + distanceUnitInput.value;
  document.getElementById("epx2").innerHTML = rn(routeLen / 4) + " " + distanceUnitInput.value;
  document.getElementById("epx3").innerHTML = rn(routeLen / 2) + " " + distanceUnitInput.value;
  document.getElementById("epx4").innerHTML = rn(routeLen / 4*3) + " " + distanceUnitInput.value;
  document.getElementById("epx5").innerHTML = rn(routeLen) + " " + distanceUnitInput.value;

  chart.append("path").attr("id", "epx11").attr("d", "M" + (xOffset).toString() + ",0L" + (xOffset).toString() +"," + (h+yOffset-15).toString()).attr("stroke", "lightgray").attr("stroke-width", "1");
  chart.append("path").attr("id", "epx12").attr("d", "M" + (w / 4 + xOffset).toString() + "," + (h+yOffset-15).toString() + "L" + (w / 4 + xOffset).toString() + ",0").attr("stroke", "lightgray").attr("stroke-width", "1");
  chart.append("path").attr("id", "epx13").attr("d", "M" + (w / 2 + xOffset).toString() + "," + (h+yOffset-15).toString() + "L" + (w / 2 + xOffset).toString() + ",0").attr("stroke", "lightgray").attr("stroke-width", "1");
  chart.append("path").attr("id", "epx14").attr("d", "M" + (w / 4*3 + xOffset).toString() + "," + (h+yOffset-15).toString() + "L" + (w / 4*3 + xOffset).toString() + ",0").attr("stroke", "lightgray").attr("stroke-width", "1");
  chart.append("path").attr("id", "epx15").attr("d", "M" + (w + xOffset).toString() + ",0L" + (w + xOffset).toString() +"," + (h+yOffset-15).toString()).attr("stroke", "lightgray").attr("stroke-width", "1");

  // draw city labels - try to avoid putting labels over one another
  var y1 = 0;
  var add = 15;
  points.forEach(function(p) {
    if (p.b > 0) {
      var x1 = p.x * w / points.length + xOffset;
      y1+=add;
      if (y1 >= yOffset) { y1 = add; }
      var d1 = 0;

      // burg name
      chart.append("text").attr("id", "ep" + p.b).attr("x", x1).attr("y", y1).attr("text-anchor", "middle");
      document.getElementById("ep" + p.b).innerHTML = pack.burgs[p.b].name;

      // arrow from burg name to graph line
      chart.append("path").attr("id", "eparrow" + p.b).attr("d", "M" + x1.toString() + "," + (y1).toString() + "L" + x1.toString() + "," + parseInt(h-p.y-3+yOffset).toString()).attr("stroke", "black").attr("stroke-width", "1").attr("marker-end", "url(#arrowhead)");
    }
  });


}
