
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

  var data = new Float32Array(ab.slice(440, ab.length));

  console.log("floats: ", floats);
  console.log("enumerated: ", enumerated);
  console.log("logical: ", logical);
  console.log("alphanum: ", alphanum);
  console.log("data: ", data);

  var deltaT = floats[0];

  var plotData = [];


  for (var i = 1; i < 31; i++) {
    var row = [];
    row.push(deltaT * i);
    row.push(data[i]);
    plotData.push(row);

  }
  // google.charts.setOnLoadCallback(drawChart);
  drawChart(plotData);



}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
