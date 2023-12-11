class HeatMapCircleChart {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, _data) {
		this.config = {
			parentElement: _config.parentElement,
			containerWidth: 900,
			containerHeight: 530,
			margin: {
				top: 0,
				right: 45,
				bottom: 30,
				left: 70,
			},
			tooltipPadding: _config.tooltipPadding || 15,
		};
		this.data = _data;
		this.highlightedData = [];
		this.selectedCourses = DataProcessor.selectedCourses.sort();
		this.view = DataProcessor.selectedView;
		this.levels = DataProcessor.wellBeingLevels;
		this.colorScale = DataProcessor.coursesColorScale;
		this.shapeScale = DataProcessor.shapeScale;
		this.attributes = DataProcessor.wellBeingIndicators;
		this.overallMinValue = this.getMinMaxValues().overallMinValue;
		this.overallMaxValue = this.getMinMaxValues().overallMaxValue;
		this.totalMinValue =
			this.getTotalMinMaxValues().totalMinValue;
		this.totalMaxValue =
			this.getTotalMinMaxValues().totalMaxValue;
		this.courses = Object.keys(this.data).filter(
			(course) => course !== 'Total'
		);
		this.initVis();
	}

	initVis() {
		let vis = this;
		// Todo: Create SVG area, chart, initialize scales and axes, add titles, etc
		// Calculate inner chart size. Margin specifies the space around the actual chart.
		// You need to adjust the margin config depending on the types of axis tick labels
		// and the position of axis titles (margin convetion: https://bl.ocks.org/mbostock/3019563)
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
			.attr('height', vis.config.containerHeight)
			.attr('id', 'heatmap-circle-chart');

		// Create scales
		// heatmap
		vis.xScale = d3
			.scaleBand()
			.domain(vis.attributes)
			.range([0, vis.width - 5])
			.padding(0);

		vis.yScale = d3
			.scaleBand()
			.domain(vis.levels)
			.range([vis.height, 5]);

		// mini bar
		vis.xBarScale = d3
			.scaleBand()
			.range([0, vis.width / 6])
			.paddingInner(0.1);
		vis.yBarScale = d3.scaleLinear().range([vis.height / 4, 0]);

		// Initialize axes
		vis.xAxis = d3
			.axisBottom(vis.xScale)
			.ticks(5)
			.tickPadding(20)
			.tickSizeInner(0)
			.tickSizeOuter(0);

		vis.yAxis = d3
			.axisLeft(vis.yScale)
			.ticks(3)
			.tickPadding(20)
			.tickSizeInner(0)
			.tickSizeOuter(0);

		vis.xBarAxis = d3
			.axisBottom(vis.xBarScale)
			.ticks(this.courses)
			.tickSizeOuter(0);

		vis.yBarAxis = d3
			.axisLeft(vis.yBarScale)
			.tickValues([0, 20, 40, 60, 80, 100])
			.tickSizeOuter(0)
			.tickFormat(d3.format('d'));

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chart = vis.svg
			.append('g')
			.attr(
				'transform',
				`translate(${vis.config.margin.left + 20},${
					vis.config.margin.top - 15
				})`
			);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chart
			.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', `translate(0, ${vis.height})`); // , rotate(-45)

		// Append y-axis group
		vis.yAxisG = vis.chart
			.append('g')
			.attr('class', 'axis y-axis');

		// Draw vertical lines
		vis.svg
			.selectAll('line')
			.data(vis.attributes.slice(1))
			.enter()
			.append('line')
			.attr(
				'x1',
				(d) => vis.xScale(d) + vis.xScale.bandwidth() / 2 + 13
			)
			.attr('y1', 25)
			.attr(
				'x2',
				(d) => vis.xScale(d) + vis.xScale.bandwidth() / 2 + 13
			)
			.attr('y2', vis.height - 10) // Adjust the height as needed
			.attr('stroke', '#ccc');
	}

	updateVis() {
		let vis = this;

		// Set the scale input domains
		vis.xScale.domain([
			'Sleeping Quality',
			'Physical Activity',
			'Diet Quality',
			'Social Support',
			'Extracurricular',
		]);
		vis.yScale.domain(vis.levels);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;
		// Todo: Bind data to visual elements, update axes

		// Remove existing circles and paths
		vis.chart.selectAll('.circle').remove();
		vis.chart.selectAll('.symbol').remove();

		// Overall view for multiple course
		if (vis.view === 'Overall') {
			// Bind data to visual elements
			// Add circles
			const icons = vis.chart
				.selectAll('.circle')
				.data(vis.getTotalDataCounts('Total'))
				.enter()
				.append('path')
				.attr('class', 'circle')
				.attr('transform', (d) => {
					const scale = parseFloat(
						vis
							.calculateScale(d.value, 'Circle')
							.toFixed(2)
					);
					let { svgWidth, svgHeight } =
						vis.getSvgSize('Circle');
					const { dx, dy } = vis.calculateDxDy(
						scale,
						'Circle'
					);
					let pos_x =
						vis.xScale.bandwidth() * (d.col - 1) +
						vis.xScale.bandwidth() / 2 -
						(svgWidth / 2) * scale;
					let pos_y =
						vis.yScale.bandwidth() * (d.row - 1) +
						vis.yScale.bandwidth() / 2 -
						(svgHeight / 2) * scale;

					return `translate(${pos_x + dx}, ${
						pos_y + dy
					}) scale(${scale})`;
				}) // 0.6, 1.8
				.attr('d', () => vis.shapeScale('Circle'))
				.attr('fill', (d) => vis.colorScale('Circle'))
				.attr('stroke', () => vis.colorScale('Stroke_Circle')) // Add stroke color
				.attr('stroke-width', (d) => {
					const scale = parseFloat(
						vis
							.calculateScale(d.value, 'Circle')
							.toFixed(4)
					);
					let stroke_width = vis.getStrokeWidth('Circle');

					const isClicked =
						vis.highlightedData &&
						vis.highlightedData.length !== 0 &&
						vis.highlightedData[0][d.attribute] ===
							d.level;

					if (isClicked) {
						stroke_width = 4;
					}
					return stroke_width / scale;
				})
				.classed('clicked', (d) => {
					return (
						vis.highlightedData &&
						vis.highlightedData.length !== 0 &&
						vis.highlightedData[0][d.attribute] ===
							d.level
					);
				});
			// Tooltip event listeners
			icons
				.on('mouseover', function (event, d) {
					const scale = parseFloat(
						vis
							.calculateScale(d.value, 'Circle')
							.toFixed(4)
					);
					let stroke_width = vis.getStrokeWidth('Circle')/scale;

					const fillColor = d3.select(this).attr('fill');
					const strokeColor = d3.select(this).attr('stroke');
					d3.select(this).attr(
						'style',
						vis.generateHoverStyle(fillColor, strokeColor, stroke_width)
					);

					d3.select('#tooltip')
						.style('display', 'block')
						.style(
							'left',
							event.pageX +
								vis.config.tooltipPadding +
								'px'
						)
						.style(
							'top',
							event.pageY +
								vis.config.tooltipPadding +
								'px'
						)
						// Format number with million and thousand separator
						.html(
							`<div class="tooltip-title">${
								d.level
							} ${d.attribute.replace(/_/g, ' ')}</div>
						<div class="tooltip-label">Count: ${d3.format(',')(d.value)}</div>
						
						`
						);
				})
				.on('mouseleave', function () {
				const color = d3.select(this).attr('fill');
				d3.select(this).attr('style', color); // Reset to original style
					d3.select('#tooltip').style('display', 'none');
				});

			icons.on('click', function (event, d) {
				// Check if current category is active and toggle class
				const isActive = d3.select(this).classed('active');
				d3.select(this).classed('active', !isActive);
			});
		}

		// Update the axes/gridlines
		// We use the second .call() to remove the axis and just show gridlines
		vis.xAxisG.call(vis.xAxis);
		vis.yAxisG
			.call(vis.yAxis)
			.call((g) => g.select('.domain').remove());
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

	// get all the attributes, levels count, and cols and rows
	getTotalDataCounts(major) {
		let vis = this;
		let dataArray = [];

		vis.attributes.forEach((attribute) => {
			vis.levels.forEach((level) => {
				let col = vis.attributes.indexOf(attribute) + 1;
				let row =
					vis.levels.length - vis.levels.indexOf(level);

				dataArray.push({
					attribute: attribute,
					level: level,
					col: col,
					row: row,
					value: vis.data[major][attribute][level],
				});
			});
		});

		return dataArray;
	}

	getMinMaxValues() {
		let vis = this;

		// Initialize min and max values with positive and negative infinity
		let overallMinValue = Infinity;
		let overallMaxValue = -Infinity;

		// Iterate through selected courses
		vis.selectedCourses.forEach((course) => {
			// Iterate through attributes
			Object.keys(vis.data[course]).forEach((attribute) => {
				// Iterate through levels (low, moderate, high)
				Object.keys(vis.data[course][attribute]).forEach(
					(level) => {
						// Update overall min and max values
						overallMinValue = Math.min(
							overallMinValue,
							vis.data[course][attribute][level]
						);
						overallMaxValue = Math.max(
							overallMaxValue,
							vis.data[course][attribute][level]
						);
					}
				);
			});
		});

		return { overallMinValue, overallMaxValue };
	}

	getTotalMinMaxValues() {
		let vis = this;

		// Initialize min and max values with positive and negative infinity
		let totalMinValue = Infinity;
		let totalMaxValue = -Infinity;

		// Iterate through attributes
		Object.keys(vis.data['Total']).forEach((attribute) => {
			// Iterate through levels (low, moderate, high)
			Object.keys(vis.data['Total'][attribute]).forEach(
				(level) => {
					// Update overall min and max values
					totalMinValue = Math.min(
						totalMinValue,
						vis.data['Total'][attribute][level]
					);
					totalMaxValue = Math.max(
						totalMaxValue,
						vis.data['Total'][attribute][level]
					);
				}
			);
		});

		return { totalMinValue, totalMaxValue };
	}

	getStrokeWidth(type) {
		switch (type) {
			case 'Circle':
				return 3;
			case 'Computer Science':
			case 'Engineering':
				return 1;
			case 'Medical':
			case 'Law':
				return 1.2;
			case 'Business':
			case 'Others':
				return 1.2;
			default:
				return 0; // default value if type doesn't match any case
		}
	}

	// Calculate the dx and dy of svg icon position within the chart
	calculateDxDy(scale, type) {
		let vis = this;
		let dx;
		let dy;
		// Overall view for multiple courses
		if (vis.view === 'Overall' && type === 'Circle') {
			if (scale < 1.4) {
				dx = 3;
			} else if (scale < 2) {
				dx = 0;
			} else if (scale < 2.6) {
				dx = -2;
			} else if (scale < 3.8) {
				dx = -4;
			} else {
				dx = -6;
			}
			dy = 2;
			return { dx, dy };
		}
		// Overall view for single course
		if (vis.selectedCourses.length === 1) {
			dx = 0;
			dy = 7;
			switch (type) {
				case 'Business':
					dx = 6;
					break;
				case 'Engineering':
					dx = 1;
					break;
				case 'Law':
					dx = 7;
					break;
				case 'Computer Science':
				case 'Medical':
				case 'Others':
					dx = 3;
					break;
				default:
					break;
			}
			return { dx, dy };
		}
		return { dx, dy };
	}

	// Calculate the scale of svg icon
	calculateScale(value, type) {
		let vis = this;

		let scaleFactor = [0.8, 4.6];

		// get the data value range for svg icon
		let max_val, min_val;

		if (vis.view === 'Overall' && type === 'Circle') {
			max_val = vis.getTotalMinMaxValues().totalMaxValue;
			min_val = vis.getTotalMinMaxValues().totalMinValue;
		} else {
			max_val = vis.getMinMaxValues().overallMaxValue;
			min_val = vis.getMinMaxValues().overallMinValue;
		}

		let space = Math.ceil((max_val - min_val) / 6);
		const scaleRanges = [
			[min_val, min_val + space],
			[min_val + space, min_val + space * 2],
			[min_val + space * 2, min_val + space * 3],
			[min_val + space * 3, min_val + space * 4],
			[min_val + space * 4, min_val + space * 5],
			[min_val + space * 5, max_val],
		];

		const scale = scaleRanges.find(
			([min, max]) => value >= min && value <= max
		);

		if (vis.view === 'Overall' && type === 'Circle') {
			return d3.scaleLinear().domain(scale).range(scaleFactor)(
				value
			);
		}

		// When only one course being selected
		if (vis.selectedCourses.length === 1) {
			switch (type) {
				case 'Computer Science':
					scaleFactor = [0.4, 2];
					break;
				case 'Engineering':
					scaleFactor = [0.7, 2.5];
					break;
				case 'Law':
					scaleFactor = [0.04, 0.1];
					break;
				case 'Business':
				case 'Medical':
				case 'Others':
					scaleFactor = [0.04, 0.15];
					break;
				default:
					break;
			}
		}

		return d3.scaleLinear().domain(scale).range(scaleFactor)(
			value
		);
	}

	generateHoverStyle(fillColor, strokeColor, stroke_width) {
		const darkerColor = d3.rgb(fillColor).darker(0.4);
		const darkerStrokeColor = d3.rgb(strokeColor).darker(0.4);
		return `
			fill: ${darkerColor};
			stroke: ${darkerStrokeColor};
			stroke-width: ${stroke_width+0.5};
		`;
	}
}
