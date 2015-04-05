/*
  use renderRows and sets-> Original Data !
*/

(function(window) {
  //window.Powerset = window.Powerset || {};
  //var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";

  var ps = window.Powerset = function PowerSet(rr, sets,scale) {
    var svg = d3.select("#bodyVis").select("svg");
    var renderRows = rr;
    var sets = sets;
    var setScale = scale;
    console.log("init powerset with " + renderRows.length + " renderRows");
    console.log("init powerset with " + sets.length + " sets");

    var groupRows = getGroupRows();
    var subsetRows = getSubsetRows();

    function getGroupRows() {
      return renderRows.filter(function(d, i) {
        if (d.data.type === ROW_TYPE.GROUP || d.data.type === ROW_TYPE.AGGREGATE)
          return true;
        return false;
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

    this.draw = function() {
      groupRows.forEach(function(group, idx) {
        console.info("groupRow:", group, idx);
      });

      var svgWidth = parseInt(svg.attr("width"), 10);

      var degreeHeight = 600 / groupRows.length;
      var degreeWidth = svgWidth - 200;

      var setRects = svg.selectAll("rect.pw-gset")
      setRects.data(groupRows)
        .enter()
        .append("rect")
        .attr("class", "pw-gset")
        .attr("x", 200)
        .attr("y", function(d, idx) {
          return (10 + degreeHeight) * idx;
        })
        .attr("width", degreeWidth)
        .attr("height", degreeHeight);


      updateSubsetRows(setRects,setScale);
    };

    function updateSubsetRows(setRects,setScale) {

      console.warn(setRects);
      setRects.each(function(d,idx){
        var g = d3.select(this);
        var x = parseInt(g.attr("x"),10);
        var y = parseInt(g.attr("y"),10);

        var height = 20;
        var width = 20;

        // TODO maybe use subsetRows --> more information
        var subsets = d.data.subSets;

        subsets.forEach(function(d){ console.log(d)});

        var subSetRects = svg.selectAll("rect.pw-set-"+idx).data(subsets).enter();
        subSetRects.append("rect")
          .attr("class", "pw-set pw-set-"+idx)
          .attr("x", function(d,idx){
            return x + ((width*2) * idx);
          })
          .attr("y", function(d, idx) {
            return y + height;
          })
          .on("mouseenter", function(d) {
            console.info(d.elementName);
          })
          .attr("width", width)
          .attr("height", height);

      });


      
    };

  };

})(window);
