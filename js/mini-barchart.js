class MiniBarChart {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	constructor(
		_config,
		_data,
		_indicator,
		_level,
		_minValue,
		_maxValue
	) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 160,
			containerHeight: 160,
			margin: {
				top: 15,
				right: 10,
				bottom: 25,
				left: 30,
			},
			tooltipPadding: _config.tooltipPadding || 15,
		};
		delete _data['Total'];
		this.data = _data;
		this.highlightedData = [];
		this.courses = Object.keys(_data).sort();
		this.indicator = _indicator;
		this.level = _level;
		this.colorScale = DataProcessor.coursesColorScale;
		this.shapeScale = DataProcessor.shapeScale;
		this.minValue = this.getMinMaxValues().minValue;
		this.maxValue = this.getMinMaxValues().maxValue;
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
		vis.yScale = d3.scaleLinear().range([vis.height - 10, 0]);

		vis.xScale = d3
			.scaleBand()
			.range([0, vis.width])
			.paddingInner(0.1);

		vis.xAxis = d3
			.axisBottom(vis.xScale)
			.tickSize(0)
			.tickSizeOuter(0)
			.tickFormat((d) => {
				// Rotate only x-axis labels by 30 degrees
				return d;
			});

		vis.yAxis = d3
			.axisLeft(vis.yScale)
			.tickSizeOuter(0)
			.tickSize(10)
			.tickFormat(d3.format('d'));

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
			.attr('class', 'mini-axis mini-x-axis')
			.attr('transform', `translate(0,${vis.height})`)
			.style('font-size', '7px');

		// Append y-axis group
		vis.yAxisG = vis.chart
			.append('g')
			.attr('class', 'mini-axis mini-y-axis')
			.attr('transform', `translate(0,0)`)
			.style('font-size', '7px');

		// Append axis title
		vis.svg
			.append('text')
			.attr('class', 'mini-axis-title')
			.attr('x', 0)
			.attr('y', 7)
			.text('Count')
			.style('font-size', '9px');
	}

	updateData() {
		let vis = this;

		delete vis.data['Total'];
		vis.courses = Object.keys(vis.data).sort();
		vis.minValue = this.getMinMaxValues().minValue;
		vis.maxValue = this.getMinMaxValues().maxValue;
	}

	updateVis() {
		let vis = this;

		vis.updateData();

		// Prepare data: count number of trails in each difficulty category
		// i.e. [{ key: 'easy', count: 10 }, {key: 'intermediate', ...
		vis.aggregatedData = [];
    
		vis.courses.forEach((course) => {
			if (Object.keys(vis.data).includes(course)) {
				vis.aggregatedData.push({
					key: course,
					count: vis.data[course][vis.indicator][vis.level],
				});
			}
		});

		vis.aggregatedData = vis.aggregatedData.sort((a, b) => {
			return (
				vis.courses.indexOf(a.key) -
				vis.courses.indexOf(b.key)
			);
		});

		// Specify accessor functions
		vis.colorValue = (d) => d.key;
		vis.xValue = (d) => d.key;
		vis.yValue = (d) => d.count;

		// Set the scale input domains
		vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
		vis.yScale.domain([vis.minValue, vis.maxValue]);

		vis.renderVis();
	}

	getMinMaxValues() {
		let vis = this;

		// Initialize min and max values with positive and negative infinity
		let minValue = Infinity;
		let maxValue = -Infinity;

		// vis.courses = Object.keys(vis.data).sort();

		// Iterate through selected courses
		vis.courses.forEach((course) => {
			// Iterate through attributes
			Object.keys(vis.data[course]).forEach((attribute) => {
				// Iterate through levels (low, moderate, high)
				Object.keys(vis.data[course][attribute]).forEach(
					(level) => {
						// Update overall min and max values
						minValue = Math.min(
							minValue,
							vis.data[course][attribute][level]
						);
						maxValue = Math.max(
							maxValue,
							vis.data[course][attribute][level]
						);
					}
				);
			});
		});

		return { minValue, maxValue };
	}

	highlightArea(dataItem) {
		let vis = this;

		vis.svg
			.selectAll('.icons')
			.style('stroke-width', 2)
			.style('stroke', (d) =>
				d3.rgb(vis.colorScale(vis.colorValue(d))).darker(0.5)
			);

		vis.svg
			.selectAll('.icons')
			.filter((d) => {
				return vis.isSameDataItem(d, dataItem);
			})
			.style('fill', '#FFFF00')
			.style('stroke', 'rgb(65, 65, 65)')
			.style('stroke-width', 4);
	}

	//compare
	isSameDataItem(item1, item2) {
		const keysToCompare = [
			'Age',
			'CGPA',
			'Stress_Level',
			'Depression_Score',
			'Anxiety_Score',
			'Counseling_Service_Use',
			'Course',
			'Diet_Quality',
			'Extracurricular_Involvement',
			'Financial_Stress',
			'Physical_Activity',
			'Sleep_Quality',
			'Social_Support',
		];

		return keysToCompare.every(
			(key) => item1[key] === item2[key]
		);
	}

	renderVis() {
		let vis = this;

		// Add rectangles
		const bars = vis.chart
			.selectAll('.minibar')
			.data(vis.aggregatedData, vis.xValue)
			.join('rect')
			.attr('class', 'minibar bar-group')
			.attr(
				'x',
				(d) =>
					vis.xScale(vis.xValue(d)) +
					(vis.xScale.bandwidth() - 3) / 2
			)
			.attr('width', (d) => {
				return '3px';
			})
			.attr('height', (d) => {
				return vis.height - vis.yScale(vis.yValue(d));
			})
			.attr('y', (d) => vis.yScale(vis.yValue(d)))
			.attr('fill', (d) => vis.colorScale(vis.colorValue(d)))
			// .style('stroke', (d) =>
			// 	d3.rgb(vis.colorScale(vis.colorValue(d))).darker(0.2)
			// )
			.classed('clicked', (d) => {
				return (
					vis.highlightedData &&
					vis.highlightedData.length !== 0 &&
					d.key === vis.highlightedData[0]['Course'] &&
					vis.level ===
						vis.highlightedData[0][vis.indicator]
				);
			});

		// Tooltip event listeners
		bars.on('mouseover', function (event, d) {
			const darkerColor = d3
				.rgb(vis.colorScale(vis.colorValue(d)))
				.darker(0.6);

			d3.select(event.currentTarget).attr('fill', darkerColor);

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
				// Format number with million and thousand separator
				.html(
					`<div class="tooltip-title">${
						vis.level
					} ${vis.indicator.replace(/_/g, ' ')}</div>
						<div class="tooltip-label">Major: ${d.key}</div>
						<div class="tooltip-label">Count: ${d3.format(',')(d.count)}</div>
						
						`
				);
		}).on('mouseleave', function (event, d) {
			d3.select(event.currentTarget)
				.attr('fill', (d) =>
					vis.colorScale(vis.colorValue(d))
				)
				.style('stroke', (d) =>
					d3
						.rgb(vis.colorScale(vis.colorValue(d)))
						.darker(0.2)
				);
			d3.select('#tooltip').style('display', 'none');
		});

		// Add icons
		const icons = vis.chart
			.selectAll('.icon')
			.data(vis.aggregatedData, vis.xValue)
			.join('path')
			.attr('class', 'icon bar-group')
			.attr('transform', (d) => {
				let scale = parseFloat(
					vis.calculateScale(d.key).toFixed(4)
				);
				let { pos_x, pos_y } = vis.calculatePosition(
					d,
					d.key,
					scale
				);
				return `translate(${pos_x},${pos_y}) scale(${scale})`;
			})
			.attr('d', (d) => vis.shapeScale(d.key)) // Assuming d.key is the course name
			.attr('fill', (d) => vis.colorScale(vis.colorValue(d)))
			.attr('stroke', (d) =>
				d3.rgb(vis.colorScale(vis.colorValue(d))).darker(0.2)
			)
			.attr('stroke-width', (d) => {
				let scale = parseFloat(
					vis.calculateScale(d.key).toFixed(4)
				);
				let stroke_width = vis.getStrokeWidthAfterClicked(
					d.key
				);

				const isClicked =
					vis.highlightedData &&
					vis.highlightedData.length !== 0 &&
					d.key === vis.highlightedData[0]['Course'] &&
					vis.level ===
						vis.highlightedData[0][vis.indicator];

				if (isClicked) {
					stroke_width = vis.getStrokeWidthAfterClicked(
						d.key
					);
				}
				return stroke_width / scale - 0.5;
			})
			.classed('clicked', (d) => {
				return (
					vis.highlightedData &&
					vis.highlightedData.length !== 0 &&
					d.key === vis.highlightedData[0]['Course'] &&
					vis.level ===
						vis.highlightedData[0][vis.indicator]
				);
			});

		// Tooltip event listeners
		icons
			.on('mouseover', function (event, d) {
				const darkerColor = d3
					.rgb(vis.colorScale(vis.colorValue(d)))
					.darker(0.6);

				d3.select(event.currentTarget).attr(
					'fill',
					darkerColor
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
					// Format number with million and thousand separator
					.html(
						`<div class="tooltip-title">${
							vis.level
						} ${vis.indicator.replace(/_/g, ' ')}</div>
						<div class="tooltip-label">Major: ${d.key}</div>
						<div class="tooltip-label">Count: ${d3.format(',')(d.count)}</div>
						
						`
					);
			})
			.on('mouseleave', function (event, d) {
				const darkerColor = d3
					.rgb(vis.colorScale(vis.colorValue(d)))
					.darker(0.2);

				d3.select(event.currentTarget).attr(
					'fill',
					darkerColor
				);

				d3.select('#tooltip').style('display', 'none');
			});

		// Update axes
		vis.xAxisG.call(vis.xAxis);
		vis.yAxisG
			.call(vis.yAxis)
			.call((g) => g.select('.domain').remove());

		// Add rotation to x-axis text
		vis.xAxisG
			.selectAll('.tick text')
			.attr('transform', 'rotate(-20)')
			.style('text-anchor', 'middle') // Adjust text-anchor as needed: start, middle, end
			.attr('x', -5)
			.attr('y', 5)
			.text(function (d) {
				if (d === 'Computer Science') {
					return 'Computer';
				}
				return d;
			});
	}

	// get the width and heigh of svg
	getSvgSize(type) {
		let vis = this;

		// Get the height and width of svg path
		// Add a temporary path element to the chart
		let tempPath = vis.chart
			.append('path')
			.attr('class', `temp-symbol ${type}`)
			.attr('d', () => vis.shapeScale(type))
			.attr('opacity', 0); // Make it invisible

		// Get the bounding box of the temporary path
		let bbox = tempPath.node().getBBox();

		// Remove the temporary path
		tempPath.remove();

		let svgHeight = bbox.height;
		let svgWidth = bbox.width;
		return { svgWidth, svgHeight };
	}

	calculatePosition(d, type, scale) {
		let vis = this;
		let { svgWidth, svgHeight } = vis.getSvgSize(type);
		let pos_x =
			vis.xScale(vis.xValue(d)) +
			vis.xScale.bandwidth() / 2 -
			(svgWidth * scale) / 2;
		let pos_y =
			vis.yScale(vis.yValue(d)) - svgHeight * scale + 2.5;
		switch (type) {
			case 'Business':
				// pos_y -= 3.0;
				return { pos_x, pos_y };
			case 'Computer Science':
				pos_x -= 0.6;
				pos_y -= 4.5;
				return { pos_x, pos_y };
			case 'Engineering':
				pos_x -= 1.3;
				pos_y -= 3.2;
				return { pos_x, pos_y };
			case 'Law':
				pos_x += 1.5;
				pos_y -= 3.3;
				return { pos_x, pos_y };
			case 'Medical':
				pos_x += 0.7;
				pos_y -= 1.6;
				return { pos_x, pos_y };
			case 'Others':
				pos_x += 0.2;
				pos_y -= 2.2;
				return { pos_x, pos_y };
			default:
				return { pos_x, pos_y };
		}
	}

	// Calculate the scale of svg icon
	calculateScale(type) {
		switch (type) {
			case 'Computer Science':
				return 0.34;
			case 'Engineering':
				return 0.4372;
			case 'Business':
				return 0.0249;
			case 'Law':
				return 0.0267;
			case 'Medical':
				return 0.0239;
			case 'Others':
				return 0.0249;
			default:
				return 0.0249;
		}
	}

	getStrokeWidthAfterClicked(type) {
		switch (type) {
			case 'Computer Science':
				return 1.8;
			case 'Engineering':
				return 1.5;
			case 'Business':
			case 'Law':
			case 'Medical':
			case 'Others':
				return 1.7;
			default:
				return 0; // default value if type doesn't match any case
		}
	}
}
