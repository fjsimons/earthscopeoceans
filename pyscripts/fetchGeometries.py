#Last modified by Stefan Kildal-Brandt on 6/28/22

import json
import urllib2
import os

# Grab the path
path_file = open('pathNames.txt', 'r')
path = path_file.readlines()[0].strip()
path_file.close()

with open(os.path.join(path, 'data', 'EEZData', 'MRGIDList'), 'r') as f:
	data = f.read()
	f.close()

EEZList = json.loads(data)

def fetchGeo(MRGID):
	res = urllib2.urlopen('https://www.marineregions.org/rest/getGazetteerGeometries.jsonld/{}/'.format(MRGID))
	tempData = res.read()
	tempData = json.loads(tempData)
	return tempData['mr:hasGeometry'][0]['gsp:asWKT']

def convertGeo(MRGID):
	geoData = fetchGeo(MRGID)
	arr = []
	geoData = geoData.split(')),')
	for i in range(len(geoData)):
		temp = geoData[i].split(')')
		geoData[i] = temp[0];
		geoData[i] = geoData[i][geoData[i].index('('):]
		geoData[i] = geoData[i].replace('(',"")
		geoData[i] = geoData[i].replace(')',"")
		tempArr = geoData[i].split(', ')
		for j in range(len(tempArr)):
			loopArr = tempArr[j].split(' ')
			tempObj = [float(loopArr[0]), float(loopArr[1])]
			tempArr[j]=tempObj
		arr.append(tempArr)
	return arr

#New function that writes all of the geometries into one file - Using this file is faster when implementing into map.js
def writeAllFile(list):
	obj = {}
	for MRGID in list:
		print(MRGID)
		convertValue = convertGeo(MRGID)
		arr = []
		for item in convertValue:
			newArr = []
			resolution = 0.1
			if len(item)>10000:
				resolution=0.5
			if len(item)>100000:
				resolution=2
			i=0
			while i<len(item)-1:
				k=1
				while abs(item[i+k][1]-item[i][1])+abs(item[i+k][0]-item[i][0])<resolution:
					k+=1
					if i+k>len(item)-2:
						break
				newArr.append([item[i][0], item[i][1]])
				i+=k
			arr.append(newArr)
		obj['{}'.format(MRGID)] = arr
	string = json.dumps(obj)
	string = string.replace(', ', ',')
	with open(os.path.join(path,'data','EEZData','AllGeometries', 'w') as f:
		f.write(string)
		f.close()

writeAllFile(EEZList)
