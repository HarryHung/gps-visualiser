// Convert from https://observablehq.com/@kerryrodden/sequences-sunburst


async function sunburst(country, type, ageGroup, periods, data, domainRange){
    // Prepare clean slate for charts
    let serotypeDiv = document.querySelector('#country-view-serotype');
    serotypeDiv.innerHTML = '';

    // Reset selectors
    let serotypeSelect = document.querySelector('#serotype-select');
    serotypeSelect.innerHTML = '<option value="all">All</option>';

    let lineageSelect = document.querySelector('#lineage-select');
    lineageSelect.innerHTML = '<option value="all">All</option>';

    // Record paths in all charts
    let paths = new Set();

    // Draw sunburst charts for all periods
    for (let index = 0; index < periods.length; index++) {
        const period = periods[index];

        let periodContainer = document.createElement('div');
        periodContainer.classList.add('modal-period-container');

        let sunburstId = `country-${country}-${type}-${ageGroup}-${index}`;
        
        let sunburstDiv = document.createElement('div');
        sunburstDiv.classList.add('sunburst');
        sunburstDiv.id = sunburstId;
        periodContainer.append(sunburstDiv);

        let periodDiv = document.createElement('div');
        periodDiv.innerHTML = `<h2 style="margin: 5px;">${period[1]}</h2>`;
        periodContainer.append(periodDiv);

        let yearDiv = document.createElement('div');
        yearDiv.innerHTML = `<h3 class="unbold" style="margin: 5px;">(${period[0]})</h3>`;
        periodContainer.append(yearDiv);

        serotypeDiv.append(periodContainer);

        await drawSunburst(data[`period${index}`], `#${sunburstId}`, domainRange, paths);

        
        // Add the separator if this is not the last period
        if (index < periods.length - 1) {
            let separatorContainer = document.createElement('div');
            separatorContainer.classList.add('separator-container')

            let arrowDiv = document.createElement('div');
            arrowDiv.innerHTML = `<p style="font-size: 3em; margin: 5px;">🠖</p>`;
            separatorContainer.append(arrowDiv);

            let vaccineDiv = document.createElement('div');
            vaccineDiv.innerHTML = `<p style="margin: 0px 0px 50px 0px;">${periods[index + 1][1].slice(5)}</p>`;
            separatorContainer.append(vaccineDiv);

            serotypeDiv.append(separatorContainer);
        }
    }

    // Add serotypes and lineages to selects' options based on recorded Paths
    let serotypes = new Set();
    let lineages = new Set();
    paths.forEach(path => {
        path = path.split('-');
        if (path.length === 1) {
            serotypes.add(path[0].split('_')[1]);
        } else {
            lineages.add(path[1].split('_')[1]);
        }
    });
    serotypes = Array.from(serotypes).sort();
    lineages = Array.from(lineages).sort();

    serotypes.forEach(serotype => {
        let option = document.createElement('option');
        option.setAttribute('value', serotype);
        option.innerHTML = serotype;
        serotypeSelect.appendChild(option);
    });

    lineages.forEach(lineage => {
        let option = document.createElement('option');
        option.setAttribute('value', lineage);
        option.innerHTML = lineage;
        lineageSelect.appendChild(option);
    });

    serotypeSelect.addEventListener('change', function() {
        let paths = serotypeDiv.querySelectorAll('path');
        paths.forEach(path => {
            pathData = path.getAttribute('data-path').split('-');
            if (pathData.length === 1) {
                if (this.value === 'all') {
                    path.classList.remove('hidden');
                } else {
                    if (pathData[0].split('_')[1] === this.value) {
                        path.classList.remove('hidden');
                    } else {
                        path.classList.add('hidden');
                    }
                }            
            }
        });
    });

    lineageSelect.addEventListener('change', function() {
        let paths = serotypeDiv.querySelectorAll('path');
        paths.forEach(path => {
            pathData = path.getAttribute('data-path').split('-');
            if (pathData.length === 2) {
                if (this.value === 'all') {
                    path.classList.remove('hidden');
                } else {
                    if (pathData[1].split('_')[1] === this.value) {
                        path.classList.remove('hidden');
                    } else {
                        path.classList.add('hidden');
                    }
                }            
            }
        });
    });


    // Add mouse over and mouse out events to charts
    let charts = document.querySelectorAll('.sunburst');

    charts.forEach(chart => {
        let path = document.querySelector('#country-view-readout');

        // Update chart visual, absolute, percentage and path output
        chart.addEventListener('mouseover', (e) => {
            if (e.target instanceof SVGPathElement) {
                let dataPath = e.target.getAttribute('data-path');
                path.innerHTML = dataPath.replaceAll('_', ' ').replaceAll('-', ' > ');
                path.classList.add('bold')

                // Highlight same path in all charts, update absolute and percentage
                charts.forEach(chart => {
                    let percentage = chart.querySelector('.percentage');
                    let absolute = chart.querySelector('.absolute');

                    let rValue = chart.childNodes[0].getAttribute('data-rValue');
                    
                    let selectedPath = chart.querySelector(`[data-path='${dataPath}']`);
                    if (selectedPath) {
                        selectedPath.setAttribute('fill-opacity', '1.0');

                        let dValue = selectedPath.getAttribute('data-dValue');
                        percentage.innerHTML = `${((100 * dValue) / rValue).toPrecision(3)}%`;
                        absolute.innerHTML = `${dValue} / ${rValue}`;

                        // If path is child, highlight parent as well
                        let pathArray = dataPath.split('-');
                        if (pathArray.length === 2) {
                            let selectedParent = chart.querySelector(`[data-path='${pathArray[0]}']`);
                            selectedParent.setAttribute('fill-opacity', '1.0');
                        }
                    } else {
                        percentage.innerHTML = '0%';
                        absolute.innerHTML = `0 / ${rValue}`;
                    }
                    
                });
            }
        });


        // Reset chart absolute, percentage and path output
        chart.addEventListener('mouseout', (e) => {
            let dataPath = e.target.getAttribute('data-path');
            path.innerHTML = 'Select a Serotype or Lineage';
            path.classList.remove('bold')

            // Reset same path in all charts, reset absolute and percentage
            charts.forEach(chart => {
                let percentage = chart.querySelector('.percentage');
                let absolute = chart.querySelector('.absolute');

                let rValue = chart.childNodes[0].getAttribute('data-rValue');
                
                percentage.innerHTML = '--%';
                absolute.innerHTML = `-- / ${rValue}`;
                
                let selectedPath = chart.querySelector(`[data-path='${dataPath}']`);
                if (selectedPath) {
                    selectedPath.setAttribute('fill-opacity', '0.3');

                    // If path is child, reset parent as well
                    let pathArray = dataPath.split('-');
                    if (pathArray.length === 2) {
                        let selectedParent = chart.querySelector(`[data-path='${pathArray[0]}']`);
                        selectedParent.setAttribute('fill-opacity', '0.3');
                    }
                }
            });
        });
    });
}


async function drawSunburst(data, target, domainRange, paths) {
    const hierarchyData = buildHierarchy(data);

    let width = 640;
    let radius = width / 2;
  
    let partition = data =>
    d3.partition().size([2 * Math.PI, radius * radius])(
        d3
            .hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value)
    );

    // Set color here, can be set to name specific color
    // Arrays to be dynamically generated by back-end
    let color = d3
        .scaleOrdinal()
        .domain(domainRange["domain"])
        .range(domainRange["range"]);

    let arc = d3
        .arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(1 / radius)
        .padRadius(radius)
        .innerRadius(d => Math.sqrt(d.y0))
        .outerRadius(d => Math.sqrt(d.y1) - 1);

    let mousearc = d3
        .arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => Math.sqrt(d.y0))
        .outerRadius(radius);
  
    const chart = await (() => {
        const root = partition(hierarchyData);
        const svg = d3.create("svg");
        const element = svg.node();

        const label = svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "#000");
    
        label
            .append("tspan")
            .attr("class", "percentage")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "-0.1em")
            .attr("font-size", "4em")
            .text("--%");
    
        label
            .append("tspan")
            .attr("class", "absolute")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "1.5em")
            .attr("font-size", "2em")
            .text(`-- / ${root.value}`);
    
        svg
            .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
            .style("width", '20vw')
            .style("max-width", '50vh')
            .style("font", "12px sans-serif")
            .attr('data-rValue', `${root.value}`);
    
        const path = svg
            .append("g")
            .selectAll("path")
            .data(
                root.descendants().filter(d => {
                    // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
                    return d.depth && d.x1 - d.x0 > 0.001;
                })
            )
            .join("path")
            .attr("fill", d => color(d.data.name))
            .attr("fill-opacity", 0.3)
            .attr("d", arc)
            .attr('data-path', d => {
                const sequence = d
                    .ancestors()
                    .reverse()
                    .slice(1);

                const output = [];
                    sequence.forEach(node => {
                        output.push(node.data.name)
                    });
                
                const path = output.join('-').replaceAll(' ','_');
                // Record path to paths set
                paths.add(path);

                return `${path}`;
            })
            .attr('data-dValue', d => `${d.value}`);
        return element;
    })();
    document.querySelector(target).appendChild(chart);
}


// Helper function that transforms the given CSV into a hierarchical format.
function buildHierarchy(data) {
    const root = { name: "root", children: [] };
    for (let i = 0; i < data.length; i++) {
        const sequence = data[i][0];
        const size = +data[i][1];
        if (isNaN(size)) {
            // e.g. if this is a header row
            continue;
        }
        const parts = sequence.split("-");
        let currentNode = root;
        for (let j = 0; j < parts.length; j++) {
            const children = currentNode["children"];
            const nodeName = parts[j];
            let childNode = null;
            if (j + 1 < parts.length) {
            // Not yet at the end of the sequence; move down the tree.
            let foundChild = false;
            for (let k = 0; k < children.length; k++) {
                if (children[k]["name"] == nodeName) {
                childNode = children[k];
                foundChild = true;
                break;
                }
            }
            // If we don't already have a child node for this branch, create it.
            if (!foundChild) {
                childNode = { name: nodeName, children: [] };
                children.push(childNode);
            }
            currentNode = childNode;
            } else {
            // Reached the end of the sequence; create a leaf node.
            childNode = { name: nodeName, value: size };
            children.push(childNode);
            }
        }
    }
    return root;
}