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
  var HdrF = new Float32Array(ab.slice(0,280));
  // Integer
  // 15 words, 32 bits per word / 8 bits per byte
  var HdrN = new Int32Array(ab.slice(280, 340));
  // Enumerated
  // 20 words, 32 bits per word / 8 bits per byte
  var HdrI = new Int32Array(ab.slice(340, 420));
  // Logical
  // 5 words, 32 bits per word / 8 bits per byte
  var HdrL = new Int32Array(ab.slice(420, 440));
  // Alphanumeric
  // 48 words, 32 bits per word / 8 bits per byte
  var HdrK = new Int32Array(ab.slice(440, 632));

  // ACTUAL DATA
  // the rest of the file
  var data = new Float32Array(ab.slice(632, ab.length));

  // for debugging purposes
  // console.log("HdrF: ", HdrF);
  // console.log("HdrI: ", HdrI);
  // console.log("HdrL: ", HdrL);
  // console.log("HdrK: ", HdrK);
  // console.log("data: ", data);

  // parsed header variables
  var DELTA = HdrF[0];
  var B     = HdrF[5];
  var STLA  = HdrF[32];
  var STLO  = HdrF[33];
  var STDP  = HdrF[34];
  var NPTS  = HdrN[9];
  var IDEP  = HdrI[1];

  // resolve the enumerated arrays
  var IDEPr

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
  var plotData = [];

  // create plotting rows
  for (var i = 0; i < 200; i++) {
    var row = [];
    row.push(B + DELTA * i);
    row.push(data[i]);
    plotData.push(row);
  }

  // makes the plot
  google.charts.setOnLoadCallback(drawChart(plotData, IDEPr));
}

// draw chart
google.charts.load('current', {'packages':['corechart']});

function drawChart(sacData, IDEPr) {
  var data = google.visualization.arrayToDataTable([
    ['', ''],
    [0,  0]
  ]);

  data.addRows(sacData);

  // set up chart
  var options = {

    title: 'Float Name',

    hAxis: {
      title: 'time (s)'
    },
    vAxis: {
      title: IDEPr
    },

    curveType: 'function',
    legend: { position: 'none' }

  };

  var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

  chart.draw(data, options);
}
