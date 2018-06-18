// create datapoint object
function DataPoint(name, stdt, stla, stlo, hdop, vdop, Vbat, minV, Pint, Pext, Prange, cmdrdc, f2up, fupl) {
	this.name = name;
	this.stdt = toDate(stdt);
  this.stla = stla;
  this.stlo = stlo;
  this.hdop = hdop;
	this.vdop = vdop;
	this.Vbat = Vbat;
	this.minV = minV;
	this.Pint = Pint;
	this.Pext = Pext;
	this.Prange = Prange;
  this.cmdrdc = cmdrdc;
  this.f2up = f2up;
  this.fupl = fupl;

}

//10-Apr-2018 03:25:54

// convert to date object
function toDate(stdt) {
  const MonthConversions = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
                            "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12};

  day = parseInt(stdt.substring(0, 2));
  month = MonthConversions[stdt.substring(3, 6)];
  year = parseInt(stdt.substring(7, 11));

  hour = parseInt(stdt.substring(12, 14));
  minute = parseInt(stdt.substring(15, 17));
  second = parseInt(stdt.substring(18));

  date = new Date(year, month, day, hour, minute, second);

  return (date);


}


// get time elapsed between datapoints in hours
function getTimeElapsed (datapt1, datapt2) {
  return (datapt2.stdt - datapt1.stdt) / (1000 * 60 * 60);
}
