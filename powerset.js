/* global queryParameters */
/* global UpSet */
/* global Powerset */
/* global ROW_TYPE */
/* global attributes */
/* global d3 */
/* global $ */
/*
  use renderRows and sets-> Original Data !
*/

(function(window) {

  //window.Powerset = window.Powerset || {};
  //var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";

  // $(".header-container").append("<span> Powerset: <input type='checkbox' checked='checked' onclick='window.Powerset.toggle()'></span>");


  var ps = window.Powerset = function PowerSet(c, rr, s, scale) {
    var that = this;
    var svg = d3.select("#bodyVis").select("svg");
    var ctx = c;
    var renderRows = rr;
    var sets = s;
    var setScale = scale;

    var pwDrawInfo = {};
    
    window.Powerset.colorByAttribute = setAttributeOrFirstAttribute(window.Powerset.colorByAttribute);
    // console.log("init powerset with " + renderRows.length + " renderRows");
    // console.log("init powerset with " + sets.length + " sets");

    $("#bodyVis").prepend("<div id='ps-control-panel' class='ps-control-panel'></div>");

    var controlPanel = $("#ps-control-panel");

    function getGroupRows() {
      function fnCheck(d) {
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
    
    
    function setAttributeOrFirstAttribute(name){
      var attrs = getAttributes().filter(function(d,i){return d.name===name;});
      if(attrs && attrs.length > 0){
        name = attrs[0].name;
      }else{
        name = getAttributes()[0].name;
      }
      return name;
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

    function getAttributes() {
      var ignoredSetNames = ["Set Count", "Sets"];
      var list = [];
      for (var i = attributes.length - 1; i >= 0; i--) {
        if (ignoredSetNames.indexOf(attributes[i].name) === -1) {
          list.push(attributes[i]);
        }
      }
      return list;
    }


    function getAttributeInfo(val) {

      var strinfo = "";
      var arr = getAttributes();
      for (var i = arr.length - 1; i >= 0; i--) {
        var attr = arr[i];
        strinfo += attr.name + ":" + attr.values[val] + "  ";
      };
      return strinfo;
    }

    function getAttributeValue(name, val) {
      for (var i = attributes.length - 1; i >= 0; i--) {
        var attr = attributes[i];
        if (attr.name === name) {
          return attr.values[val];
        }
      }
    }
    
    function getAttributeByName(name, val) {
      for (var i = attributes.length - 1; i >= 0; i--) {
        var attr = attributes[i];
        if (attr.name === name) {
          return attr;
        }
      }
    }

    function getRenderRowById(id) {
      return renderRows.filter(function(d) {
        return d.data.id === id;
      })[0];
    }

    this.clear = function() {
      $("#ps-control-panel").remove();
    };

    this.draw = function() {
      var date = new Date();
      console.log("called draw " + date);

      var groupRows = getGroupRows();
      var subsetRows = getSubsetRows();

      var visContainer = $(document.getElementById("set-vis-container"));

      
      //svg.attr("height", parseInt(visContainer.height() - 300, 10));
      //svg.attr("width", parseInt(visContainer.width() - 200, 10));
      svg.attr("height",Powerset.size.height);
      svg.attr("width",Powerset.size.width);
      var svgWidth = parseInt(svg.attr("width"), 10);
      var svgHeight = parseInt(svg.attr("height"), 10);
      ps.degreeWidth = svgWidth - 30;

      console.log("svgHeight",svgHeight);
      console.log("svgWidth",svgWidth);

      var allSizes = 0;
      groupRows.forEach(function(group, idx) {
        allSizes += group.data.setSize;
      });

      var groupPadding = 10;
      var groupHeights = [];
      groupRows.forEach(function(set, idx) {
        var x = (svgHeight - (groupPadding * (groupRows.length - 1))) / allSizes;
        groupHeights[idx] = parseFloat((set.data.setSize * x).toFixed(3),10);
      });

      // TODO: insert <g>
      svg.selectAll("rect.pw-gset").remove();
      var groupRects = svg.selectAll("rect.pw-gset").data(groupRows);
      groupRects.enter()
        .append("rect")
        .attr("class", function(d, idx) {
          return "pw-gset pw-gset-" + idx;
        })
        .attr("x", 20)
        .attr("y", function(d, idx) {
          //var val = (setWidths[idx] * idx) + (10 * idx);
          var prevHeights = groupHeights.filter(function(x,i){return i < idx; });
          var prevHeight = 0;
          if(prevHeights.length > 0){
            prevHeight = prevHeights.reduce(function(r,x){return r+x;});
          }
          prevHeight += (groupPadding * idx);
          //var val = groupHeights[idx];
          return prevHeight; //+ (val % ps.degreeWidth);

          /*
          var startpoint = 10;
          var preRows = 0;
          for (var i = 0; i <= idx - 1; i++) {
            preRows += (groupHeights[i] * sizeMulti) + groupPadding;
          }
          return startpoint + preRows;
          */
        })
        .attr("width", ps.degreeWidth)
        .attr("height", function(d, idx) {
          return groupHeights[idx];
        })
        .on("click", function(d, idx) {
          console.info(d.data.elementName, groupHeights[idx]);
        });
      groupRects.exit().remove();

      svg.selectAll("text.pw-gtext").remove();
      var gTexts = svg.selectAll("text.pw-gtext").data(groupRows);
      gTexts.enter()
        .append("text")
        .text(function(d, idx) {
          return idx; //d.data.elementName;
        })
        .attr("class", "pw-gtext")
        .attr("x", 5)
        .attr("y", function(d, idx) {
          var prevHeights = groupHeights.filter(function(x,i){return i < idx; });
          var prevHeight = 0;
          if(prevHeights.length > 0){
            prevHeight = prevHeights.reduce(function(r,x){return r+x;});
          }
          prevHeight += (groupPadding * idx);
          var val = groupHeights[idx];
          return (val / 2) + prevHeight; //+ (val % ps.degreeWidth);
        });
      gTexts.exit().remove();

      drawSubsets(groupRects, setScale);
      drawSetsBySize();
      drawElementsByDegree();
      

      createStyle();
      createAttributeSelect();

    };

    function getVisualStats(){
      var stats = ctx.summaryStatisticVis.filter(function(x) {
        if (Powerset.colorByAttribute === x.attribute) {
          return x;
        }
      })[0];
      return stats;
    }

    function drawSubsets(setRects, setScale) {

      svg.selectAll("rect.pw-set").remove();
      svg.selectAll("text.pw-set-text").remove();
      //console.warn(setRects);
      setRects.each(function(d, idx) {
        var g = d3.select(this);
        var x = parseInt(g.attr("x"), 10);
        var y = parseInt(g.attr("y"), 10);
        var gWidth = parseInt(g.attr("width"), 10);
        var gHeight = parseInt(g.attr("height"), 10);

        var groupSetSize = d.data.setSize;

        // TODO maybe use subsetRows --> more information
        var subsets = d.data.subSets;

        subsets.sort(function(a,b){
          return b.setSize - a.setSize;
        });

        if (ps.showSubsetWithoutData) {
          subsets = subsets.filter(function(d) {
            return d.setSize > 0;
          });
        }

        var setWidths = [];
        subsets.forEach(function(set, idx) {
          var x = (gWidth - (10 * (subsets.length - 1))) / groupSetSize;
          setWidths[idx] = parseFloat((set.setSize * x).toFixed(3),10);
        });

        //var height = 30;
        //var width = 30;
        //var width = (gWidth - (10 * (subsets.length - 1))) / subsets.length;
        var height = (gHeight);

        // TODO: insert <g>
        svg.selectAll("rect.pw-set-" + idx).remove();
        var subSetRects = svg.selectAll("rect.pw-set-" + idx).data(subsets);
        subSetRects.enter().append("rect")
          .attr("class", function(d) {
            var arrValues = [];
            
            for (var i = d.items.length - 1; i >= 0; i--) {
              var itm = d.items[i];
              var val = getAttributeValue(Powerset.colorByAttribute, itm);
              arrValues.push(val);
            };
            
            return "pw-set pw-set-" + idx;
          })
          .attr("data-median",function(d){
            var attr = getAttributeByName(Powerset.colorByAttribute);
            if (ctx.summaryStatisticVis.length) {
              var stats = getVisualStats();
              if(stats){
                var curRenderRow = getRenderRowById(d.id);
                var statistics = stats.visObject.statistics[curRenderRow.id];
                var fixedNumber = attr.type==="float" ? 3 : 0;
                return statistics.median.toFixed(fixedNumber);
              }
            }
          })
          .style({
            fill: function(d,i){
              var stats = getVisualStats();
              if(!stats){
                return '#'+Math.floor(Math.random()*16777215).toString(16);  
              }
            }
          })
          .attr("x", function(d, idx) {
            //var val = (setWidths[idx] * idx) + (10 * idx);
            var prevWidths = setWidths.filter(function(x,i){return i < idx; });
            var prevWidth = 0;
            if(prevWidths.length > 0){
              prevWidth = prevWidths.reduce(function(r,x){return r+x;});
            }
            prevWidth += (10 * idx);
            // var val = idx === 0 ? 0 : setWidths[idx];
            return x + prevWidth; //+ (val % ps.degreeWidth);
          })
          .attr("y", function(d, idx) {
            var val = setWidths[idx];
            // var row = parseInt(val / ps.degreeWidth, 10);
            var row = 0; 	
            return y + (row * height);           
          })
          .on("click", function(d) {
            var strNames = d.items.map(getAttributeInfo);
            console.info(d.elementName, d.setSize, strNames.join(","), d);
          })
          .attr("width",function(d,idx){
            return setWidths[idx];
          })
          .attr("height", height);
        subSetRects.exit().remove();

        if (ps.showSubsetTexts) {
          svg.selectAll("text.pw-set-text-" + idx).remove();
          var subSetTexts = svg.selectAll("text.pw-set-text-" + idx).data(subsets).enter();
          subSetTexts.append("text")
            .attr("class", "pw-set-text pw-set-text-" + idx)
            .attr("x", function(d, idx) {
              // var val = (width * idx) + (10 * idx);
              var prevWidths = setWidths.filter(function(x,i){return i < idx; });
              var prevWidth = 0;
              if(prevWidths.length > 0){
                prevWidth = prevWidths.reduce(function(r,x){return r+x;});
              }
              prevWidth += (10 * idx);
              var val = setWidths[idx];
              //var rectX = x + (val % ps.degreeWidth);
              //return (val / 2) + rectX + prevWidth;
              var rectX  = x;
              return rectX + prevWidth + (val / 2);
            })
            .attr("y", function(d, idx) {
              //var val = ((width) * idx);
              var val = setWidths[idx];
              var row = parseInt(val / ps.degreeWidth, 10);
              var rectY = y + (row * height);
              return (height / 2) + rectY;

            })
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .text(function(d, i) {
              return d.elementName;
            });
        }
      });
    }
    
    function drawSetsBySize(){      
      
      var subsetRows = getSubsetRows().sort(function(a,b){ return b.data.setSize - a.data.setSize;});

      var maxSize = 0;
      var totalSize = 0;
      var overallSize = 0;
      totalSize = subsetRows.map(function(d) {
        return d.data.setSize;
      }).reduce(function(preVal, val, idx) {
        return preVal + val;
      });
      var arr = subsetRows.map(function(d){
        return d.data.setSize;
      });
      maxSize = Math.max.apply(null,arr);
      
      if(Powerset.controlPanelPercentByTotal){
         overallSize = totalSize;
      }else{
        overallSize = maxSize;
      }
      
      controlPanel.find("#ps-control-panel-sets").remove();
      var setsPanel = controlPanel.append("<div id='ps-control-panel-sets'></div>").find("#ps-control-panel-sets");
      setsPanel.append("<h3>Sets by size");

      setsPanel.append("<div class='elm-by-sets-scale'><span>0</span><span>" + overallSize + "</span></div>");
      
      setsPanel.append("<div id='elm-by-sets-rows'></div>");
      var rows = d3.select("#elm-by-sets-rows").selectAll("div.row").data(subsetRows);
      rows.enter()
        .append("div")
        .html(function(d, idx) {
          var str = "<input type='checkbox' checked='checked' value='" + idx + "'>";
          //str += "<span>" + d.data.elementName + "</span>";
          var titleText = d.data.elementName + " - " + (d.data.setSize / totalSize * 100).toFixed(3);
          str += "<progress title='" + titleText + "' value='" + (d.data.setSize / overallSize * 100) + "' max='100'></progress>";
          return str;
        });
      rows.exit().remove();
    }
    
    function drawElementsByDegree() {
      var groupRows = getGroupRows();

      var maxSize = 0;
      var totalSize = 0;
      var overallSize = 0;
      totalSize = groupRows.map(function(d) {
        return d.data.setSize;
      }).reduce(function(preVal, val, idx) {
        return preVal + val;
      });
      var arr = groupRows.map(function(d){
        return d.data.setSize;
      });
      maxSize = Math.max.apply(null,arr);
      
      if(Powerset.controlPanelPercentByTotal){
         overallSize = totalSize;
      }else{
        overallSize = maxSize;
      }

      controlPanel.find("#ps-control-panel-degree").remove();
      var degPanel = controlPanel.append("<div id='ps-control-panel-degree'></div>").find("#ps-control-panel-degree");

      degPanel.append("<h3>Elements by Degree");

      degPanel.append("<div class='elm-by-deg-scale'><span>0</span><span>" + overallSize + "</span></div>");

      degPanel.append("<div id='elm-by-deg-rows'></div>");

      var rows = d3.select("#elm-by-deg-rows").selectAll("div.row").data(groupRows);


      rows.enter()
        .append("div")
        .classed({
          "row": true
        })
        .html(function(d, idx) {
          var str = "<input type='checkbox' checked='checked' value='" + idx + "'>";
          str += "<span>" + idx + "</span>";
          var titleText = d.data.elementName + " - " + (d.data.setSize / totalSize * 100).toFixed(3);
          str += "<progress title='" + titleText + "' value='" + (d.data.setSize / overallSize * 100) + "' max='100'></progress>";

          return str;
        });
      rows.exit().remove();

    }

    function createStyleItems(attr) {
      var min = window.Powerset.colorByAttributeValues.min;
      var max = window.Powerset.colorByAttributeValues.max;
      var colorScale = d3.scale.linear().domain([attr.min,attr.max]).range([min.color,max.color]);
      var arr = [];
      
      var subsetRects = svg.selectAll("rect.pw-set");
      subsetRects.each(function(d,i) {
        var rect = $(this);
        var median = rect.data("median");
        var hexColor = colorScale(median);
        arr.push({
          name: "rect.pw-set[data-median='" + median + "']",
          styles: ["fill:" + hexColor]
        });
      });

      
      
      
      return arr;
    }

    function createStyle() {
      var attr = getAttributes().filter(function(d,i){ return d.name===window.Powerset.colorByAttribute;})[0];
      if(!attr){
        attr = getAttributes()[0];
      }
      
      var pwStyle = $("#pw-style");
      if(pwStyle.length > 0){
        pwStyle.remove();
      } 
      else {
        /*
        var arrStyles = [{
          name: ".pw-set",
          styles: ["fill:#dedede"]
        }];
        */
        var arrStyles = [];
        if(attr && attr.type==="integer"){
          arrStyles = createStyleItems(attr);
        }else if(attr && attr.type==="float"){
          arrStyles = createStyleItems(attr);
        }

        var mapped = arrStyles.map(function(d) {
          return d.name + "{" + d.styles.join(";") + "}";
        });

        $('head').append('<style id="pw-style" type="text/css">' + mapped.join(" ") + '</style>');
      }
    }

    function setColorByAttribute(e){
      window.Powerset.colorByAttribute = e.currentTarget.value;
      createStyle();
      window.pwInstance.draw();
    }

    /*
     * create attribute selector 
     * recreate if attribute-count would change 
     */
    function createAttributeSelect() {
      var attrSelect = $("#attr-select");
      var prevDatasetId = queryParameters.dataset;
      if(attrSelect.length > 0 && attrSelect.data("datasetid") !== prevDatasetId){
        attrSelect.parent().remove();
        attrSelect = $("#attr-select");
      }
      if (attrSelect.length <= 0) {
        var builder = ["<span> Attribute: "];
        builder.push("<select id='attr-select'>");
        var arr = getAttributes();
        for (var i = arr.length - 1; i >= 0; i--) {
          var x = arr[i];
          var selected = Powerset.colorByAttribute === x.name;
          builder.push("<option value='" + x.name + "' + selected='" + selected + "'>" + x.name + " </option>");
        };
        builder.push("</select>");
        builder.push("</span>");
        $(".header-container").append(builder.join(""));
        var sel = $("#attr-select");
        sel.data("datasetid",queryParameters.dataset);
        sel.on("change",setColorByAttribute);
      }
    }

  };


  /* OPTIONS */
  ps.active = true;
  ps.size = {
    height : 700,
    width : 700
  };
  /* show percent in control panel by total size or by max size(largest member) */
  ps.controlPanelPercentByTotal = false;
  
  /* X Percent is reserved for the "+Show more Block" */
  ps.showMorePercent = 10; 
  ps.showSubsetTexts = true;
  ps.showSubsetWithoutData = true;
  ps.colorByAttribute = "Times Watched";
  /* auto define min and max value */
  ps.colorByAttributeValues = {
    min: {
      color: "white"
    },
    max: {
      color: "darkblue"
    }
  };
  ps.toggle = function() {
    ps.active = !ps.active;
    console.info("Powerset active: " + ps.active);
    UpSet();
  };


})(window);
