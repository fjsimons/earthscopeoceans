/**
 SAC file class
 @author Jonah Rubin
 11/19/18
 */

// https://ds.iris.edu/files/sac-manual/manual.html

function SacFile(sacArrayBuffer) {

    // split arraybuffer section by:
    // number of words * number of bits per word / number of bits per byte

    // HEADER

    // 70 words, 32 bits per word / 8 bits per byte
    // Floating points
    // switched from ab to sacArrayBuffer
    let HdrF = new Float32Array(sacArrayBuffer.slice(0, 280));
    // Integer
    // 15 words, 32 bits per word / 8 bits per byte
    let HdrN = new Int32Array(sacArrayBuffer.slice(280, 340));
    // Enumerated
    // 20 words, 32 bits per word / 8 bits per byte
    let HdrI = new Int32Array(sacArrayBuffer.slice(340, 420));
    // Logical
    // 5 words, 32 bits per word / 8 bits per byte
    let HdrL = new Int32Array(sacArrayBuffer.slice(420, 440));
    // Alphanumeric
    // 48 words, 32 bits per word / 8 bits per byte
    let HdrK = new Int32Array(sacArrayBuffer.slice(440, 632));

    // ACTUAL DATA
    // the rest of the file
    let data = new Float32Array(sacArrayBuffer.slice(632, sacArrayBuffer.length));

    // for debugging purposes
    console.log("HdrF: ", HdrF);
    console.log("HdrI: ", HdrI);
    console.log("HdrL: ", HdrL);
    console.log("HdrK: ", HdrK);
    console.log("data: ", data);

    // parsed header letiables
    let DELTA = HdrF[0];
    let B = HdrF[5];
    let STLA = HdrF[32];
    let STLO = HdrF[33];
    let STDP = HdrF[34];
    let NPTS = HdrN[9];
    let IDEP = HdrI[1];

    // resolve the enumerated arrays
    let IDEPr;

    switch (IDEP) {
        case 5 :
            IDEPr = "unknown";
            break;
        case 6 :
            IDEPr = "displacement";
            break;
        case 7 :
            IDEPr = "velocity";
            break;
        case 8 :
            IDEPr = "acceleration";
            break;
        case 50:
            IDEPr = "volts";
            break;
        default:
            IDEPr = IDEP;
    }

    console.log("IDEP: ", IDEP);
    console.log("IDEPr: ", IDEPr);

    // check that data.length equals NPTS

    // make data pairs
    let plotData = [];

    // create plotting rows
    for (let i = 0; i < 200; i++) {
        let row = [];
        row.push(B + DELTA * i);
        row.push(data[i]);
        plotData.push(row);
    }

    // makes the plot
    // google.charts.setOnLoadCallback(drawChart(plotData, IDEPr));
}

// draw chart
// google.charts.load('current', {'packages': ['corechart']});

function drawChart(sacData, IDEPr) {
    let data = google.visualization.arrayToDataTable([
        ['', ''],
        [0, 0]
    ]);

    data.addRows(sacData);

    // set up chart
    let options = {

        title: 'Float Name',

        hAxis: {
            title: 'time (s)'
        },
        vAxis: {
            title: IDEPr
        },

        curveType: 'function',
        legend: {position: 'none'}

    };

    let chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

    chart.draw(data, options);
}
