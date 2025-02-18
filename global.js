// main configuration
const body_width = 270;  
const body_height = 540; 
const pointSize = 12; 
const hoverRadius = 20; 
let processedData = [];


let selectedSex = 'all';
let selectedLocation = null;
let clickedLocation;
let totalCases = 0;
let maxCount = 0; // Store the maximum count across all possible filters


// button for gender

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

// get tooltip element
const tooltip = d3.select("#tooltip");


//Converted to relative position
const points = [
    { id: 1, xRatio: 0.5, yRatio: 0.53, name: "Colorectal" },  
    { id: 2, xRatio: 0.5, yRatio: 0.40, name: "Stomach" },     
    { id: 3, xRatio: 0.55, yRatio: 0.45, name: "Biliary/Pancreas" },  
    { id: 4, xRatio: 0.55, yRatio: 0.35, name: "Vascular" },    
    { id: 5, xRatio: 0.43, yRatio: 0.30, name: "Breast" },     
    { id: 6, xRatio: 0.40, yRatio: 0.38, name: "Hepatic" },     
    { id: 7, xRatio: 0.5, yRatio: 0.23, name: "Thyroid" }      
];


// tracking for selected points
const selectedPoints = new Set();
let activePoint = null;

// create SVG for silhouette
let body_svg;

function silhouette_img(){
    body_svg = d3.select("#silhouette")
    .append("svg")
    .attr("width", body_width)
    .attr("height", body_height);

    body_svg.append("image")
    .attr("href", "images/male_figure.png") // path to  silhouette image --> WOULD NEED A VARIABLE TO CHANGE
    .attr("width", body_width)
    .attr("height", body_height)
    .attr("preserveAspectRatio", "xMidYMid meet");
}

let diamonds;

function diamond_func() {
    diamonds = body_svg.selectAll(".point")
    .data(points)
    .enter()
    .append("path")
    .attr("class", "point")
    .attr("d", d => {
        return `M${d.x},${d.y-pointSize} L${d.x+pointSize},${d.y} L${d.x},${d.y+pointSize} L${d.x-pointSize},${d.y} Z`;
    })
    .attr("fill", "#000000") // black by default
    .attr("stroke", "#444444")
    .attr("stroke-width", 1.5);
}

let hoverAreas;

function hoverfunc(data) {
// larger area for easier hovering
 hoverAreas = body_svg.selectAll(".hover-area")
    .data(points)
    .enter()
    .append("circle")
    .attr("class", "hover-area")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", hoverRadius)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .on("mouseover", function(event, d) {
        // change color if this isn't the active point
        if (activePoint !== d.id) {
            d3.select(diamonds.nodes()[d.id-1])
                .attr("fill", "#FF0000")
                .attr("stroke", "#CC0000");
        }

        selectedLocation = d.name;
         // show tooltip regardless
         tooltip
         .style("opacity", 1)
         .html(d.name)
         .style("left", (d.x + 15) + "px")
         .style("top", (d.y - 15) + "px");
        //dynamically change histogram and aggregates
        create_graph(data);
        
    })
    .on("mouseout", function(event, d) {
        // reset to black if not the active point
        if (activePoint !== d.id) {
            d3.select(diamonds.nodes()[d.id-1])
                .attr("fill", "#000000")
                .attr("stroke", "#444444");
        } else {
            // if active point, ensure it stays red
            d3.select(diamonds.nodes()[d.id-1])
            .attr("fill", "#FF0000")
            .attr("stroke", "#CC0000");
        }

         // show tooltip regardless
         if (clickedLocation) {
            tooltip
            .style("opacity", 1)
            .html(clickedLocation)
            .style("left", (d.x + 15) + "px")
            .style("top", (d.y - 15) + "px");
            selectedLocation = clickedLocation;
            create_graph(data);
         } else {
            tooltip.style("opacity", 1)
            .html('Select a Diamond')
            .style("left", (d.x + 15) + "px")
            .style("top", (d.y - 15) + "px");;
            selectedLocation = null;
            create_graph(data);
         }

    })
    .on("click", function(event, d) {
        // if clicking on the currently active point, deselect it
        if (activePoint === d.id) {
            // reset its color to black
            d3.select(diamonds.nodes()[d.id-1])
                .attr("fill", "#000000")
                .attr("stroke", "#444444");

            // clear the active point and plot
            activePoint = null;
            clickedLocation = null;
            tooltip.style("opacity", 1)
            .html("Select a Diamond")
            .style("left", (d.x + 15) + "px")
            .style("top", (d.y - 15) + "px");;

            clearPlot();
    } else {
        // if there's already an active point, reset its color
        if (activePoint !== null) {
            d3.select(diamonds.nodes()[activePoint-1])
                .attr("fill", "#000000")
                .attr("stroke", "#444444");
            clickedLocation = null;
            tooltip.style("opacity", 1)
            .html("Select a Diamond")
            .style("left", (d.x + 15) + "px")
            .style("top", (d.y - 15) + "px");;
        }

        // set this as the new active point
        activePoint = d.id;

        // change its color to red
        d3.select(diamonds.nodes()[d.id-1])
            .attr("fill", "#FF0000")
            .attr("stroke", "#CC0000");

        clickedLocation = d.name;
        tooltip
        .style("opacity", 1)
        .html(clickedLocation)
        .style("left", (d.x + 15) + "px")
        .style("top", (d.y - 15) + "px");

        // show its plot
        showPlot(d);
    }
});
}

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

 const svg = d3.select("#chart")
 .append("svg")
 .attr("width", width + margin.left + margin.right)
 .attr("height", height + margin.top + margin.bottom)
 .append("g")
 .attr("transform", `translate(${margin.left},${margin.top})`);

 const svg2 = d3.select("#aggregation_data")

// function to show plot for a point --> PLACEHOLDER
function showPlot(point) {
    const plotContainer = d3.select("#plot");
    
    // clear previous plot content
    plotContainer.html("");
    
    // create SVG for the plot
    const plotSvg = plotContainer.append("svg")
        .attr("width", 800)
        .attr("height", 500);
    
    // add placeholder text --> TO CHANGE
    plotSvg.append("text")
        .attr("x", 250)
        .attr("y", 400)
        .attr("text-anchor", "middle")
        .text(`${point.name} Condition Detail`);
    
    // CALL PLOTTING FUNCTION HERE
    // plotFunction(point.id, plotSvg);
}


// function to clear the plot
function clearPlot() {
    d3.select("#plot").html('<p id="plot-message">Click on a point to see details</p>');
}

 function show_body(gender) {
    console.log("Showing new gender:");
    console.log(gender);
    d3.select("#silhouette image")  // Select existing body image inside SVG
        .attr("href", `./images/final_${gender}_figure.png`)
        .attr('alt', 'A figure of the human body')
        .attr('height', body_height)
        .attr('width', body_width);
    repositionDiamonds(); // Adjusts diamonds to new image
}

function repositionDiamonds() {
    diamonds.attr("d", d => {
        let x = d.xRatio * body_width;
        let y = d.yRatio * body_height;
        return `M${x},${y-pointSize} L${x+pointSize},${y} L${x},${y+pointSize} L${x-pointSize},${y} Z`;
    });

    hoverAreas
        .attr("cx", d => d.xRatio * body_width)
        .attr("cy", d => d.yRatio * body_height);
}


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

 let statsGroup;

 function create_graph(data) {
     totalCases = data.length;
     
     let filteredData = data;
     
     if (selectedSex !== 'all') {
         filteredData = filteredData.filter(d => d.sex === selectedSex[0].toUpperCase());
     }

     const genderTotal = filteredData.length;
    //  filteredData.forEach(d => console.log(d.department));
     
     if (selectedLocation) {
         filteredData = filteredData.filter(d => d.optype === selectedLocation);
     }

     console.log(selectedLocation)
     
     const histogram = bins.map(bin => ({
         binRange: bin.label,
         count: filteredData.filter(d => d.stayDays >= bin.min && d.stayDays <= bin.max).length
     }));

     const average = d3.mean(filteredData, d => d.stayDays);
     const filteredTotal = filteredData.length;
     const percentage = ((filteredTotal / totalCases) * 100).toFixed(1);
     const gender_pct = ((filteredTotal/genderTotal) * 100).toFixed(1);

     const x = d3.scaleBand()
         .range([0, width])
         .domain(bins.map(d => d.label))
         .padding(0.1);

     const y = d3.scaleLinear()
         .range([height, 0])
         .domain([0, maxCount])
         .nice();

     svg.selectAll("*").remove();
     svg2.selectAll("*").remove();

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
         

    statsGroup = svg2.append("g")
        .attr("id", "aggregates")
         .attr("transform", `translate(${width + 10}, 20)`);

     statsGroup.append("p")
         .attr("class", "stats-label")
         .attr("y", 0)
         .text(`Average: ${average.toFixed(1)} days`);

     statsGroup.append("p")
         .attr("class", "stats-label")
         .attr("y", 25)
         .text(`Total Count: ${filteredTotal}`);

     statsGroup.append("p")
         .attr("class", "stats-label")
         .attr("y", 50)
         .text(`${percentage}% of all cases`);

    if (selectedSex !== 'all') {
        statsGroup.append("p")
        .attr("class", "stats-label")
        .attr("y", 75)
        .text(`${gender_pct}% of ${selectedSex} cases`);
    }
     
 }

  // Load data and initialize
  d3.csv("clinical_info.csv").then(data => {
    processedData = processCsvData(data);
    maxCount = calculateMaxCount(processedData); // Calculate global maximum
    create_graph(processedData);

    // Add click event listeners to buttons
    filterButtons.on('click', function(event, d) {
        selectedSex = d.value;
        filterButtons.classed('selected', btn => btn.value === selectedSex);
        create_graph(processedData);
        show_body(selectedSex);
    });

    tooltip.style("opacity", 1)
    .html("Select a Diamond");
    
    silhouette_img();
    diamond_func();
    hoverfunc(processedData);
    show_body(selectedSex);

});

