class TreeMap {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 550,
      containerHeight: _config.containerHeight || 540,
      margin: _config.margin || {
        top: 60,
        right: 60,
        bottom: 0,
        left: 40,
      },
    };
    this.data = _data;
    this.originData = _data;
    this.currentlyHighlighted = null;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Create SVG area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.createScales();

    vis.render();
  }

  updateData(newData) {
    this.data = newData;
    this.createScales();
    this.render();
  }

  processData() {
    let vis = this;

    let counts = {
      none: 0,
      all: 0,
      stressDepression: 0,
      stressAnxiety: 0,
      depressionAnxiety: 0,
      onlyStress: 0,
      onlyDepression: 0,
      onlyAnxiety: 0,
    };

    // original data
    let categoryDataMap = {
      none: [],
      all: [],
      stressDepression: [],
      stressAnxiety: [],
      depressionAnxiety: [],
      onlyStress: [],
      onlyDepression: [],
      onlyAnxiety: [],
    };

    vis.data.forEach((d) => {
      let conditions = [
        d.Stress_Level >= 3,
        d.Depression_Score >= 3,
        d.Anxiety_Score >= 3,
      ];
      let category;

      switch (conditions.filter(Boolean).length) {
        case 0:
          category = "none";
          break;
        case 3:
          category = "all";
          break;
        case 2:
          if (conditions[0] && conditions[1]) category = "stressDepression";
          else if (conditions[0] && conditions[2]) category = "stressAnxiety";
          else if (conditions[1] && conditions[2])
            category = "depressionAnxiety";
          break;
        case 1:
          if (conditions[0]) category = "onlyStress";
          else if (conditions[1]) category = "onlyDepression";
          else if (conditions[2]) category = "onlyAnxiety";
          break;
      }

      counts[category] += 1;
      categoryDataMap[category].push(d);
    });

    let total = vis.data.length;

    vis.percentages = Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [
        key,
        { count: value, percentage: (value / total) * 100 },
      ])
    );

    vis.rootData = { name: "root", children: [] };
    Object.keys(vis.percentages).forEach((key) => {
      vis.rootData.children.push({
        name: key,
        value: vis.percentages[key].count,
        percentage: vis.percentages[key].percentage,
        data: categoryDataMap[key],
      });
    });

    const categoryOrder = {
      all: 1,
      none: 2,
      oneOfThree: 3, // onlyStress, onlyDepression, onlyAnxiety
      twoOfThree: 4, // stressDepression, stressAnxiety, depressionAnxiety
    };

    function getCategory(name) {
      if (name === "all") return "all";
      if (name === "none") return "none";
      if (name.includes("only")) return "oneOfThree";
      return "twoOfThree";
    }

    vis.root = d3
      .hierarchy(vis.rootData)
      .sum((d) => d.value)
      .sort((a, b) => {
        const categoryA = categoryOrder[getCategory(a.data.name)];
        const categoryB = categoryOrder[getCategory(b.data.name)];
        if (categoryA !== categoryB) {
          return categoryA - categoryB;
        }
        return b.value - a.value;
      });

    vis.treemap(vis.root);
  }

  createScales() {
    let vis = this;

    vis.colorScale = d3
      .scaleOrdinal()
      .domain([
        "none",
        "all",
        "stressDepression",
        "stressAnxiety",
        "depressionAnxiety",
        "onlyStress",
        "onlyDepression",
        "onlyAnxiety",
      ])
      .range([
        "#d3d3d3", // none - gray
        "#90ee90", // all - green
        "#ffa500", // stressDepression, stressAnxiety, depressionAnxiety - orange
        "#ffa500",
        "#ffa500",
        "#add8e6", // onlyStress, onlyDepression, onlyAnxiety - blue
        "#add8e6",
        "#add8e6",
      ]);

    vis.treemap = d3
      .treemap()
      .size([
        ((vis.config.containerWidth -
          vis.config.margin.left -
          vis.config.margin.right) *
          2) /
          3,
        ((vis.config.containerHeight -
          vis.config.margin.top -
          vis.config.margin.bottom) *
          2) /
          3,
      ])
      .padding(1);
  }

  highlightArea(dataItem) {
    let vis = this;

    vis.svg
      .selectAll(".node rect")
      .style("stroke-width", 2)
      .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.5));

    vis.svg
      .selectAll(".node rect")
      .filter((d) =>
        d.data.data.some((item) => this.isSameDataItem(item, dataItem))
      )
      .style("fill", "#FFFF00")
      .style("stroke", "rgb(65, 65, 65)")
      .style("stroke-width", 4);

    if (this.currentlyHighlighted) {
      d3.select(this.currentlyHighlighted)
      .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.9))
      .style("stroke-width", 4);
    }
  }

  unhighlightArea() {
    let vis = this;

    vis.svg.selectAll(".node rect").each(function (d) {
      if (this !== vis.currentlyHighlighted) {
        d3.select(this)
          .style("fill", (d) => {
            const color = d3.rgb(vis.colorScale(d.data.name));
            return `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`; // alpha = 0.6
          })
          .style("stroke", (d) =>
            d3.rgb(vis.colorScale(d.data.name)).darker(0.5)
          )
          .attr("stroke-width", 2);
      }
    });
  }

  //compare
  isSameDataItem(item1, item2) {
    const keysToCompare = [
      "Age",
      "CGPA",
      "Stress_Level",
      "Depression_Score",
      "Anxiety_Score",
      "Counseling_Service_Use",
      "Course",
      "Diet_Quality",
      "Extracurricular_Involvement",
      "Financial_Stress",
      "Physical_Activity",
      "Sleep_Quality",
      "Social_Support",
    ];

    return keysToCompare.every((key) => item1[key] === item2[key]);
  }

  render() {
    let vis = this;
    this.processData();

    const nameAbbreviations = {
      onlyStress: "S",
      onlyDepression: "D",
      onlyAnxiety: "A",
      stressDepression: "S&D",
      stressAnxiety: "S&A",
      depressionAnxiety: "D&A",
      all: "All",
      none: "None",
    };

    const nodes = vis.svg
      .selectAll(".node")
      .data(vis.root.leaves(), (d) => d.data.name);

    // exit
    nodes.exit().remove();

    // update
    const nodesUpdate = nodes.attr(
      "transform",
      (d) => `translate(${d.x0},${d.y0 + 30})`
    );

    nodesUpdate
      .select("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .style("fill", (d) => {
        const color = d3.rgb(vis.colorScale(d.data.name));
        return `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`; // alpha = 0.6
      })
      .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.5));

    nodesUpdate
      .select("text.name")
      .attr("x", (d) => (d.x1 - d.x0) / 2 - 13)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .text((d) => nameAbbreviations[d.data.name] || d.data.name);

    nodesUpdate
      .select("text.percentage")
      .attr("x", (d) => (d.x1 - d.x0) / 2 - 15)
      .attr("y", (d) => (d.y1 - d.y0) / 2 + 20)
      .text((d) => `${d.data.percentage.toFixed(2)}%`);

    // enter
    const nodesEnter = nodes.enter().append("g").attr("class", "node");

    nodesEnter
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("rx", 10) // round corners
      .attr("ry", 10)
      .style("fill", (d) => {
        const color = d3.rgb(vis.colorScale(d.data.name));
        return `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
      })
      .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.5))
      .style("stroke-width", 2)
      .on("click", (event, d) => {
        this.deselect();

        if(this.currentlyHighlighted === event.currentTarget){
          d3.select(event.currentTarget)
          .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.5))
          .style("stroke-width", 2);

        this.currentlyHighlighted = null;
        dispatcher.call("treemapClick", this, this.data);
        }else{
          d3.select(event.currentTarget)
          .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.9))
          .style("stroke-width", 4);

        this.currentlyHighlighted = event.currentTarget;
        dispatcher.call("treemapClick", this, d.data.data);
        }
        
      });

    const textGroups = nodesEnter.append("g");

    textGroups
      .append("text")
      .attr("class", "name")
      .attr("x", (d) => (d.x1 - d.x0) / 2 - 13)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .text((d) => nameAbbreviations[d.data.name] || d.data.name)
      .style("font-weight", "530")
      .style("font-size", "1em");

    textGroups
      .append("text")
      .attr("class", "percentage")
      .attr("x", (d) => (d.x1 - d.x0) / 2 - 15)
      .attr("y", (d) => (d.y1 - d.y0) / 2 + 5)
      .text((d) => `${d.data.percentage.toFixed(2)}%`)
      .style("font-size", "0.6em");

    this.renderLegend();
  }

  deselect() {
    let vis = this;
    if (vis.currentlyHighlighted) {
      d3.select(vis.currentlyHighlighted)
        .style("stroke", (d) => d3.rgb(vis.colorScale(d.data.name)).darker(0.5))
        .style("stroke-width", 2);
    }
  }

  renderLegend() {
    let vis = this;

    const legendRectSize = 20; //rect width
    const legendSpacing = 10; // spacing between
    const legendRectHeight = 10; //rect height

    const legendData = [
      { color: "#d3d3d3", text: "No mental indices >= 3" },
      { color: "#add8e6", text: "One mental indices >= 3" },
      { color: "#ffa500", text: "Two mental indices >= 3" },
      { color: "#90ee90", text: "Three mental indices >= 3" },
    ];

    const legendDescriptions = [
      { abbreviation: "A", meaning: "Anxiety" },
      { abbreviation: "D", meaning: "Depression" },
      { abbreviation: "S", meaning: "Stress" },
    ];

    const legendDescriptionStart =
      legendData.length * (legendRectHeight + legendSpacing) + legendSpacing;

    const legendDescriptionText = vis.svg
      .selectAll(".legend-description")
      .data(legendDescriptions)
      .enter()
      .append("text")
      .attr("x", vis.config.containerWidth - legendRectSize - 210)
      .attr("y", (d, i) => legendDescriptionStart + i * 20 - 20)
      .text((d) => `${d.abbreviation} - ${d.meaning}`)
      .style("font-size", "0.85em");

    const legend = vis.svg
      .selectAll(".legend")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend") // classname legend
      .attr("transform", function (d, i) {
        const height = legendRectHeight + legendSpacing;
        const horz = vis.config.containerWidth - legendRectSize - 210;
        const vert = i * height + legendSpacing + 280;
        return `translate(${horz},${vert})`;
      });

    legend
      .append("rect")
      .attr("width", legendRectSize)
      .attr("height", legendRectHeight)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", (d) => d.color)
      .style("stroke", "#000000");

    legend
      .append("text")
      .attr("x", legendRectSize + legendSpacing)
      .attr("y", legendRectHeight)
      .text((d) => d.text)
      .style("font-size", "0.85em");

    vis.renderTitle();
  }

  darken(color, amount) {
    const d3Color = d3.rgb(color);
    return d3Color.darker(amount);
  }

  renderTitle() {
    let vis = this;

    vis.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", 0)
      .attr("y", -55)
      .attr("dy", ".71em")
      .style("text-anchor", "left")
      .style("font-size", "1em")
      .style("font-weight", "bold")
      .text("Measurement of Student Mental Health");

    vis.svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", 0)
      .attr("y", -35)
      .attr("dy", ".71em")
      .style("text-anchor", "left")
      .style("font-size", "1em")
      .style("font-weight", "bold")
      .text("Combining Three Indicators");

    vis.svg
      .append("text")
      .attr("class", "chart-description")
      .attr("x", 0)
      .attr("y", -10)
      .attr("dy", ".71em")
      .style("text-anchor", "left")
      .style("font-size", "0.8em")
      .text(
        "This graph examines three mental health indicators: Stress, Depression, and Anxiety."
      )
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em")
      .text(
        "Each indicator is scored from 0-5. Scores above 3 indicate potential issues."
      );
  }
}
