#Last modified by Stefan Kildal-Brandt on 6/28/22

import urllib2 #Necessary for fetching data from marineregions server
import json #Necessary for parsing the data into and out of Json format

#Grab all EEZ's from Marineregions.org
data = []
for i in range(3):
	res = urllib2.urlopen('https://marineregions.org/rest/getGazetteerRecordsByType.json/eez/?offset={}'.format(100*i))
	tempData = res.read()
	tempData = json.loads(tempData)
	data = data + tempData

#Decode EEZ information and transform it into an object with only the pertinent information
dataObj = []
MRGIDList = []
for i in data:
	if i["minLatitude"] is None:
		continue
	obj = ({"MRGID": i["MRGID"], "preferredGazetteerName": i["preferredGazetteerName"], "latitude": i["latitude"],
		   "longitude": i["longitude"], "minLatitude": i["minLatitude"], "minLongitude": i["minLongitude"],
		   "maxLatitude": i["maxLatitude"], "maxLongitude": i["maxLongitude"]})
	dataObj.append(obj)
	MRGIDList.append(i["MRGID"])
str = json.dumps(dataObj)
str2 = json.dumps(MRGIDList)

#Write the data into files
with open('/home/www/people/simons/Vearthscopeoceans/data/EEZData/AllEEZ','w') as f:
	f.write(str)
	f.close()

with open('/home/www/people/simons/earthscopeoceans/data/EEZData/MRGIDList','w') as f:
	f.write(str2)
	f.close()
