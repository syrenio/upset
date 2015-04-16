/*
  use renderRows and sets-> Original Data !
*/

(function(window) {
  //window.Powerset = window.Powerset || {};
  //var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";

  $(".header-container").append("<span> Powerset: <input type='checkbox' checked='checked' onclick='window.Powerset.toggle()'></span>");

  var ps = window.Powerset = function PowerSet(c, rr, s, scale) {
    var svg = d3.select("#bodyVis").select("svg");
    var ctx = c;
    var renderRows = rr;
    var sets = s;
    var setScale = scale;
    // console.log("init powerset with " + renderRows.length + " renderRows");
    // console.log("init powerset with " + sets.length + " sets");

    $("#bodyVis").prepend("<div id='ps-control-panel' class='ps-control-panel'></div>");

    var controlPanel = $("#ps-control-panel");

    function getGroupRows() {
      function fnCheck(d){
        return (d.data.type === ROW_TYPE.GROUP || d.data.type === ROW_TYPE.AGGREGATE);
      }
      return renderRows.filter(function(d, i) {
        return fnCheck(d);
      });
    }

    function getSubsetRows() {
      return renderRows.filter(function(d) {
        return d.data.type === ROW_TYPE.SUBSET;
      });
    }

    function getGroupNames() {
      // get array of group names + subsets
      return groupRows.map(function(o) {
        var text = o.data.elementName;
        o.data.subSets.forEach(function(obj) {
          var setNames = obj.combinedSets.map(function(value, idx) {
            if (value === 1) {
              return idx;
            }
          });
          var name = "";
          setNames.forEach(function(val, idx) {
            if (val) {
              name += (name.length > 0 ? " | " : "") + window.sets[val].elementName;
            }
          });
          if (obj.setSize > 0) {
            text += ":  " + name + "(" + obj.setSize + ")";
          }
        });
        return text;
      });
    }

    function printText() {
      var groupNames = getGroupNames();
      //  write texts for groupnames
      var elem = svg.selectAll("text").data(groupNames).enter();
      elem.append("text")
        .attr("fill", "red")
        .attr("y", function(d, idx) {
          return 20 + (20 * idx);
        })
        .text(function(d, idx) {
          return d;
        });
    }

    // better with map-reduce
    function getSizeOfGroup(group) {
      var size = 0;
      group.data.subSets.forEach(function(itm, idx) {
        size += itm.setSize;
      });
      return size;
    }

    this.draw = function() {

      var groupRows = getGroupRows();
      var subsetRows = getSubsetRows();

      var visContainer = $(document.getElementById("set-vis-container"));

      svg.attr("height", parseInt(visContainer.height() - 300, 10));
      svg.attr("width", parseInt(visContainer.width() - 200, 10));
      var svgWidth = parseInt(svg.attr("width"), 10);
      var svgHeight = parseInt(svg.attr("height"), 10);
      var degreeHeight = svgHeight / groupRows.length;
      ps.degreeWidth = svgWidth - 200;

      var allSizes = 0;
      var sizes = [];
      groupRows.forEach(function(group, idx) {
        var size = getSizeOfGroup(group);
        allSizes += size;
        sizes.push(size);
      });

      //debugger
      //console.error(allSizes);
      var groupPadding = 10;
      var sizeMulti = (svgHeight - (groupRows.length * groupPadding)) / allSizes;

      svg.selectAll("text.pw-gset").remove();
      var groupRects = svg.selectAll("rect.pw-gset").data(groupRows);
      groupRects.enter()
        .append("rect")
        .attr("class", function(d, idx) {
          return "pw-gset pw-gset-" + idx;
        })
        .attr("x", 20)
        .attr("y", function(d, idx) {
          var startpoint = 10;
          var preRows = 0;
          for (var i = idx - 1; i >= 0; i--) {
            preRows += (sizes[i] * sizeMulti) + groupPadding;
          }
          return startpoint + preRows;
        })
        .attr("width", ps.degreeWidth)
        .attr("height", function(d, idx) {
          return (sizes[idx] * sizeMulti);
        })
        .on("click", function(d, idx) {
          console.info(d.data.elementName, sizes[idx], d.data.subSets);
        });
      groupRects.exit().remove();

      svg.selectAll("text.pw-gtext").remove();
      var gTexts = svg.selectAll("text.pw-gtext").data(groupRows);
      gTexts.enter()
        .append("text")
        .text(function(d,idx) {
          return idx; //d.data.elementName;
        })
        .attr("class", "pw-gtext")
        .attr("x", 5)
        .attr("y", function(d, idx) {
          var startpoint = 10;
          var preRows = 0;
          for (var i = idx - 1; i >= 0; i--) {
            preRows += (sizes[i] * sizeMulti) + groupPadding;
          }
          return 30 + startpoint + preRows;
        })
      gTexts.exit().remove();

      drawSubsets(groupRects, setScale);
      drawElementsByDegree();
    };

    function drawSubsets(setRects, setScale) {

      //console.warn(setRects);
      setRects.each(function(d, idx) {
        var g = d3.select(this);
        var x = parseInt(g.attr("x"), 10);
        var y = parseInt(g.attr("y"), 10);
        var gWidth = parseInt(g.attr("width"), 10);
        var gHeight = parseInt(g.attr("height"), 10);


        // TODO maybe use subsetRows --> more information
        var subsets = d.data.subSets;

        if (ps.showSubsetWithoutData) {
          subsets = subsets.filter(function(d) {
            return d.setSize > 0;
          })
        }

        //var height = 30;
        //var width = 30;
        var width = (gWidth - (10 * (subsets.length - 1))) / subsets.length;
        var height = (gHeight);


        svg.selectAll("rect.pw-set-"+ idx).remove();
        var subSetRects = svg.selectAll("rect.pw-set-" + idx).data(subsets);
        subSetRects.enter().append("rect")
          .attr("class", "pw-set pw-set-" + idx)
          .attr("x", function(d, idx) {
            var val = (width * idx) + (10 * idx);
            return x + (val % ps.degreeWidth);
          })
          .attr("y", function(d, idx) {
            var val = ((width) * idx);
            var row = parseInt(val / ps.degreeWidth, 10);
            return y + (row * height);
          })
          .on("click", function(d) {
            console.info(d.elementName, d.setSize, d.items);
          })
          .attr("width", width)
          .attr("height", height);
        subSetRects.exit().remove();

        if (ps.showSubsetTexts) {
          var subSetTexts = svg.selectAll("text.pw-set-text-" + idx).data(subsets).enter();
          subSetTexts.append("text")
            .attr("class", "pw-set-text pw-set-text-" + idx)
            .attr("x", function(d, idx) {
              var val = ((width * 2) * idx);
              var row = parseInt(val / ps.degreeWidth, 10);
              return x + (val % ps.degreeWidth);
            })
            .attr("y", function(d, idx) {
              var val = ((height * 2) * idx);
              var row = parseInt(val / ps.degreeWidth, 10);
              return y + height + (row * height) + (height / 2);
            })
            .text(function(d, i) {
                return d.elementName;
            });
        }
      });
    }


    function drawSetsBySize(){

    }

    function drawElementsByDegree(){
      var groupRows = getGroupRows();

      var overallSize = groupRows.map(function(d) {
        return d.data.setSize;
      }).reduce(function(preVal,val,idx){
        return preVal + val;
      });


      controlPanel.find("#ps-control-panel-degree").remove();
      var degPanel = controlPanel.append("<div id='ps-control-panel-degree'></div>").find("#ps-control-panel-degree");

      degPanel.append("<h3>Elements by Degree");

      degPanel.append("<div class='elm-by-deg-scale'><span>0</span><span>" + overallSize + "</span></div>");

      degPanel.append("<div id='elm-by-deg-rows'></div>");

      var rows = d3.select("#elm-by-deg-rows").selectAll("div.row").data(groupRows);


      rows.enter()
          .append("div")
          .classed({"row":true})
          .html(function(d,idx){
            var str = "<input type='checkbox' checked='checked' value='"+idx+"'>";
            str += "<span>" + idx + "</span>";
            str += "<progress value='" + (d.data.setSize/overallSize*100) + "' max='100'></progress>";

            return str;
          });
      rows.exit().remove();

    }

  };

  /* OPTIONS */
  ps.active = true;
  ps.showSubsetTexts = false;
  ps.showSubsetWithoutData = true;
  ps.toggle = function() {
    ps.active = !ps.active;
    console.info("Powerset active: " + ps.active);
    UpSet();
  };

})(window);
