class DataProcessor {
	// List of attributes to hide or delete
	static attributesToHide = [
		'Gender',
		'Relationship_Status',
		'Substance_Use',
		'Family_History',
		'Chronic_Illness',
		// 'Financial_Stress',
		'Semester_Credit_Load',
		'Residence_Type',
	];

	static selectedView = 'lollipopsView'; // 'Overall', 'Listed', 'lollipopsView'
	static selectedCourses = [
		'Business',
		'Computer Science',
		'Engineering',
		'Law',
		'Medical',
		'Others',
	];

	static wellBeingIndicators = [
		'Sleep_Quality',
		'Physical_Activity',
		'Diet_Quality',
		'Social_Support',
		'Extracurricular_Involvement',
	];

	static wellBeingLevels = ['Low', 'Moderate', 'High'];

	static coursesColorScale = d3
		.scaleOrdinal()
		.range([
			'#ff8c38',
			'#6e40aa',
			'#e600db',
			'#ffe133',
			'#e60031',
			'#aff05b',
			'#E0F4FF',
			'#87C4FF',
			'#000',
		])
		.domain([
			'Business',
			'Computer Science',
			'Engineering',
			'Law',
			'Medical',
			'Others',
			'Circle',
			'Stroke_Circle',
			'Stroke_Course',
		]);

	// Svg icon path
	// https://www.svgrepo.com/vectors/gear/
	static shapeScale = d3
		.scaleOrdinal()
		.range([
			// bag path
			'M304,309.328V360h-96v-50.672H0v117.344c0,35.344,28.656,64,64,64h384c35.344,0,64-28.656,64-64V309.328H304z M372,69.328c0,8.844-7.406,16-16.563,16H156.578c-9.156,0-16.578-7.156-16.578-16v-32 c0-8.828,7.422-16,16.578-16h198.859c9.156,0,16.563,7.172,16.563,16V69.328z M180.656,185.328c0,8.844-7.156,16-16,16h-1.328c-8.828,0-16-7.156-16-16V120c0-8.844,7.172-16,16-16h1.328 c8.844,0,16,7.156,16,16V185.328z M364.656,185.328c0,8.844-7.156,16-16,16h-1.328c-8.828,0-16-7.156-16-16V120c0-8.844,7.172-16,16-16h1.328 c8.844,0,16,7.156,16,16V185.328z M448,154.672H64c-35.344,0-64,28.656-64,64v58.656h208V232h96v45.328h208v-58.656 C512,183.328,483.344,154.672,448,154.672z',
			// laptop path
			'M41,6H7A2,2,0,0,0,5,8V32a2,2,0,0,0,2,2H41a2,2,0,0,0,2-2V8A2,2,0,0,0,41,6ZM21.4,24.6a1.9,1.9,0,0,1-.2,3,2,2,0,0,1-2.7-.3l-5.9-5.9a1.9,1.9,0,0,1,0-2.8l5.9-6a2.3,2.3,0,0,1,2.7-.3,2,2,0,0,1,.2,3.1L16.8,20Zm14-3.2-5.9,5.9a2,2,0,0,1-2.7.3,1.9,1.9,0,0,1-.2-3L31.2,20l-4.6-4.6a2,2,0,0,1,.2-3.1,2.3,2.3,0,0,1,2.7.3l5.9,6A1.9,1.9,0,0,1,35.4,21.4Z M44,38H4a2,2,0,0,0,0,4H44a2,2,0,0,0,0-4Z',
			// gear path
			'M27.526,18.036L27,17.732c-0.626-0.361-1-1.009-1-1.732s0.374-1.371,1-1.732l0.526-0.304 c1.436-0.83,1.927-2.662,1.098-4.098l-1-1.732c-0.827-1.433-2.666-1.925-4.098-1.098L23,7.339c-0.626,0.362-1.375,0.362-2,0 c-0.626-0.362-1-1.009-1-1.732V5c0-1.654-1.346-3-3-3h-2c-1.654,0-3,1.346-3,3v0.608c0,0.723-0.374,1.37-1,1.732 c-0.626,0.361-1.374,0.362-2,0L8.474,7.036C7.042,6.209,5.203,6.701,4.375,8.134l-1,1.732c-0.829,1.436-0.338,3.269,1.098,4.098 L5,14.268C5.626,14.629,6,15.277,6,16s-0.374,1.371-1,1.732l-0.526,0.304c-1.436,0.829-1.927,2.662-1.098,4.098l1,1.732 c0.828,1.433,2.667,1.925,4.098,1.098L9,24.661c0.626-0.363,1.374-0.361,2,0c0.626,0.362,1,1.009,1,1.732V27c0,1.654,1.346,3,3,3h2 c1.654,0,3-1.346,3-3v-0.608c0-0.723,0.374-1.37,1-1.732c0.625-0.361,1.374-0.362,2,0l0.526,0.304 c1.432,0.826,3.271,0.334,4.098-1.098l1-1.732C29.453,20.698,28.962,18.865,27.526,18.036z M16,21c-2.757,0-5-2.243-5-5s2.243-5,5-5 s5,2.243,5,5S18.757,21,16,21z',
			// leather pen path
			'M288.904,408.495c-7.865,13.493-21.341,21.569-36.03,21.569c-14.507,0-28.237-7.929-35.838-20.701 c-7.966-13.392-8.058-29.973-0.247-44.37c6.038-11.136,13.319-25.561,21.751-42.26c37.19-73.704,74.315-143.379,113.808-191.778 V26.814H0v458.373h352.348V323.711c-6.888,3.033-14.461,5.28-22.729,6.44C317.488,354.022,294.686,398.62,288.904,408.495z M451.165,92.926c-83.341,11.483-170.428,213.09-209.71,285.45c-9.866,18.18,13.082,33.352,23.231,15.95 c7.317-12.506,47.229-91.28,47.229-91.28c43.475,1.434,59.508-28.922,42.132-47.777c58.43,1.206,87.388-30.95,70.818-50.464 c17.429,5.518,32.521,1.827,54.939-10.396C527.636,168.319,525.408,80.986,451.165,92.926z',
			// pill path
			'M467.766,44.211c-29.494-29.494-68.22-44.24-106.884-44.181c-38.666-0.06-77.392,14.688-106.886,44.182 l-82.428,82.426l213.71,213.71l82.428-82.426C526.755,198.875,526.755,103.199,467.766,44.211z M409.917,57.219 c-2.638,13.788-16.006,22.842-29.853,20.142c-7.854-1.497-15.945-2.277-24.039-2.338c-8.033,0-16.127,0.779-24.039,2.338 c-8.572,1.619-17.024-1.197-22.84-7.014c-3.474-3.476-5.934-7.972-6.955-13.187c-2.635-13.787,6.355-27.096,20.203-29.795 c11.031-2.158,22.422-3.236,33.692-3.236c11.269,0,22.6,1.138,33.689,3.237C403.562,30.003,412.616,43.372,409.917,57.219z M44.242,253.966C14.688,283.52,0,322.185,0,360.911c0,38.606,14.746,77.332,44.24,106.826 c58.988,58.988,154.666,58.986,213.712-0.06l82.367-82.367l-213.71-213.711L44.242,253.966z',
			// paint path
			'M468.277,116.662c-27.603-40.846-66.66-73.285-112.616-92.728C325.024,10.979,291.31,3.813,256.007,3.813 s-68.914,7.166-99.422,20.135c-30.507,12.969-57.911,31.72-80.944,54.876C29.582,125.109,0.966,189.104,0.013,259.601v0.013 C0.007,260.484,0,261.355,0,262.21c0,18.834,2.795,34.961,7.865,48.553c5.056,13.586,12.441,24.609,21.286,32.858 c5.892,5.508,12.407,9.77,19.176,12.811c9.037,4.056,18.491,5.946,27.657,5.946c8.187,0,16.148-1.493,23.486-4.385 c7.33-2.897,14.065-7.2,19.587-12.921c14.64-15.181,35.707-24.334,59.042-24.341c17.402,0.007,33.44,5.262,46.826,14.298 c13.374,9.03,24.019,21.854,30.363,36.865c4.234,10.016,6.577,20.998,6.577,32.603c0.007,4.679-0.754,9.551-1.966,14.894 c-1.192,5.33-2.843,11.071-4.282,17.415c-1.35,5.988-2.014,11.722-2.014,17.196c-0.027,10.125,2.371,19.388,6.694,27.061 c4.302,7.694,10.407,13.654,17.073,17.868c4.446,2.822,9.153,4.905,13.914,6.384c6.351,1.96,12.797,2.864,19.052,2.871 c5.858-0.007,11.565-0.788,16.977-2.46c52.951-16.387,99.058-48.594,132.011-91.364c32.946-42.75,52.691-96.215,52.677-154.558 C512.014,206.841,495.873,157.507,468.277,116.662z M126.462,251.147c-20.998,0-38.024-17.032-38.024-38.023 c0-21.006,17.025-38.03,38.024-38.03c21.005,0,38.03,17.024,38.03,38.03C164.492,234.115,147.467,251.147,126.462,251.147z M193.245,166.434c-18.264,0-33.077-14.812-33.077-33.083c0-18.265,14.812-33.077,33.077-33.077 c18.272,0,33.083,14.812,33.083,33.077C226.328,151.622,211.517,166.434,193.245,166.434z M288.782,149.738 c-16.388,0-29.679-13.291-29.679-29.678s13.291-29.678,29.679-29.678c16.387,0,29.678,13.29,29.678,29.678 S305.17,149.738,288.782,149.738z M361.744,137.53c14.6,0,26.431,11.831,26.431,26.43c0,14.593-11.831,26.431-26.431,26.431 c-14.599,0-26.43-11.838-26.43-26.431C335.314,149.361,347.146,137.53,361.744,137.53z M409.085,359.556 c-3.062,7.221-8.153,13.339-14.552,17.676c-6.406,4.33-14.196,6.871-22.485,6.871c-5.522,0-10.831-1.13-15.641-3.165 c-7.221-3.055-13.346-8.146-17.676-14.551c-4.337-6.406-6.878-14.188-6.872-22.478c0-5.522,1.123-10.831,3.158-15.647 c3.062-7.215,8.146-13.339,14.552-17.669c6.406-4.344,14.195-6.879,22.478-6.872c5.529,0,10.838,1.124,15.648,3.158 c7.221,3.056,13.346,8.153,17.675,14.552c4.337,6.406,6.879,14.196,6.872,22.478C412.243,349.43,411.12,354.747,409.085,359.556z M397.61,254.503c-11.414,0-20.676-9.249-20.676-20.67s9.262-20.67,20.676-20.67c11.42,0,20.676,9.249,20.676,20.67 S409.03,254.503,397.61,254.503z',
			// circle path
			'M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z',
		])
		.domain([
			'Business',
			'Computer Science',
			'Engineering',
			'Law',
			'Medical',
			'Others',
			'Circle',
		]);

	/* Data process for heatmap-circle and minibar */
	static calculateCourseAttributeCounts(dataset) {
		// Initialize counters
		let counts = {};

		// Loop through the dataset and increment counters based on attribute values
		dataset.forEach((item) => {
			let course = item.Course; // Major
			if (DataProcessor.selectedCourses.includes(course)) {
				// Initialize counters for the major if not done already
				if (!counts[course]) {
					counts[course] = {
						Sleep_Quality: {
							Low: 0,
							Moderate: 0,
							High: 0,
						},
						Physical_Activity: {
							Low: 0,
							Moderate: 0,
							High: 0,
						},
						Diet_Quality: {
							Low: 0,
							Moderate: 0,
							High: 0,
						},
						Social_Support: {
							Low: 0,
							Moderate: 0,
							High: 0,
						},
						Extracurricular_Involvement: {
							Low: 0,
							Moderate: 0,
							High: 0,
						},
					};
				}

				// Increment counters for the major and total
				DataProcessor.wellBeingIndicators.forEach(
					(attribute) => {
						counts[course][attribute][item[attribute]]++;
						if (!counts.Total) {
							counts.Total = {};
						}
						if (!counts.Total[attribute]) {
							counts.Total[attribute] = {
								Low: 0,
								Moderate: 0,
								High: 0,
							};
						}
						counts.Total[attribute][item[attribute]]++;
					}
				);
			}
		});

		return counts;
	}

	static shortenIndicatorName(indicator) {
		switch (indicator) {
			case 'Sleep_Quality':
				return 'sleep';
			case 'Physical_Activity':
				return 'physical';
			case 'Diet_Quality':
				return 'diet';
			case 'Social_Support':
				return 'social';
			case 'Extracurricular_Involvement':
				return 'extra';
			default:
				break;
		}
	}

	// Normalize scales for well-being indicators
	static normalize_scale(value) {
		value =
			value.charAt(0).toUpperCase() +
			value.slice(1).toLowerCase();

		// Define original and target scales
		const originalScale = ['Good', 'Average', 'Poor'];
		const targetScale = ['High', 'Moderate', 'Low'];

		// Check if the value is in the original scale
		if (originalScale.includes(value)) {
			// Find the index of the value in the original scale and return the corresponding value in the target scale
			const index = originalScale.indexOf(value);
			return targetScale[index];
		}

		// Check if the value is in the target scale
		if (targetScale.includes(value)) {
			// Return the value in the target scale
			return value;
		}

		return '';
	}

	// get the min and max value of five well being indicators
	static getMinMaxCnt(data) {
		// Initialize min and max values with positive and negative infinity
		let minValue = Infinity;
		let maxValue = -Infinity;

		// Iterate through attributes
		DataProcessor.selectedCourses.forEach((course) => {
			Object.keys(data[course]).forEach((attribute) => {
				// Iterate through levels (low, moderate, high)
				Object.keys(data[course][attribute]).forEach(
					(level) => {
						// Update overall min and max values
						minValue = Math.min(
							minValue,
							data[course][attribute][level]
						);
						maxValue = Math.max(
							maxValue,
							data[course][attribute][level]
						);
					}
				);
			});
		});

		return { minValue, maxValue };
	}

	// Dotmatrix highlight
	/**
	 * highlights a bar that corresponds to the dot (if available) when a dot is clicked
	 * @param dotClicked is the dot that was clicked.
	 */
	static highlightBarChartData(dotClicked) {
		barChart.highlightedData = [dotClicked];
		barChart.updateVis();
	}

	/**
	 * highlights a mini-bar that corresponds to the dot (if available) when a dot is clicked
	 * @param dotClicked is the dot that was clicked.
	 */
	static highlightMiniBarChartData(dotClicked) {
		miniBarCharts.forEach((chart) => {
			chart.highlightedData = [dotClicked];
			chart.highlightArea(dotClicked);
			chart.updateVis();
		});
	}

	/**
	 * highlights a heatmap-circle chart's circle that corresponds to the dot (if available) when a dot is clicked
	 * @param dotClicked is the dot that was clicked.
	 */
	static highlightHeatMapCircleData(dotClicked) {
		heatMapCircleChart.highlightedData = [dotClicked];
		heatMapCircleChart.updateVis();
	}

	/**
	 * highlights a heatmap cell that corresponds to the dot (if available) when a dot is clicked
	 * @param dotClicked is the dot that was clicked.
	 */
	static highlightHeatMapData(dotClicked) {
		heatMap.highlightedData = [dotClicked];
		heatMap.updateVis();
	}

	/**
	 * highlights a treemap rect that corresponds to the dot (if available) when a dot is clicked
	 * @param dotClicked is the dot that was clicked.
	 */
	static highlightTreeMapData(dotClicked) {
		treeMap.highlightedData = [dotClicked];
		treeMap.render();
	}
}
