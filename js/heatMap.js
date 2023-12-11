class HeatMap {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	constructor(_config, _dispatch, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 1440,
			containerHeight: 400,
			margin: {
				top: 80,
				right: 100,
				bottom: 20,
				left: 140,
			},
			tooltipPadding: _config.tooltipPadding || 15,
		};
		this.dispatcher = _dispatch;
		this.data = _data;
		this.highlightedData = [];
		this.colorRange = [
			'#d5f0f9',
			'lightblue',
			'rgb(128, 212, 242)',
			'rgb(49, 162, 203)',
			'rgb(9, 92, 123)',
		];
		this.selectedRect = [];
		this.selectedData = [];
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

		// Define size of SVG drawing area
		vis.svg = d3
			.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chart = vis.svg
			.append('g')
			.attr(
				'transform',
				`translate(${vis.config.margin.left},${vis.config.margin.top})`
			);

		vis.xScale = d3
			.scaleBand()
			.range([0, vis.width])
			.domain([18, 19, 20, 21, 22, 23, 24])
			.padding(0.15);

		vis.yScale = d3
			.scaleBand()
			.range([0, vis.height])
			.domain([
				'Engineering',
				'Business',
				'Computer Science',
				'Medical',
				'Law',
				'Others',
			])
			.padding(0.15);

		// Initialize axes
		vis.xAxis = d3.axisTop(vis.xScale).tickSize(0);
		vis.yAxis = d3.axisLeft(vis.yScale).tickSize(0);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chart
			.append('g')
			.attr('class', 'heatMap-x')
			.attr('transform', `translate(0,${vis.height + 15})`);

		vis.yAxisG = vis.chart.append('g').attr('class', 'heatMap-y');

		vis.countLegend = vis.chart
			.append('g')
			.attr('class', 'count-legend')
			.attr('transform', `translate(${vis.width - 380}, -20)`);

		// create texts
		vis.svg
			.append('text')
			.attr('class', 'heatMap-title-y')
			.attr('x', 100)
			.attr('y', vis.config.margin.top - 25)
			.attr('dy', '.71em')
			.text('Major')
			.attr('font-size', '1.3em');

		vis.svg
			.append('text')
			.attr('class', 'heatMap-title-cnt')
			.attr('x', vis.width - 310)
			.attr('y', vis.config.margin.top - 11)
			.text('Count:');

		vis.svg
			.append('text')
			.attr('class', 'heatMap-title-x')
			.attr('x', vis.width + 120)
			.attr('y', vis.height + vis.config.margin.top + 15)
			.text('Age')
			.attr('font-size', '1.3em');

		// Update the axes/gridlines
		vis.xAxisG
			.call(vis.xAxis)
			.call((g) => g.select('.domain').remove())
			.selectAll('text')
			.attr('font-size', '1.4em')
			.style('font-family', '"Gill Sans", sans-serif'); // Add font family

		vis.yAxisG
			.call(vis.yAxis)
			.call((g) => g.select('.domain').remove())
			.selectAll('text')
			.attr('font-size', '1.4em')
			.style('font-family', '"Gill Sans", sans-serif'); // Add font family

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
	}

	updateData(newData) {
		this.data = newData;
	}

	// Function to transform the rollup result into the desired dataset structure
	transformRollupResult(rollupResult, ageRange) {
		let vis = this;
		const result = [];

		rollupResult.forEach(([course, ageCounts]) => {
			const ageCountMap = new Map(ageCounts);

			for (let age = ageRange[0]; age <= ageRange[1]; age++) {
				const count = ageCountMap.get(age) || 0;
				const color = vis.colorRange[Math.floor(count / 50)];

				result.push({ course, age, count, color });
			}
		});

		return result;
	}

	filterByCourseAge(course_age_list) {
		let vis = this;
		vis.filterData = vis.data.filter((d) => {
			for (let i = 0; i < course_age_list.length; ++i) {
				if (
					d.Course === course_age_list[i].course &&
					d.Age === course_age_list[i].age
				) {
					return d;
				}
			}
		});
		return vis.filterData;
	}

	updateVis() {
		let vis = this;

		vis.courseGroup = d3.rollups(
			vis.data,
			(v) => v.length,
			(d) => d.Course,
			(d) => d.Age
		);

		vis.recData = vis.transformRollupResult(
			vis.courseGroup,
			[18, 24]
		);

		vis.countData = [
			{ color: 'lightblue', range: '50-100', x: 0 },
			{ color: 'rgb(128, 212, 242)', range: '101-150', x: 90 },
			{ color: 'rgb(49, 162, 203)', range: '151-200', x: 180 },
			{ color: 'rgb(9, 92, 123)', range: '201-250', x: 270 },
		];

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		const legendRectSize = 20; //rect width
		const legendSpacing = 25; // spacing between
		const legendRectHeight = 10; //rect height

		const rects = vis.chart
			.selectAll('.main-rect')
			.data(vis.recData)
			.join('rect')
			.attr('class', 'main-rect')
			.attr('x', (d) => vis.xScale(d.age))
			.attr('y', (d) => vis.yScale(d.course))
			.attr('width', vis.xScale.bandwidth())
			.attr('height', vis.yScale.bandwidth())
			.attr('fill', (d) => d.color)
			.attr('rx', 5) // round r
			.attr('ry', 5)
			.style('stroke', (d) => d3.rgb(d.color).darker(0.1))
			.attr('stroke-width', 3)
			.classed('clicked', (d) => {
				return (
					vis.highlightedData &&
					vis.highlightedData.length !== 0 &&
					vis.highlightedData[0]['Course'] === d.course &&
					vis.highlightedData[0]['Age'] === d.age
				);
			});

		// Tooltip event listeners
		rects
			.on('mouseover', function (event, d) {
				const color = d3.select(this).attr('fill');
				d3.select(this).attr(
					'style',
					vis.generateHoverStyle(color)
				);

				d3.select('#tooltip')
					.style('display', 'block')
					.style(
						'left',
						event.pageX + vis.config.tooltipPadding + 'px'
					)
					.style(
						'top',
						event.pageY + vis.config.tooltipPadding + 'px'
					)
					.html(`Count: ${d.count}`);
			})
			.on('mouseleave', function () {
				const color = d3.select(this).attr('fill');
				d3.select(this).attr('style', color); // Reset to original style
				d3.select('#tooltip').style('display', 'none');
			});

		rects.on('click', function (event, d) {
			// Check if current rect is active and toggle class
			if (
				vis.highlightedData &&
				vis.highlightedData.length !== 0
			) {
				// remove clicked dot
				clearAllInteractions();
			}
			const isActive = d3.select(this).classed('active');
			d3.select(this).classed('active', !isActive);

			// Get the names of all active/filtered rect
			vis.selectedRect = vis.chart
				.selectAll('.main-rect.active')
				.data()
				.map((k) => {
					return { course: k.course, age: k.age };
				});

			vis.filterByCourseAge(vis.selectedRect); // console.log(vis.filterData)

			const selectedCourseAges = vis.filterData;

			vis.dispatcher.call(
				'filterCourseAge',
				event,
				selectedCourseAges
			);
		});

		const cntRect = vis.countLegend
			.selectAll('.count-rect')
			.data(vis.countData)
			.join('rect')
			.attr('class', 'count-rect')
			.attr('x', (d) => d.x)
			.attr('y', 0)
			.attr('rx', 2)
			.attr('ry', 2)
			.attr('width', legendRectSize)
			.attr('height', legendRectHeight)
			.attr('fill', (d) => d.color)
			.style('stroke', '#000000');

		const cntText = vis.countLegend
			.selectAll('.count-text')
			.data(vis.countData)
			.join('text')
			.attr('class', 'count-rect')
			.attr('x', (d) => d.x + legendSpacing)
			.attr('y', 10)
			.text((d) => {
				return d.range;
			})
			.style('font-size', '14px');

		vis.renderTitle();
	}

	renderTitle() {
		let vis = this;

		vis.svg
			.append('text')
			.attr('class', 'chart-title')
			.attr('x', 260)
			.attr('y', 0)
			.attr('dy', '.71em')
			.style('text-anchor', 'middle')
			.style('font-size', '1.5em')
			.text('Segmentation of Students Based on Major and Age');
	}

	generateHoverStyle(color) {
		const darkerColor = d3.rgb(color).darker(0.3);
		const darkerStrokeColor = d3.rgb(color).darker(0.4);
		return `
			fill: ${darkerColor};
			stroke: ${darkerStrokeColor};
			stroke-width: 5;
		`;
	}
}
