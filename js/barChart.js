class BarChart {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: _config.containerWidth || 500,
			containerHeight: _config.containerHeight || 450,
			margin: {
				top: 100,
				right: 175,
				bottom: 50,
				left: 45,
			},
		};
		this.data = _data;
		this.highlightedData = [];
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

		// Initialize scales
		vis.colorScale = d3
			.scaleOrdinal()
			.range(['#fdbe85', '#e6550d', '#a63603'])
			.domain(['Never', 'Occasionally', 'Frequently']);

		vis.yScale = d3.scaleLinear().range([vis.height, 0]);

		vis.yScaleR = d3.scaleLinear().range([vis.height, 0]);

		vis.xScale = d3
			.scaleBand()
			.range([0, vis.width])
			.paddingInner(0.1);

		vis.xAxis = d3
			.axisBottom(vis.xScale)
			.ticks(['Never', 'Occasionally', 'Frequently'])
			.tickSizeOuter(0);

		vis.yAxis = d3
			.axisLeft(vis.yScale)
			.ticks(6)
			// .tickValues([0, 1000, 2000, 3000])
			.tickSizeOuter(0)
			.tickFormat(d3.format('d'));

		vis.yAxisR = d3
			.axisRight(vis.yScaleR)
			.tickSizeOuter(0)
			.ticks(5)
			.tickFormat(d3.format('.3f')); // Use decimal format for CGPA ticks

		// Define size of SVG drawing area
		vis.svg = d3
			.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// SVG Group containing the actual chart; D3 margin convention
		vis.chartArea = vis.svg
			.append('g')
			.attr(
				'transform',
				`translate(${vis.config.margin.left},${vis.config.margin.top})`
			);

		// Create the main chart group element
		vis.chart = vis.chartArea.append('g');

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chart
			.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', `translate(0,${vis.height + 5})`);

		// Append y-axis group
		vis.yAxisG = vis.chart
			.append('g')
			.attr('class', 'axis y-axis left');

		vis.yAxisGR = vis.chart
			.append('g')
			.attr('class', 'axis y-axis right')
			.attr('transform', 'translate(' + vis.width + ' ,0)');

		// Append axis title
		vis.svg
			.append('text')
			.attr('class', 'axis-title right')
			.attr(
				'x',
				vis.config.containerWidth - vis.config.margin.right
			)
			.attr('y', 60)
			.attr('dy', '.71em')
			.text('CGPA')
			.style('font-weight', 630);

		vis.svg
			.append('text')
			.attr('class', 'axis-title')
			.attr('x', 0)
			.attr('y', 60)
			.attr('dy', '.71em')
			.text('Count')
			.style('font-weight', 630);

		vis.svg
			.append('text')
			.attr('class', 'legend-title bottom')
			.attr('x', vis.width - 160)
			.attr('y', vis.height + 135)
			.attr('dy', '12')
			.text('Counseling Service Usage');

		vis.renderTitle();
		vis.renderLegend();
	}

	renderTitle() {
		let vis = this;

		vis.svg
			.append('text')
			.attr('class', 'chart-title')
			.attr('x', 180)
			.attr('y', 5)
			.attr('dy', '.71em')
			.style('text-anchor', 'middle')
			.style('font-size', '1.5em')
			.text('Counseling Service Usage and CGPA');
	}

	renderLegend() {
		let vis = this;

		const legendRectSize = 20; //rect width
		const legendSpacing = 10; // spacing between
		const legendRectHeight = 10; //rect height

		// Append legend
		vis.legend = vis.chart
			.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${vis.width + 10}, 245)`);

		// Append legend squares
		vis.legend
			.selectAll('rect')
			.data(vis.colorScale.domain())
			.join('rect')
			.attr('x', 60)
			.attr('y', (d, i) => i * 20)
			.attr('rx', 2)
			.attr('ry', 2)
			.attr('width', legendRectSize)
			.attr('height', legendRectHeight)
			.attr('fill', vis.colorScale)
			.style('stroke', '#000000');

		// Append legend text
		vis.legend
			.selectAll('text')
			.data(vis.colorScale.domain())
			.join('text')
			.attr('x', legendSpacing + 80)
			.attr('y', (d, i) => i * 20 + 9)
			.style('font-size', '14px')
			.text((d) => d);
	}

	updateData(newData) {
		this.data = newData;
	}

	updateVis() {
		let vis = this;

		// Calculate average CGPA for each group of "Counseling_Service_Use"
		const filteredDataCGPA = d3.rollups(
			vis.data,
			(v) => d3.mean(v, (d) => d.CGPA),
			(d) => d.Counseling_Service_Use
		);
		vis.filteredData = Array.from(
			filteredDataCGPA,
			([key, averageCGPA]) => ({
				key,
				averageCGPA: parseFloat(averageCGPA.toFixed(3)),
			})
		);

		const aggregatedDataMap = d3.rollups(
			vis.data,
			(v) => v.length,
			(d) => d.Counseling_Service_Use
		);
		vis.aggregatedData = Array.from(
			aggregatedDataMap,
			([key, count]) => ({
				key,
				count,
			})
		);

		const orderedKeys = ['Never', 'Occasionally', 'Frequently'];
		vis.aggregatedData = vis.aggregatedData.sort((a, b) => {
			return (
				orderedKeys.indexOf(a.key) -
				orderedKeys.indexOf(b.key)
			);
		});
		vis.filteredData = vis.filteredData.sort((a, b) => {
			return (
				orderedKeys.indexOf(a.key) -
				orderedKeys.indexOf(b.key)
			);
		});

		// Specify accessor functions
		vis.colorValue = (d) => d.key;
		vis.xValue = (d) => d.key;
		vis.yValue = (d) => d.count;
		vis.yValueR = (d) => d.averageCGPA;

		// Set the scale input domains
		vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
		vis.yScale.domain([
			0,
			d3.max(vis.aggregatedData, vis.yValue),
		]);
		// Dynamically set the domain for the right y-axis based on the filteredData's averageCGPA
		const minCGPA = d3.min(
			vis.filteredData,
			(d) => d.averageCGPA
		);
		const maxCGPA = d3.max(
			vis.filteredData,
			(d) => d.averageCGPA
		);
		vis.yScaleR.domain([
			(Math.floor(minCGPA * 100) / 100).toFixed(5),
			(Math.ceil(maxCGPA * 100) / 100).toFixed(5),
		]);

		vis.frequencyData = [
			{ color: '#fdbe85' },
			{ color: '#e6550d' },
			{ color: '#a63603' },
		];

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		// Add rectangles
		const bars = vis.chart
			.selectAll('.bar')
			.data(vis.aggregatedData, vis.xValue)
			.join('rect')
			.attr('class', (d) => `bar`)
			.attr('x', (d) => vis.xScale(vis.xValue(d)))
			.attr('width', vis.xScale.bandwidth())
			.attr(
				'height',
				(d) => vis.height - vis.yScale(vis.yValue(d))
			)
			.attr('y', (d) => vis.yScale(vis.yValue(d)))
			.attr('rx', 10) // round r
			.attr('ry', 10)
			.attr('fill', (d) => vis.colorScale(vis.colorValue(d)))
			.style('stroke', (d) =>
				d3.rgb(vis.colorScale(vis.colorValue(d))).darker(0.2)
			)
			.attr('stroke-width', 4)
			.classed(
				'clicked',
				(d) =>
					vis.highlightedData &&
					vis.highlightedData.length !== 0 &&
					d.key ===
						vis.highlightedData[0].Counseling_Service_Use
			)
			.on('mouseover', (event, d) => {
				const darkerColor = d3
					.rgb(vis.colorScale(vis.colorValue(d)))
					.darker(0.6);

				d3.select(event.currentTarget)
					.classed('bar-hover', true)
					.attr('fill', darkerColor)
					.style('stroke', (d) =>
						d3
							.rgb(vis.colorScale(vis.colorValue(d)))
							.darker(0.9)
					);

				// Find the corresponding item in vis.filteredData
				const correspondingItem = vis.filteredData.find(
					(item) => item.key === d.key
				);
				// Check if the item is found before accessing its properties
				if (correspondingItem) {
					d3.select('#tooltip')
						.style('display', 'block')
						.style('left', event.pageX + 20 + 'px')
						.style('top', event.pageY + 'px')
						.html(
							` Count: ${vis.yValue(
								d
							)} <br> Average CGPA: ${correspondingItem.averageCGPA.toFixed(
								3
							)}`
						);
				}
				d3.selectAll('.y-axis.left .tick text').style(
					'font-weight',
					'bold'
				);
				d3.select('.axis-title.left').style(
					'font-weight',
					'bold'
				);
			})
			.on('mouseleave', (event, d) => {
				d3.select(event.currentTarget)
					.classed('bar-hover', false)
					.attr('fill', (d) =>
						vis.colorScale(vis.colorValue(d))
					)
					.style('stroke', (d) =>
						d3
							.rgb(vis.colorScale(vis.colorValue(d)))
							.darker(0.2)
					);

				d3.select('#tooltip').style('display', 'none');
				d3.selectAll('.y-axis.left .tick text').style(
					'font-weight',
					'normal'
				);
				d3.select('.axis-title.left').style(
					'font-weight',
					'normal'
				);
			});

		const lineChart = vis.chart
			.selectAll('.line')
			.data([vis.filteredData]);

		lineChart
			.enter()
			.append('path')
			.attr('class', 'line')
			.attr('fill', 'none')
			.attr('stroke', '#000')
			.attr('stroke-width', 5)
			.merge(lineChart)
			.attr(
				'd',
				d3
					.line()
					.defined(
						(d) =>
							d.averageCGPA !== null &&
							d.averageCGPA !== undefined
					)
					.x(function (d) {
						return (
							vis.xScale(d.key) +
							vis.xScale.bandwidth() / 2
						);
					})
					.y(function (d) {
						return vis.yScaleR(d.averageCGPA);
					})
			)
			.on('mouseover', (event, d) => {
				d3.select(event.currentTarget).classed(
					'path-hover',
					true
				);
				d3.selectAll('.y-axis.right .tick text').style(
					'font-weight',
					'bold'
				);
				d3.select('.axis-title.right').style(
					'font-weight',
					'bold'
				);
			})
			.on('mouseleave', (event, d) => {
				d3.select(event.currentTarget).classed(
					'path-hover',
					false
				);
				d3.selectAll('.y-axis.right .tick text').style(
					'font-weight',
					'normal'
				);
				d3.select('.axis-title.right').style(
					'font-weight',
					'normal'
				);
			});

		lineChart.exit().remove();

		// Update axes
		vis.xAxisG.call(vis.xAxis);
		vis.yAxisG.call(vis.yAxis);
		vis.yAxisGR.call(vis.yAxisR);
	}
}
