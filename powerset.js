/* global usedSets */
/* global setIdToSet */
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

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j, 1);
        }
    }
    return a;
};

(function(window) {

  //window.Powerset = window.Powerset || {};
  //var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";

  // $(".header-container").append("<span> Powerset: <input type='checkbox' checked='checked' onclick='window.Powerset.toggle()'></span>");


  var ps = window.Powerset = function PowerSet(c, rr, s) {
    var that = this;
    var svg = d3.select("#bodyVis").select("svg");
    var ctx = c;
    var renderRows = rr;
    var sets = s;

    var openSets = [];
    var selectedSets = [];
    
    
    window.Powerset.colorByAttribute = setAttributeOrFirstAttribute(window.Powerset.colorByAttribute);
    // console.log("init powerset with " + renderRows.length + " renderRows");
    // console.log("init powerset with " + sets.length + " sets");

    $("#bodyVis").prepend("<div id='ps-control-panel' class='ps-control-panel'></div>");

    var controlPanel = $("#ps-control-panel");

    function getGroupRows() {
      function fnCheck(d) {
        return (d.data.type === ROW_TYPE.GROUP || d.data.type === ROW_TYPE.AGGREGATE);
      }
      return renderRows.filter(function(d) {
        return fnCheck(d);
      });
    }

    function getSubsetRows() {
      return renderRows.filter(function(d) {
        return d.data.type === ROW_TYPE.SUBSET;
      });
    }
    
    function setAttributeOrFirstAttribute(name){
      var fattrs = getAttributes().filter(function(d){return d.name===name;});
      if(fattrs && fattrs.length > 0){
        name = fattrs[0].name;
      }else{
        name = getAttributes()[0].name;
      }
      return name;
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
      }
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
    
    function getAttributeByName(name) {
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

      //var visContainer = $(document.getElementById("set-vis-container"));
      //svg.attr("height", parseInt(visContainer.height() - 300, 10));
      //svg.attr("width", parseInt(visContainer.width() - 200, 10));
      svg.attr("height",Powerset.size.height);
      svg.attr("width",Powerset.size.width);
      var svgWidth = parseInt(svg.attr("width"), 10);
      var svgHeight = parseInt(svg.attr("height"), 10);
      var rectsWidth = svgWidth - 30;

      console.log("svgHeight",svgHeight);
      console.log("svgWidth",svgWidth);


      /* init loop */
      var allSizes = 0;
      groupRows.forEach(function(group, idx) {
        if(typeof(openSets[idx]) == "undefined"){
          openSets[idx] = true;  
        }
        if(openSets[idx]){
          allSizes += group.data.setSize;  
        }
      });
       
      var groupHeights = [];
      var minHeight = Powerset.minimalSetHeight;
      var groups = (groupRows.length);
      var x = (svgHeight - (Powerset.groupSetPadding * groups) - (minHeight * groups)) / allSizes;
      groupRows.forEach(function(set, idx) {
        if(openSets[idx]){
          groupHeights[idx] = parseFloat((set.data.setSize * x).toFixed(3),10) + minHeight;  
        }else{
          groupHeights[idx] = minHeight;
        }        
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
          var prevHeights = groupHeights.filter(function(x,i){return i < idx; });
          var prevHeight = 0;
          if(prevHeights.length > 0){
            prevHeight = prevHeights.reduce(function(r,x){return r+x;});
          }
          prevHeight += (Powerset.groupSetPadding * idx);
          return prevHeight;
        })
        .attr("width", rectsWidth)
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
          return idx;
        })
        .attr("class", "pw-gtext")
        .attr("x", 5)
        .attr("dy",".35em")
        .attr("y", function(d, idx) {
          var prevHeights = groupHeights.filter(function(x,i){return i < idx; });
          var prevHeight = 0;
          if(prevHeights.length > 0){
            prevHeight = prevHeights.reduce(function(r,x){return r+x;});
          }
          prevHeight += (Powerset.groupSetPadding * idx);
          var val = groupHeights[idx];
          return (val / 2) + prevHeight;
        });
      gTexts.exit().remove();

      drawSubsets(svg, groupRects, rectsWidth);
      drawSetsBySize();
      drawElementsByDegree();
      

      createStyle();
      createAttributeSelect();

      cleanupUpsetParts();

    };

    function cleanupUpsetParts(){
      /* clean upset elements */
      var arrElements = [".columnBackgroundsGroup", ".gRows", ".toolTipLayer", ".logicPanel", ".tableHeaderGroup", "#aboutUpset", "#element-viewers-container", ".element-visualization-header"];
      var arrHide = [".ui-column.ui-layout-west"];
      $(arrElements.join(",")).remove();
      $(arrHide.join(",")).hide();
    }

    function getVisualStats(){
      return ctx.summaryStatisticVis.filter(function(x) {
        if (Powerset.colorByAttribute === x.attribute) {
          return x;
        }
      })[0];
    }

    function drawSubsets(svg, setRects, rectsWidth) {

      svg.selectAll("rect.pw-set").remove();
      svg.selectAll("rect.pw-set-sel").remove();
      svg.selectAll("text.pw-set-text").remove();
      //svg.selectAll("foreignobject.pw-set-text").remove();
      //workaround foreignObjects (foreignObject camelCase not working in webkit)
      svg.selectAll(".pw-set-text").remove();
      svg.selectAll(".pw-set-more").remove();
      svg.selectAll(".pw-set-more-text").remove();
      //console.warn(setRects);
      setRects.each(function(d, idx) {
        drawSubset(svg, rectsWidth, this, d, idx, true);
      });
    }

    function drawSubset(svg, rectsWidth, elm, d, idx, activeMoreBlock){
      var g = d3.select(elm);
      var x = parseInt(g.attr("x"), 10);
      var y = parseInt(g.attr("y"), 10);
      var gWidth = rectsWidth;
      var gHeight = parseInt(g.attr("height"), 10);

      var data = d.data || d;

      var groupSetSize = data.setSize || 0;

      // TODO maybe use subsetRows --> more information
      var subsets = data.subSets || [];

      subsets.sort(function(a,b){
        return b.setSize - a.setSize;
      });

      if (ps.showSubsetWithoutData) {
        subsets = subsets.filter(function(d) {
          return d.setSize > 0;
        });
      }


      // TODO: calc width and the sets that will be displayed and add minWdith for them.
      var setWidths = [];
      var minWidth = Powerset.minimalSetWidth;
      var lsets = subsets.length; 
      var setwidth = (gWidth - (Powerset.setPadding * (lsets - 1)) /*- (minWidth * lsets ) */) / groupSetSize;
      console.log("calc set widths: ", gWidth, (Powerset.setPadding * (lsets - 1)), (minWidth * lsets ));
      subsets.forEach(function(set, idx) {
        var w = parseFloat((set.setSize * setwidth).toFixed(3),10);
        setWidths[idx] = w < minWidth ? w + minWidth : w; //+ minWidth;
      });

      var height = (gHeight);
      
      var lastX = null;
      var lastIdx = null;

      function getPreviousWidth(idx){
        var prevWidths = setWidths.filter(function(x,i){return i < idx; });
        var prevWidth = 0;
        if(prevWidths.length > 0){
          prevWidth = prevWidths.reduce(function(r,x){return r+x;});
        }
        prevWidth += (Powerset.setPadding * idx);
        return prevWidth;
      }

      function funcDataMedian(d){
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
      }

      function funcSubSetX(d,i){
        var prevWidth = getPreviousWidth(i);
        var startX = x + prevWidth;
        if(activeMoreBlock){
          var perc = (gWidth * (1 - (Powerset.showMorePercent/100)));
          if(startX >= perc){
            if(lastX === null){
              lastX = startX;
              lastIdx = i;
            }
            return -1000;
          }
        }
        return startX;
      }

      function funcSetClass(baseStr){
        return function(d,k){
          var arrValues = [];
          for (var i = d.items.length - 1; i >= 0; i--) {
            var itm = d.items[i];
            var val = getAttributeValue(Powerset.colorByAttribute, itm);
            arrValues.push(val);
          }
          return baseStr+" "+baseStr+"-" + idx;
        };
      }

      function getFilteredSelectedItems(items){
        return getSelectedItems().filter(function(d){
          return items.indexOf(d) !== -1;
        });
      }

      function getSetSelectedPercent(items){
        var matched = getFilteredSelectedItems(items);
        return matched.length / items.length;
      }

      // TODO: insert <g>
      console.info("row:",idx,subsets.length,subsets);

      svg.selectAll("rect.pw-set-" + idx).remove();
      var subSetRects = svg.selectAll("rect.pw-set-" + idx).data(subsets);
      subSetRects.enter().append("rect")
        .attr("class", funcSetClass("pw-set"))
        .attr("data-median", funcDataMedian)
        .style({
          fill: function(){
            var stats = getVisualStats();
            if(!stats){
              return '#dedede';
            }
          }
        })
        .attr("x", funcSubSetX)
        .attr("y", function() {
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

      /* show more rect */
      svg.select("rect.pw-set-more-" + idx).remove();
      var hiddenSets = subsets.filter(function(x,i){return i >= lastIdx; });
      var prevWidth = getPreviousWidth(lastIdx);
      var nonShownWidths = setWidths.filter(function(x,i){return i >= lastIdx; });
      drawShowMoreRect(idx, lastX, y, height, (gWidth-prevWidth), nonShownWidths.length, hiddenSets);

      if(ps.showSubsetSelection){
        svg.selectAll("rect.pw-set-sel-" + idx).remove();
        var subSetSelectionRect = svg.selectAll("rect.pw-set-sel-" + idx).data(subsets);
        subSetSelectionRect.enter().append("rect")
            .attr("class", funcSetClass("pw-set-sel"))
            .attr("data-median", funcDataMedian)
            .style({
              fill: "red"
            })
            .attr("x", funcSubSetX)
            .attr("y", function() {
              var row = 0;
              return y + (row * height);
            })
            .on("click", function(d) {
              var strNames = d.items.map(getAttributeInfo);
              console.info(d.elementName, d.setSize, strNames.join(","), d);
            })
            .attr("width",function(d,idx){
              var per = getSetSelectedPercent(d.items);
              return setWidths[idx] * per;
            })
            .attr("height", height);
        subSetSelectionRect.exit().remove();
      }

      if (ps.showSubsetTexts) {
        //workaround foreignObjects
        svg.selectAll(".pw-set-text-" + idx).remove();
        var subSetTexts = svg.selectAll("foreignObject.pw-set-text-" + idx).data(subsets).enter();
        subSetTexts.append("foreignObject")
          .attr("class", "pw-set-text pw-set-text-" + idx)
          .attr("x", funcSubSetX)
          .attr("y", function() {
            var row = 0;  
            return y + (row * height);
          })
          .attr("height",height)
          .attr("width", function(d,idx){
            return setWidths[idx];
          })
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "middle")
          .append("xhtml:body")
          .attr("class","pw-set-text-body")
          .style({
            "width": function(d,idx){ return setWidths[idx] + "px"; }
          })
          .append("p")
          .on("click", function(d) {
            var strNames = d.items.map(getAttributeInfo);
            console.info(d.elementName, d.setSize, strNames.join(","), d);
          })
          .attr("class","pw-set-text-center")
          .html(function(d) {
            return d.elementName || "&nbsp;";
          })
          .attr("title", function(d) {
            return d.elementName + " - " + d.setSize + " elements";
          });
      }

    }

    function drawShowMoreRect(idx, lastX, y, height, width, hiddenSetsCount, hiddenSets){
      svg.select("rect.pw-set-more-" + idx).remove();
      if(lastX === null){
        return;
      }
      svg.append("rect")
        .attr("class", "pw-set-more pw-set-more-" + idx)
        .attr("x", lastX)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height);
     
     svg.selectAll(".pw-set-more-text-" + idx).remove();
     svg.append("foreignObject")
        .attr("class","pw-set-more-text pw-set-more-text-" + idx)
        .attr("x", lastX)
        .attr("y", y)
        .attr("width", width)
        .attr("height", height)
        .append("xhtml:body")
        .attr("class","pw-set-text-body")
        .style({
          "width": width + "px"
        })
        .append("p")
        .attr("class","pw-set-text-center")
        .text( hiddenSetsCount + " more")
        .attr("title", hiddenSetsCount + " more")
        .on("click", function(){
          drawShowMoreModal(hiddenSets)
        });
    }

    function drawShowMoreModal(hiddenSets){
      var modal = $("#pw-show-more-modal");
      if(modal.length > 0){
        modal.remove();
      }
      var bodyVis = $("#bodyVis")
      bodyVis.append("<div id='pw-show-more-modal'>");
      bodyVis.css("position","relative");

      var modalSvg = d3.select("#pw-show-more-modal").append("svg").attr("height",200).attr("width",500);
      var g = modalSvg.append("rect").attr("x",0).attr("y",0).attr("height",200).attr("width",500).style({"fill":"transparent"});
      var obj = { subSets : hiddenSets , setSize : 0};
      hiddenSets.forEach(function(d){
        obj.setSize += d.setSize;
      });

      drawSubset(modalSvg, 400, g[0][0], obj, 9999, false);

      $("#pw-show-more-modal").dialog({
        width: "500px",
        position: { my: "right", at: "right", of: window }
      });
      
    }
    
    function getSelectedSets(){
      return sets.filter(function(d){ return d.isSelected;});
    }
    
    function getSelectedItems(){
      var arrselsets = selectedSets.filter(function(d){
        return d.active;
      });
      var arr = [];
      arrselsets.forEach(function(d){
        arr = arr.concat(d.baseSet.items);
      });
      return arr.unique();
    }
    
    function getBaseSetsBySet(s){
      var selSets = usedSets;
      var arr = [];
      for (var i = 0; i < s.combinedSets.length; i++) {
        var v = s.combinedSets[i];
        if(v === 1){
          arr.push(selSets[i]);
        }
      }
      return arr;
    }

    function getCountsForProgressbar(groupRows) {
      var overallSize = 0;
      var totalSize = groupRows.map(function (d) {
        return d.setSize;
      }).reduce(function (preVal, val) {
        return preVal + val;
      });
      var arr = groupRows.map(function (d) {
        return d.setSize;
      });
      var maxSize = Math.max.apply(null, arr);

      if (Powerset.controlPanelPercentByTotal) {
        overallSize = totalSize;
      } else {
        overallSize = maxSize;
      }
      return {totalSize: totalSize, overallSize: overallSize};
    }

    function drawSetsBySize(){
      var subsetRows = usedSets.sort(function(a,b){
        return b.setSize - a.setSize;
      });

      var counts = getCountsForProgressbar(subsetRows);
      
      controlPanel.find("#ps-control-panel-sets").remove();
      var setsPanel = controlPanel.append("<div id='ps-control-panel-sets'></div>").find("#ps-control-panel-sets");
      setsPanel.append("<h3>Sets by size");

      setsPanel.append("<div class='elm-by-sets-scale'><span>0</span><span>" + counts.overallSize + "</span></div>");
      
      setsPanel.append("<div id='elm-by-sets-rows'></div>");
      var rows = d3.select("#elm-by-sets-rows").selectAll("div.row").data(subsetRows);
      rows.enter()
        .append("div")
        .classed({
          "row": true
        })
        .html(function(d, idx) {
          //init selectedSets
          if(typeof(selectedSets[idx]) == "undefined"){
            selectedSets[idx] = {active:false, baseSet: d};
          }
          
          var checked = selectedSets[idx].active ? "checked='checked'" : "";
          //var arrbaseSet = getBaseSetsBySet(d) || {};
          //var baseSet = arrbaseSet.length > 0 ? arrbaseSet[0] : {};
          //var baseSetId = baseSet.id || "";
          
          var str = "<input type='checkbox' " + checked + " value='" + idx + "' class='chk-set-size' id='chk-set-size-" + idx + "' data-basesetid='" + d.id + "'>";
          str += "<span>" + d.elementName + "</span>";
          var titleText = d.elementName + " - " + (d.setSize / counts.totalSize * 100).toFixed(3);
          str += "<progress title='" + titleText + "' value='" + (d.setSize / counts.overallSize * 100) + "' max='100'></progress>";
          return str;
        });
      rows.exit().remove();
      
      $("input.chk-set-size").on("change",function(){
        
        var idx = $(this).val();
        var baseSetId = $(this).data("basesetid");
        var baseSet = setIdToSet[baseSetId];
        console.log("selected base set:", baseSet);
        console.log("change: ",selectedSets[idx].active," => ", !selectedSets[idx].active);
        selectedSets[idx].active = !selectedSets[idx].active;
        selectedSets[idx].baseSet = baseSet;
        console.log(getSelectedItems());
        that.draw();

        if(selections.list.length > 0){
          selections.removeSelection( selections.list[0]);
        }
        var selection = new Selection(getSelectedItems(), new FilterCollection("#filters-controls", "#filters-list"));
        selections.addSelection(selection, true);
        selections.setActive(selection);
        
      });
      
    }

    function drawElementsByDegree() {
      var groupRows = getGroupRows();
      groupRows = groupRows.map(function(d){
        return d.data;
      });
      var counts = getCountsForProgressbar(groupRows);
      controlPanel.find("#ps-control-panel-degree").remove();
      var degPanel = controlPanel.append("<div id='ps-control-panel-degree'></div>").find("#ps-control-panel-degree");
      degPanel.append("<h3>Elements by Degree");
      degPanel.append("<div class='elm-by-deg-scale'><span>0</span><span>" + counts.overallSize + "</span></div>");
      degPanel.append("<div id='elm-by-deg-rows'></div>");

      var rows = d3.select("#elm-by-deg-rows").selectAll("div.row").data(groupRows);
      rows.enter()
          .append("div")
          .classed({
            "row": true
          })
          .html(function (d, idx) {
            var checked = openSets[idx] ? "checked='checked'" : "";

            var str = "<input type='checkbox' " + checked + " value='" + idx + "' class='chk-set-degree'>";
            str += "<span>" + idx + "</span>";
            var titleText = d.elementName + " - " + (d.setSize / counts.totalSize * 100).toFixed(3);
            str += "<progress title='" + titleText + "' value='" + (d.setSize / counts.overallSize * 100) + "' max='100'></progress>";
            return str;
          });
      rows.exit().remove();

      $("input.chk-set-degree").on("change", function () {
        var idx = $(this).val();
        console.log("change: ", openSets[idx], " => ", !openSets[idx]);
        openSets[idx] = !openSets[idx];
        that.draw();
      });

    }

    function createStyleItems(attr) {
      var min = window.Powerset.colorByAttributeValues.min;
      var max = window.Powerset.colorByAttributeValues.max;
      var colorScale = d3.scale.linear().domain([attr.min,attr.max]).range([min.color,max.color]);
      var arr = [];
      
      var subsetRects = svg.selectAll("rect.pw-set");
      subsetRects.each(function() {
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
      var attr = getAttributes().filter(function(d){ return d.name===window.Powerset.colorByAttribute;})[0];
      if(!attr){
        attr = getAttributes()[0];
      }
      
      var pwStyle = $("#pw-style");
      if(pwStyle.length > 0){
        pwStyle.remove();
      }  
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
        }
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
    height : 500,
    width : 700
  };
  /* show percent in control panel by total size or by max size(largest member) */
  ps.controlPanelPercentByTotal = false;
  
  ps.groupSetPadding = 5;
  ps.setPadding = 5;
  
  ps.minimalSetHeight = 5;
  ps.minimalSetWidth = 30;
  /* X Percent is reserved for the "+Show more Block" */
  ps.showMorePercent = 10; 
  ps.showSubsetTexts = true;
  ps.showSubsetSelection = true;
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
