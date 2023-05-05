# Last modified by Stefan Kildal-Brandt 6/28/22

# This script takes a few hours to run
# Recommended to only use to build list of float data from scratch

import urllib2
from urllib2 import HTTPError
import math
from datetime import datetime

#Haversine Displacement Calculation
def getDisplacement(datapt1, datapt2):
    lat1 = datapt1[0]
    lon1 = datapt1[1]
    lat2 = datapt2[0]
    lon2 = datapt2[1]

    R = 6378.137
    dLat = lat2 * math.pi / 180 - lat1 * math.pi / 180
    dLon = lon2 * math.pi / 180 - lon1 * math.pi / 180
    a = (math.sin(dLat/2) * math.sin(dLat/2) +
        math.cos(lat1*math.pi/180) * math.cos(lat2*math.pi/180)*
        math.sin(dLon/2) * math.sin(dLon/2))
    c = 2 * math.atan2(math.sqrt(a),math.sqrt(1-a))
    d = R * c
    return d*1000

#Function to convert a given month to a number
def monthToNum(month):
    return {
        'Jan': 1,
        'Feb': 2,
        'Mar': 3,
        'Apr': 4,
        'May': 5,
        'Jun': 6,
        'Jul': 7,
        'Aug': 8,
        'Sep': 9,
        'Oct': 10,
        'Nov': 11,
        'Dec': 12
    }[month]

#Given a date and time, get the UTC Time
def toUTCTime(str):
    tempArr = str.split(' ')
    arr = tempArr[0].split('-') + tempArr[1].split(':')
    arr[1] = monthToNum(arr[1])
    finalArr = [int(x) for x in arr]
    dt = datetime(finalArr[2], finalArr[1], finalArr[0], finalArr[3], finalArr[4], finalArr[5])
    timestamp = (dt - datetime(1970, 1, 1)).total_seconds()
    return timestamp

#Grabs GEBCODepth from gebco.net given a latitude and longitude
def getGEBCODepth(latlon):
    bb = .0083333333333
    stlap = latlon[0] - bb
    stlop = latlon[1] - bb
    stlam = latlon[0] + bb
    stlom = latlon[1] + bb
    rqtHead = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?'
    rqtTail = ('request=getfeatureinfo&service=wms&crs=EPSG:4326&layers=gebco_latest_2&query_layers=gebco_latest_2&BBOX='
              + str(stlap) + ',' + str(stlop) + ',' + str(stlam) + ',' + str(stlom)
              + '&info_format=text/plain&service=wms&x=2&y=2&width=5&height=5&version=1.3.0')
    url = rqtHead + rqtTail
    file = urllib2.urlopen(url)
    try:
        data = str(file.read())
        return data.split("\'")[7]
    except HTTPError as err:
        print(err)
        return 0
    except Exception as err:
        print(err)
        return 0

#List of all floats at time of this scripts creation
floats = ["N0001", "N0002", "N0003", "N0004", "N0005", "P0050",
"P0052", "P0053", "P0054", "P0006", "P0008", "P0009", "P0010", "P0011",
"P0012", "P0013", "P0016", "P0017", "P0018", "P0019", "P0020", "P0021",
"P0022", "P0023", "P0024", "P0025", "P0026", "P0027", "P0028", "P0029",
"P0031", "P0032", "P0033", "P0035", "P0036", "P0037", "P0038", "P0039",
"P0040", "P0041", "P0042", "P0043", "P0044", "P0045", "P0046", "P0048", "P0049",
"R0058", "R0059", "R0061", "R0063", "R0065", "R0067", "R0069", "R0071",
"R0072", "R0073", "R0001", "R0002", "R0003", "R0004", "R0005", "R0007",
"N0003", "P0007", "P0034", "P0047", "R0006"]

#Script to grab and decode float data from Professor Simons' pages
arr = []
for i in floats:
    url = "https://geoweb.princeton.edu/people/simons/SOM/{}_all.txt".format(i)
    file = urllib2.urlopen(url)
    temparr = []
    for line in file:
        decoded_line = line.decode("utf-8")
        lineArr = decoded_line.split()
        if (lineArr[3] == "NaN") or (lineArr[4] == "NaN"):
            continue
        dateStr = '{} {}'.format(lineArr[1], lineArr[2])
        timestamp = toUTCTime(dateStr)
        latLon = [float(lineArr[3]), float(lineArr[4])]
        temparr.append([latLon, timestamp])
    arr.append(temparr)

#Writes the proper displacement, distance, and time for each float
#into a string and creates an array of the strings for all floats 
k=0
strArr = []
for item in arr:
    print(floats[k])
    #Find and write the data for each individual float
    indArr = []
    currDistance = 0
    currTime = 0
    legDistance = 0
    legTime = 0
    for j in range(len(item)):
        if(j!=0):
            legDistance = getDisplacement(item[j-1][0], item[j][0])
            legTime = round((item[j][1]-item[j-1][1])/(60*60), 2)
            currDistance += legDistance
            currTime = round(currTime + legTime, 2)
        GEBCODepth = getGEBCODepth(item[j][0])
        indStr ="{} {} {} {} {} {}".format(int(legDistance), legTime, int(getDisplacement(item[0][0], item[j][0])), int(currDistance), currTime, GEBCODepth)
        indArr.append(indStr)
    with open('/home/www/people/simons/earthscopeoceans/data/FloatInfo/{}.txt'.format(floats[k]), 'w') as f:
        for line in indArr:
            f.write(line)
            if line!=indArr[-1]:
                f.write('\n')
        f.close()

    #Writes the proper displacement, distance, and time for each float
    #into a string and creates an array of the strings for all floats 
    totalDistance = 0
    for i in range(len(item)-1):
        totalDistance += getDisplacement(item[i][0], item[i+1][0])
    totalTime = round((item[-1][1]-item[0][1])/(60*60), 2)
    tempStr = "{} {} {} {} {}".format(floats[k], int(getDisplacement(item[0][0], item[-1][0])), int(totalDistance), totalTime, getGEBCODepth(item[-1][0]))
    strArr.append(tempStr)
    k+=1

#Writes float information into a text file labelled 'distances.txt'
with open('/home/www/people/simons/earthscopeoceans/data/FloatInfo/distances.txt', 'w') as f:
    for line in strArr:
        f.write(line)
        if line != strArr[-1]:
            f.write('\n')
    f.close()
