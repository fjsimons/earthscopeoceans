# Written by Stefan Kildal-Brandt on 6/25/2026
# Helper functions for the updateInfo.py and distanceCalc.py scripts

import urllib2
from urllib2 import HTTPError
from datetime import datetime
import math

# Haversine Displacement Calculation
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

# Function to convert a given month to a number
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

# Given a date and time, get the UTC Time
def toUTCTime(str):
    tempArr = str.split(' ')
    arr = tempArr[0].split('-') + tempArr[1].split(':')
    arr[1] = monthToNum(arr[1])
    finalArr = [int(x) for x in arr]
    dt = datetime(finalArr[2], finalArr[1], finalArr[0], finalArr[3], finalArr[4], finalArr[5])
    timestamp = (dt - datetime(1970, 1, 1)).total_seconds()
    return timestamp

# Grabs GEBCODepth from gebco.net given a latitude and longitude
def getGEBCODepth(latlon, bounds=5):
    bb = .0083333333333
    stlap = latlon[0] - bb
    stlop = latlon[1] - bb
    stlam = latlon[0] + bb
    stlom = latlon[1] + bb
    rqtHead = 'https://wms.gebco.net/mapserv?'
    rqtTail = ('request=getfeatureinfo&service=wms&crs=EPSG:4326&layers=GEBCO_LATEST_2&query_layers=GEBCO_LATEST_2&BBOX='
              + str(stlap) + ',' + str(stlop) + ',' + str(stlam) + ',' + str(stlom)
              + '&info_format=text/plain&service=wms&i=2&j=2&width=' + str(bounds) + '&height=' + str(bounds) + '&version=1.3.0')
    url = rqtHead + rqtTail
    try:
        file = urllib2.urlopen(url)
        data = str(file.read())
        return data.split("\'")[7]
    except HTTPError as err:
        print(err)
        return 0
    except IndexError as err:
        print(err)
        print("Retrying with bigger bounding box")
        if bounds<10:
            return getGEBCODepth(latlon, bounds+1)
        return 0
    except Exception as err:
        print(err)
        return 0
