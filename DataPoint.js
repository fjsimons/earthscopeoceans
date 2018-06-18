// create datapoint object
function DataPoint(name, stdt, stla, stlo, hdop, vdop, Vbat, minV, Pint, Pext, Prange, cmdrdc, f2up, fupl) {
	this.name = name;
	this.stdt = stdt;
	this.loct = toDate(stdt);
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

// INPUT is in UTC, convert to browser time
function toDate(stdt) {
  const MonthConversions = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                            "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};

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
