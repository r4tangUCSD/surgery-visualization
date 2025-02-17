console.log('IT’S ALIVE!');

 // Configuration with increased margins for axis labels
 const margin = {top: 20, right: 180, bottom: 60, left: 80};
 const width = 800 - margin.left - margin.right;
 const height = 400 - margin.top - margin.bottom;
 
 // Define bins
 const bins = [
     { label: '0-1', min: 0, max: 1 },
     { label: '2-3', min: 2, max: 3 },
     { label: '4-5', min: 4, max: 5 },
     { label: '6-7', min: 6, max: 7 },
     { label: '8-9', min: 8, max: 9 },
     { label: '10-11', min: 10, max: 11 },
     { label: '12-13', min: 12, max: 13 },
     { label: '14+', min: 14, max: Infinity }
 ];

 const colorMap = {
     'all': '#a6a6a6',
     'female': '#ffaafa',
     'male': '#9bd5ec'
 };

 const buttons = [
     { id: 'all-button', text: 'All', value: 'all' },
     { id: 'female-button', text: 'Female', value: 'female' },
     { id: 'male-button', text: 'Male', value: 'male' }
 ];

 let selectedSex = 'all';
 let selectedLocation = null;
 let totalCases = 0;
 let maxCount = 0; // Store the maximum count across all possible filters

 function show_body(gender) {
    const body_image = d3.select('#body');
    body_image.selectAll('*').remove();
    body_image.append('img')
    .attr('src', `./images/${gender}_figure.png`)
    .attr('alt', 'Description of image')
    .attr('height', 600)
    .attr('width', 900);
 }
 
 show_body(selectedSex);
 
 const svg = d3.select("#chart")
     .append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
     .append("g")
     .attr("transform", `translate(${margin.left},${margin.top})`);

 const buttonContainer = d3.select('.button-container');
 
 const filterButtons = buttonContainer
     .selectAll('.filter-button')
     .data(buttons)
     .enter()
     .append('button')
     .attr('id', d => d.id)
     .attr('class', 'filter-button')
     .classed('selected', d => d.value === selectedSex)
     .text(d => d.text);

 function processCsvData(data) {
     return data.map(d => {
         const admSeconds = +d.adm;
         const disSeconds = +d.dis;
         const stayDays = Math.floor((disSeconds - admSeconds) / (24 * 60 * 60));
         return {
             ...d,
             stayDays: stayDays
         };
     });
 }

 // Function to calculate maximum count across all possible combinations
 function calculateMaxCount(data) {
     const allCombinations = [
         data, // all
         data.filter(d => d.sex === 'M'), // male
         data.filter(d => d.sex === 'F'), // female
     ];

     // Add combinations for each optype
     const optypes = [...new Set(data.map(d => d.optype))];
     optypes.forEach(optype => {
         allCombinations.push(data.filter(d => d.optype === optype));
     });

     let globalMax = 0;
     allCombinations.forEach(subset => {
         const histogramData = bins.map(bin => ({
             count: subset.filter(d => d.stayDays >= bin.min && d.stayDays <= bin.max).length
         }));
         const maxForSubset = d3.max(histogramData, d => d.count);
         globalMax = Math.max(globalMax, maxForSubset);
     });

     return globalMax;
 }

 function create_graph(data) {
     totalCases = data.length;
     
     let filteredData = data;
     if (selectedSex !== 'all') {
         filteredData = filteredData.filter(d => d.sex === selectedSex[0].toUpperCase());
     }
     if (selectedLocation) {
         filteredData = filteredData.filter(d => d.department === selectedLocation);
     }

     const histogram = bins.map(bin => ({
         binRange: bin.label,
         count: filteredData.filter(d => d.stayDays >= bin.min && d.stayDays <= bin.max).length
     }));

     const average = d3.mean(filteredData, d => d.stayDays);
     const filteredTotal = filteredData.length;
     const percentage = ((filteredTotal / totalCases) * 100).toFixed(1);

     const x = d3.scaleBand()
         .range([0, width])
         .domain(bins.map(d => d.label))
         .padding(0.1);

     const y = d3.scaleLinear()
         .range([height, 0])
         .domain([0, maxCount])
         .nice();

     svg.selectAll("*").remove();

     // Add X axis with more space for label
     const xAxis = svg.append("g")
         .attr("transform", `translate(0,${height})`)
         .call(d3.axisBottom(x));

     xAxis.append("text")
         .attr("class", "axis-label")
         .attr("x", width / 2)
         .attr("y", 45)
         .style("text-anchor", "middle")
         .text("Length of Stay (Days)");

     // Add Y axis with more space for label
     const yAxis = svg.append("g")
         .call(d3.axisLeft(y));

     yAxis.append("text")
         .attr("class", "axis-label")
         .attr("transform", "rotate(-90)")
         .attr("y", -60)
         .attr("x", -height / 2)
         .style("text-anchor", "middle")
         .text("Number of Patients");

     svg.selectAll("rect")
         .data(histogram)
         .enter()
         .append("rect")
         .attr("x", d => x(d.binRange))
         .attr("y", d => y(d.count))
         .attr("width", x.bandwidth())
         .attr("height", d => height - y(d.count))
         .attr("fill", colorMap[selectedSex]);

     const statsGroup = svg.append("g")
         .attr("transform", `translate(${width + 10}, 20)`);

     statsGroup.append("text")
         .attr("class", "stats-label")
         .attr("y", 0)
         .text(`Average: ${average.toFixed(1)} days`);

     statsGroup.append("text")
         .attr("class", "stats-label")
         .attr("y", 25)
         .text(`Total Count: ${filteredTotal}`);

     statsGroup.append("text")
         .attr("class", "stats-label")
         .attr("y", 50)
         .text(`(${percentage}% of all cases)`);
 }

 // Load data and initialize
 d3.csv("clinical_info.csv").then(data => {
     const processedData = processCsvData(data);
     maxCount = calculateMaxCount(processedData); // Calculate global maximum
     create_graph(processedData);

     // Add click event listeners to buttons
     filterButtons.on('click', function(event, d) {
         selectedSex = d.value;
         filterButtons.classed('selected', btn => btn.value === selectedSex);
         create_graph(processedData);
         show_body(selectedSex);
     });
 });