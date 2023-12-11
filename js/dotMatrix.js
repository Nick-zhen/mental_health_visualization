class DotMatrix {
	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 * @param {Array}
	 */
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 1000,
			containerHeight: 525,
			margin: _config.margin || {
				top: 45,
				right: 20,
				bottom: 15,
				left: 50,
			},
			tooltipPadding: _config.tooltipPadding || 15,
		};

		this.highlightedData = [];
		this.clickedDot = [];
		this.data = _data;

		this.initVis();
	}

	initVis() {
		let vis = this;
		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.width =
			vis.config.containerWidth -
			vis.config.margin.left -
			vis.config.margin.right;
		vis.height =
			vis.config.containerHeight -
			vis.config.margin.top -
			vis.config.margin.bottom;

		vis.svg = d3
			.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// append the title of the view
		vis.svg
			.append('text')
			.attr('class', 'title')
			.attr('x', vis.width + 10)
			.attr('y', vis.config.margin.top - 40)
			.attr('dy', '.71em')
			.attr('text-anchor', 'end')
			.style('font-size', '1.5em')
			.text('Financial Stress Levels');

		vis.chart = vis.svg
			.append('g')
			.attr(
				'transform',
				`translate(${vis.config.margin.left},${vis.config.margin.top})`
			);

		vis.legend = vis.chart
			.append('g')
			.attr(
				'transform',
				`translate(${vis.config.margin.left + 270},${
					vis.height - 90
				})`
			);

		// Append group used to clear selection on click
		vis.clearSelectionG = vis.chart
			.append('g')
			.append('rect')
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight)
			.attr(
				'transform',
				`translate(${-vis.config.margin.left},${-vis.config
					.margin.top})`
			)
			.attr('opacity', 0)
			.on('click', function (event, d) {
				clearAllInteractions();
			});

		// name the race categories
		vis.financialStressLevels = [
			'Financial Stress Level: 0',
			'Financial Stress Level: 1',
			'Financial Stress Level: 2',
			'Financial Stress Level: 3',
			'Financial Stress Level: 4',
			'Financial Stress Level: 5',
		];

		vis.colorScale = d3
			.scaleOrdinal()
			.range([
				'#1a9850',
				'#a6d96a',
				'#ffffbf',
				'#fdae61',
				'#f46d43',
				'#d73027',
			])
			.domain(vis.financialStressLevels);

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.groupedByfinancialStress = d3.group(
			vis.data,
			(d) => d.Financial_Stress
		);

		vis.colorValue = (d) => d.Financial_Stress;

		vis.countStressLevel();
		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		vis.x = -5;
		vis.y = -5;
		vis.xcount = -1;
		vis.ycount = -1;

		vis.dotRadius = 4;

		let financialStressGroups = vis.chart
			.selectAll('.financialStress-group')
			.data(vis.groupedByfinancialStress)
			.join('g')
			.attr('class', 'financialStress-group');

		let dots = financialStressGroups
			.selectAll('.matrix-dot')
			.data((d) => d[1])
			.join('circle')
			.attr('class', 'matrix-dot')
			.attr('r', vis.dotRadius)
			.attr('cy', function () {
				vis.ycount += 1;
				return vis.ycount % 112 == 0
					? (vis.y += vis.dotRadius * 2)
					: vis.y;
			})
			.attr('cx', function () {
				vis.xcount += 1;
				return vis.xcount % 112 == 0
					? (vis.x = 0)
					: (vis.x += vis.dotRadius * 2);
			})
			.classed(
				'clicked',
				(d) =>
					vis.clickedDot.length !== 0 &&
					vis.clickedDot.includes(d)
			)
			.classed(
				'inactive',
				(d) =>
					vis.highlightedData.length !== 0 &&
					!vis.highlightedData.includes(d)
			)
			.attr('fill', (d) => vis.colorScale(vis.colorValue(d)))
			.on('mouseover', function (event, d) {
				vis.toolTipInfo(event, d);
			})
			.on('mouseleave', () => {
				d3.select('#tooltip').style('display', 'none');
			})
			.on('click', (event, d) => {
				clearAllInteractions();
				vis.clickedDot.push(d);
				vis.renderVis();
				DataProcessor.highlightBarChartData(d);
				DataProcessor.highlightMiniBarChartData(d);
				DataProcessor.highlightHeatMapCircleData(d);
				DataProcessor.highlightHeatMapData(d);

				dispatcher.call('highlightTreeMap', this, d);
			});

		vis.yLegendCount = -1;
		vis.xLegendCount = -1;
		vis.yLegend = 0;
		vis.xLegend = 0;

		vis.legend
			.selectAll('.dot-matrix-legend-circles')
			.data(vis.financialStressLevels)
			.join('circle')
			.attr('class', 'dot-matrix-legend-circles')
			.attr('r', 6)
			.attr('cy', function () {
				vis.yLegendCount += 1;
				return vis.yLegendCount % 3 == 0
					? (vis.yLegend += vis.dotRadius * 5)
					: vis.yLegend;
			})
			.attr('cx', function () {
				vis.xLegendCount += 1;
				return vis.xLegendCount % 3 == 0
					? (vis.xLegend = 0)
					: (vis.xLegend += 200);
			})
			.style('fill', (d) => vis.colorScale(d));

		vis.yLegendCount = -1;
		vis.xLegendCount = -1;
		vis.yLegend = 4;
		vis.xLegend = 10;
		vis.cnt = -1;

		vis.legend
			.selectAll('.legendText')
			.data(vis.financialStressLevels)
			.join('text')
			.attr('class', 'legendText legend-text')
			.attr('x', function () {
				vis.xLegendCount += 1;
				return vis.xLegendCount % 3 == 0
					? (vis.xLegend = 10)
					: (vis.xLegend += 200);
			})
			.attr('y', function () {
				vis.yLegendCount += 1;
				return vis.yLegendCount % 3 == 0
					? (vis.yLegend += vis.dotRadius * 5)
					: vis.yLegend;
			})
			.style('font-size', vis.dotRadius * 3 + 'px')
			.text((d) => {
				vis.cnt += 1
				return `${d} - ${vis.counts[vis.cnt]}%`;
			});
	}

	countStressLevel() {
		let vis = this;

		vis.counts = [0, 0, 0, 0, 0, 0];
		let arr =
			vis.highlightedData.length === 0
				? vis.data
				: vis.highlightedData;
		arr.forEach((d) => {
			vis.counts[d.Financial_Stress]++;
		});
		for (let i = 0; i <= 5; i++) {
			vis.counts[i] = parseFloat(
				((vis.counts[i] / arr.length) * 100).toFixed(2)
			);
		}
	}

	/**
	 *  displays the tooltip information when you hover over the dots.
	 */
	toolTipInfo(event, d) {
		let vis = this;

		let StudentAge = d.Age;
		let StudentMajor = d.Course;
		let StudentCGPA = d.CGPA;
		let StudentStressLevel = d.Stress_Level;
		let StudentDepressionScore = d.Depression_Score;
		let StudentAnxietyScore = d.Anxiety_Score;
		let StudentSleepQuality = d.Sleep_Quality;
		let StudentPhysicalQuality = d.Physical_Activity;
		let StudentDietQuality = d.Diet_Quality;
		let StudentSocialSupport = d.Social_Support;
		let StudentExtracurricularInvolvement =
			d.Extracurricular_Involvement;
		let StudentCounselingServiceUse = d.Counseling_Service_Use;

		d3
			.select('#tooltip')
			.style('display', 'block')
			.style(
				'left',
				event.pageX + vis.config.tooltipPadding + 'px'
			)
			.style(
				'top',
				event.pageY + vis.config.tooltipPadding + 'px'
			).html(`
          <div><b>Age</b>: ${StudentAge}</div>
           <div><b>Major</b>: ${StudentMajor}</div>
          <div><b>CGPA(Cumulative Grade Point Average)</b>: ${StudentCGPA}</div>
          <div><b>Stress Level</b>: ${StudentStressLevel}</div>
          <div><b>Depression Score</b>: ${StudentDepressionScore}</div>
          <div><b>Anxiety Score</b>: ${StudentAnxietyScore}</div>
          <div><b>Sleep Quality</b>: ${StudentSleepQuality}</div>
          <div><b>Physical Quality</b>: ${StudentPhysicalQuality}</div>
          <div><b>Diet Quality:</b> ${StudentDietQuality}</div> 
          <div><b>Social Support:</b> ${StudentSocialSupport}</div> 
          <div><b>Extracurricular Involvement:</b> ${StudentExtracurricularInvolvement}</div> 
          <div><b>Counseling Serive Usage:</b> ${StudentCounselingServiceUse}</div> 
        `);
	}
}
