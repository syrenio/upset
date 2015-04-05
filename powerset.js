/*
  use renderRows and sets-> Original Data !
*/

(function(window) {
  //window.Powerset = window.Powerset || {};
  //var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";

  var ps = window.Powerset = function PowerSet(rr, sets) {
    var svg = d3.select("#bodyVis").select("svg");
    var renderRows = rr;
    var sets = sets;
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

    this.updateGroupRows = function() {
      groupRows.forEach(function(group, idx) {
        console.info("groupRow:", group, idx);
      });

      var groupNames = getGroupNames();
      var setRects = svg.selectAll("rect.pw-gset").data(groupNames).enter();
      setRects.append("rect")
        .attr("class", "pw-gset")
        .attr("y", function(d, idx) {
          return 50 + (20 * idx);
        })
        .attr("width", 100)
        .attr("height", 10);
    };

    this.updateSubsetRows = function(setScale) {
      var bodyVisWidth = svg[0][0].width.baseVal.value;
      var bodyVisHeight = svg[0][0].height.baseVal.value;

      var subSetRects = svg.selectAll("rect.pw-set").data(subsetRows).enter();
      subSetRects.append("rect")
        .attr("class", "pw-set")
        .attr("x", 200)
        .attr("y", function(d, idx) {
          return 50 + (20 * idx);
        })
        .on("mouseenter", function(d) {
          console.info(d);
        })
        .attr("width", 100)
        .attr("height", 10);


      subSetRects.insert("title")
        .text(function(d) {
          return d.data.elementName;
        });

      subsetRows.forEach(function(elm, idx) {
        // console.info("row:", elm, idx);
        var data = elm.data;
        // console.info("degree:", data.nrCombinedSets, data.elementName, " size:", data.setSize);
      });
    };

  };

})(window);
