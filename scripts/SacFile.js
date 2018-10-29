/**
	SAC file class
	@author Jonah Rubin
	10/29/18
*/

function SacFile(sacArrayBuffer) {

  // split arraybuffer section by:
  // number of words * number of bits per word / number of bits per byte

  // 70 words, 32 bits per word / 8 bits per byte
  var floats = new Float32Array(ab.slice(0,280));

  // 35 words, 32 bits per word / 8 bits per byte
  var enumerated = new Int32Array(ab.slice(280, 420));

  // 5 words, 32 bits per word / 8 bits per byte
  var logical = new Int32Array(ab.slice(420, 440));

  // 48 words, 32 bits per word / 8 bits per byte
  var alphanum = new Int32Array(ab.slice(440, 632));

  // the rest of the file
  var data = new Float32Array(ab.slice(440, ab.length));

  // for debugging purposes
  console.log("floats: ", floats);
  console.log("enumerated: ", enumerated);
  console.log("logical: ", logical);
  console.log("alphanum: ", alphanum);
  console.log("data: ", data);

  var deltaT = floats[0];

  var plotData = [];

  // create plotting rows
  for (var i = 1; i < 8000; i++) {
    var row = [];
    row.push(deltaT * i);
    row.push(data[i] / 1000);
    plotData.push(row);

  }

  google.charts.setOnLoadCallback(drawChart(plotData));
}

// draw chart
google.charts.load('current', {'packages':['corechart']});

function drawChart(sacData) {
  var data = google.visualization.arrayToDataTable([
    ['Time', 'Displacement'],
    [0,  0]
  ]);

  data.addRows(sacData);

  // set up chart
  var options = {
    title: 'Seismogram',
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

  chart.draw(data, options);
}
