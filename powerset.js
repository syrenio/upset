/*
  use renderRows -> Original Data !
*/

(function(window) {
  window.Powerset = window.Powerset || {};
  var ps = window.Powerset;
  console.log("powerset registered!");
  window.document.title += " - Powerset!";


  ps.updateGroupRows = function(groupRows) {
    //console.log("groupRows:", groupRows);
    svg = d3.select("#bodyVis").select("svg");
    groupRows.each(function(group, idx) {
      //console.info("groupRow:", group, idx);

      //debugger
      //g.selectAll("svg").data(function(){return group.elementName;}).enter().append("text");
      //g.selectAll(".degree").data(group).enter().append("g").attr("class","syr-degree");
    });

    var groupNames = groupRows.data().map(function(o) {
      var text = o.data.elementName;
      //console.dir(o.data);
      //console.info("setSize:", o.data.setSize);
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

    var elem = svg.selectAll("text").data(groupNames).enter();
    elem.append("text")
      .attr("fill", "red")
      .attr("y", function(d, idx) {
        return 20 + (20 * idx);
      })
      .text(function(d, idx) {
        return d;
      });


    var setRects = svg.selectAll("rect.pw-gset").data(groupNames).enter();
    setRects.append("rect")
      .attr("class","pw-gset")
      .attr("y",function(d,idx){
        return 100 + (20 * idx);
      })
      .attr("width",100)
      .attr("height",10);
  };

  ps.updateSubsetRows = function(subsetRows, setScale) {
    // console.info("Powerset.updateSubsetRows", subsetRows, setScale);
    svg = d3.select("#bodyVis").select("svg");

    var bodyVisWidth = svg[0][0].width.baseVal.value;
    var bodyVisHeight = svg[0][0].height.baseVal.value;

    var subSetRects = svg.selectAll("rect.pw-set").data(subsetRows[0]).enter();
    subSetRects.append("rect")
      .attr("class","pw-set")
      .attr("x",200)
      .attr("y",function(d,idx){
        return 100 + (20 * idx);
      })
      .on("mouseenter",function(d){
        console.info(d);
      })
      .attr("width",100)
      .attr("height",10);

      
    subSetRects.insert("title")
      .text(function(d){ return d.__data__.data.elementName; });

    subsetRows.each(function(elm, idx) {
      // console.info("row:", elm, idx);
      var data = elm.data;
      // console.info("degree:", data.nrCombinedSets, data.elementName, " size:", data.setSize);
    });
  };

})(window);
