// Global objects
let data,
	originalData,
	heatMap,
	dotMatrix,
	heatMapCircleChart,
	treeMap,
	barChart,
	miniBarCharts;

// Initialize dispatcher that is used to orchestrate events
const dispatcher = d3.dispatch(
	'viewmode-dispatch',
	'treemapClick',
	'highlightTreeMap'
);

const dispatcher_heatmap = d3.dispatch('filterCourseAge');

/**
 * Load data from CSV file asynchronously and render chart
 */
d3.csv('data/students_mental_health_survey.csv')
	.then((_data) => {
		data = _data;

		// data preprocessing
		data.forEach((d) => {
			d.Age = +d.Age;
			d.CGPA = +d.CGPA;
			d.Stress_Level = +d.Stress_Level;
			d.Depression_Score = +d.Depression_Score;
			d.Anxiety_Score = +d.Anxiety_Score;
			d.Financial_Stress = +d.Financial_Stress;
			d.Sleep_Quality = DataProcessor.normalize_scale(
				d.Sleep_Quality
			);
			d.Physical_Activity = DataProcessor.normalize_scale(
				d.Physical_Activity
			);
			d.Diet_Quality = DataProcessor.normalize_scale(
				d.Diet_Quality
			);
			d.Social_Support = DataProcessor.normalize_scale(
				d.Social_Support
			);
			d.Extracurricular_Involvement =
				DataProcessor.normalize_scale(
					d.Extracurricular_Involvement
				);
		});

		// filter the data for age and CGPA
		data = data.filter(
			(d) => d.Age >= 18 && d.Age <= 24 && d.CGPA != 0
		);

		// delete unrelated attributes
		data.forEach((d) => {
			for (const attr of DataProcessor.attributesToHide) {
				delete d[attr];
			}
		});

		originalData = data;

		// initialize views
		dotMatrix = new DotMatrix(
			{ parentElement: '#dot-matrix' },
			data
		);

		heatMap = new HeatMap(
			{ parentElement: '#heat-map' },
			dispatcher_heatmap,
			data
		);

		// heatmap - minibar-chart
		heatMapCircleChart = new HeatMapCircleChart(
			{ parentElement: '#heatmap-circle-chart' },
			DataProcessor.calculateCourseAttributeCounts(data)
		);
		initHeatmapMiniBarChart(data);
		handleHeatMapBarChartDispatch(
			document.querySelector(
				'input[type=radio][name="view"]:checked'
			).value
		);

		treeMap = new TreeMap(
			{
				parentElement: '#tree-mapping',
			},
			data
		);

		barChart = new BarChart(
			{ parentElement: '#bar-chart' },
			data
		);

		heatMap.updateVis();

		barChart.updateVis();

		treeMap.render();
	})
	.catch((error) => console.error(error));

/**
 * initiate heatmap mini-barcharts given different well-being indicators and levels
 * @param data is the data that was filtered by other views.
 */
function initHeatmapMiniBarChart(data) {
	miniBarCharts = [];
	DataProcessor.wellBeingLevels.forEach((level) => {
		DataProcessor.wellBeingIndicators.forEach((indicator) => {
			const shortName =
				DataProcessor.shortenIndicatorName(indicator);
			const selector = `#mini-bar-chart-${level.toLowerCase()}-${shortName}`;
			const chart = new MiniBarChart(
				{ parentElement: selector },
				DataProcessor.calculateCourseAttributeCounts(data),
				indicator,
				level
			);
			miniBarCharts.push(chart);
		});
	});
	miniBarCharts.forEach((chart) => chart.updateVis());
}

/**
 * clear all selected dots and cells
 */
function clearAllInteractions() {
	dotMatrix.highlightedData = [];
	dotMatrix.clickedDot = [];

	barChart.highlightedData = [];
	barChart.data = originalData;

	miniBarCharts.forEach((chart) => {
		chart.data =
			DataProcessor.calculateCourseAttributeCounts(
				originalData
			);
		chart.highlightedData = [];
		chart.updateVis();
	});
	heatMapCircleChart.highlightedData = [];
	heatMap.highlightedData = [];
	treeMap.highlightedData = [];
	treeMap.unhighlightArea();
	treeMap.updateData(originalData);

	dotMatrix.updateVis();
	barChart.updateVis();
	heatMapCircleChart.updateVis();
	heatMap.updateVis();
}

/* Radio Button for heatmap-minibars */
// Handle radio button change event
document.querySelectorAll('input[name="view"]').forEach((radio) => {
	radio.addEventListener('change', handleViewModeChange);
});

let lastUpdated = null;

// Dispatcher event handling with treemap click
dispatcher.on('treemapClick', (data) => {
	if (lastUpdated !== 'heatmap') {
		barChart.updateData(data);
		barChart.updateVis();

		lastUpdated = 'treemap';
	}
});

dispatcher.on('highlightTreeMap', (data) => {
	treeMap.unhighlightArea();
	treeMap.highlightArea(data);
});

// Dispatcher event handling with different logic
dispatcher.on('viewmode-dispatch', handleHeatMapBarChartDispatch);

function handleHeatMapBarChartDispatch(viewmode) {
	DataProcessor.selectedView = viewmode;
	// if no course is selected, assume the default setting is all courses being selected
	if (DataProcessor.selectedCourses.length === 0) {
		DataProcessor.selectedCourses = [
			'Business',
			'Computer Science',
			'Engineering',
			'Law',
			'Medical',
			'Others',
		];
	}
	heatMapCircleChart.view = DataProcessor.selectedView;
	heatMapCircleChart.selectedCourses =
		DataProcessor.selectedCourses;
	heatMapCircleChart.updateVis();

	miniBarCharts.forEach((chart) => {
		chart.selectedCourses = DataProcessor.selectedCourses;
		chart.updateVis();
	});
}

/**
 * switch between the heatmap-circle and heatmap-minibar view
 * @param event is the event triggered by radio button.
 */
function handleViewModeChange(event) {
	DataProcessor.selectedView = event.target.value;

	// Check the selected view mode and show/hide elements accordingly
	if (DataProcessor.selectedView === 'Overall') {
		// Hide elements for the 'Overall' view
		document.getElementById('mini-bar-container').style.display =
			'none';
		document.getElementById(
			'heatmap-circle-chart'
		).style.display = 'block';
	} else {
		// Show elements for other view modes
		document.getElementById('mini-bar-container').style.display =
			'block';
		document.getElementById(
			'heatmap-circle-chart'
		).style.display = 'none';
	}

	dispatcher.call(
		'viewmode-dispatch',
		event,
		DataProcessor.selectedView
	);
}

dispatcher_heatmap.on('filterCourseAge', (selectedCourseAges) => {
	if (selectedCourseAges.length === 0) {
		selectedCourseAges = data;
	}

	heatMapCircleChart.data =
		DataProcessor.calculateCourseAttributeCounts(
			selectedCourseAges
		);
	heatMapCircleChart.updateVis();

	miniBarCharts.forEach((chart) => {
		chart.data = DataProcessor.calculateCourseAttributeCounts(
			selectedCourseAges
		);
		return chart.updateVis();
	});

	barChart.data = selectedCourseAges;
	barChart.updateVis();

	treeMap.updateData(selectedCourseAges)
	treeMap.deselect();

	dotMatrix.highlightedData = selectedCourseAges;
	dotMatrix.updateVis();
});
