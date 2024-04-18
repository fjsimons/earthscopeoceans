# Written by Stefan Kildal-Brandt on 7/1/2022
# Main Script for updating float info. Much faster than building float info files from scratch.
# Last update by Frederik J Simons on 4/18/2024

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
    rqtHead = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?'
    rqtTail = ('request=getfeatureinfo&service=wms&crs=EPSG:4326&layers=gebco_latest_2&query_layers=gebco_latest_2&BBOX='
              + str(stlap) + ',' + str(stlop) + ',' + str(stlam) + ',' + str(stlom)
              + '&info_format=text/plain&service=wms&x=2&y=2&width=' + str(bounds) + '&height=' + str(bounds) + '&version=1.3.0')
    url = rqtHead + rqtTail
    file = urllib2.urlopen(url)
    try:
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

# List of all floats
floats = ["N0001", "N0002", "N0003", "N0004", "N0005", "P0050", "T0100", "T0101", "T0102",
          "P0052", "P0053", "P0054", "P0006", "P0008", "P0009", "P0010", "P0011",
          "P0012", "P0013", "P0016", "P0017", "P0018", "P0019", "P0020", "P0021",
          "P0022", "P0023", "P0024", "P0025", "P0026", "P0027", "P0028", "P0029",
          "P0031", "P0032", "P0033", "P0035", "P0036", "P0037", "P0038", "P0039",
          "P0040", "P0041", "P0042", "P0043", "P0044", "P0045", "P0046", "P0048",
          "P0049", "R0058", "R0059", "R0061", "R0063", "R0065", "R0067", "R0069",
          "R0071", "R0072", "R0073", "R0001", "R0002", "R0003", "R0004", "R0005",
          "R0007", "N0003", "P0007", "P0034", "P0047", "R0006", "R0062", "R0066"]

# Iterate through all of the given floats
allInfoStrings = []
for flo in floats:
    print(flo)

    # Grab the current data that is stored for that float
    file = open('/home/www/people/simons/earthscopeoceans/data/FloatInfo/{}.txt'.format(flo), 'r')
    fileArr = file.readlines()
    fileArrLines = [fileArr[i].split(' ') for i in range(len(fileArr))]
    file.close()
    
    # Grab the data that are stored on geoweb for that float
    urlFile = urllib2.urlopen('https://geoweb.princeton.edu/people/simons/SOM/{}_all.txt'.format(flo))
    urlArr = []
    for line in urlFile:
        decoded_line = line.decode('utf-8')
        lineArr = decoded_line.split()
        if (lineArr[3] == "NaN") or (lineArr[4]=="NaN"):
            continue
        urlArr.append(lineArr)

    # Calculate data for all floats
    totDist = 0
    for i in range(1, len(urlArr)):
        totDist += getDisplacement([float(urlArr[i-1][3]), float(urlArr[i-1][4])], [float(urlArr[i][3]), float(urlArr[i][4])])
    netDisp = int(getDisplacement([float(urlArr[0][3]), float(urlArr[0][4])], [float(urlArr[-1][3]), float(urlArr[-1][4])]))
    netTime = round((toUTCTime('{} {}'.format(urlArr[-1][1], urlArr[-1][2]))
                   - toUTCTime('{} {}'.format(urlArr[0][1], urlArr[0][2])))/(60*60), 2)
    endDepth = getGEBCODepth([float(urlArr[-1][3]), float(urlArr[-1][4])])
    allString = '{} {} {} {} {}'.format(flo, netDisp, int(totDist), netTime, endDepth)

    allInfoStrings.append(allString)

    # If there is new data on the geoweb server, grab that and append it to our individual float data
    if len(urlArr) > len(fileArr):
        numNewLines = len(urlArr) - len(fileArr)
        currDist = int(fileArrLines[-1][3])
        currTime = float(fileArrLines[-1][4])
        initLatLng = [float(urlArr[0][3]), float(urlArr[0][4])]

        appendFile = open('/home/www/people/simons/earthscopeoceans/data/FloatInfo/{}.txt'.format(flo), 'a')
        for index in range(-numNewLines, 0):
            prevLatLng = [float(urlArr[index-1][3]), float(urlArr[index-1][4])]
            latLng = [float(urlArr[index][3]), float(urlArr[index][4])]
            totDisp = int(getDisplacement(initLatLng, latLng))
            legDist = int(getDisplacement(prevLatLng, latLng))
            currDist += legDist
            legTime = round((toUTCTime('{} {}'.format(urlArr[index][1], urlArr[index][2]))
                             - toUTCTime('{} {}'.format(urlArr[index-1][1], urlArr[index-1][2])))/(60*60), 2)
            currTime = round(currTime + legTime, 2)
            GEBCODepth = getGEBCODepth(latLng)
            string = '{} {} {} {} {} {}'.format(legDist, legTime, totDisp, currDist, currTime, GEBCODepth)
            if not(index==-numNewLines and '\n' in fileArr[-1]):
                appendFile.write('\n')
            appendFile.write(string)
        appendFile.close()

# Write data in for all tabs
with open('/home/www/people/simons/earthscopeoceans/data/FloatInfo/distances.txt', 'w') as f:
    for line in allInfoStrings:
        f.write(line)
        if line!=allInfoStrings[-1]:
            f.write('\n')
    f.close()
