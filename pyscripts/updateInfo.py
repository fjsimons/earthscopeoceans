# Written by Stefan Kildal-Brandt on 7/1/2022
# Main script for cron updating float info
#
# Looks at SOM float data and runs an update to add to FloatInfo
# 
# Last update by Frederik J Simons on 06/10/2026
# Last update by Stefan Kildal-Brandt on 6/25/2026

import urllib2
from urllib2 import HTTPError
import os
import re

from helper_functions import getDisplacement, monthToNum, toUTCTime, getGEBCODepth 

# Grab the path from a headerless bare text file
path_file = open('pathNames.txt', 'r')
path = path_file.readlines()[0].strip()
path_file.close()

# Grab the floats from a headerless bare text file
float_file = open('floatNames.txt', 'r')
floats = []
float_lines = float_file.readlines()
for line in float_lines[0:]:
    for flo in line.split(' '):
        flo = flo.strip()
        if flo:
            floats.append(flo)
float_file.close()

# Iterate through all of the given floats
allInfoStrings = []
for flo in floats:
    print(flo)

    # Grab the current data that are stored on geoweb for that float
    floatInfoPath = os.path.join(path,'data','FloatInfo','{}.txt'.format(flo))
    if os.path.exists(floatInfoPath):
        file = open(floatInfoPath, 'r')
        fileArr = file.readlines()
        fileArrLines = [fileArr[i].split(' ') for i in range(len(fileArr))]
        file.close()
    else:
        print("No existing file for {}. Creating one.".format(flo))
        fileArr = []
        fileArrLines = []

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
        if len(fileArr) == 0:
            currDist = 0
            currTime = 0.0
        else:
            currDist = int(fileArrLines[-1][3])
            currTime = float(fileArrLines[-1][4])
        initLatLng = [float(urlArr[0][3]), float(urlArr[0][4])]

        appendFile = open(floatInfoPath, 'a')
        for index in range(-numNewLines, 0):
            latLng = [float(urlArr[index][3]), float(urlArr[index][4])]
            totDisp = int(getDisplacement(initLatLng, latLng))

            # If this is the first line of a brand-new file, there is no previous point
            if len(fileArr) == 0 and index == -numNewLines:
                legDist = 0
                legTime = 0.0
            else:
                prevLatLng = [float(urlArr[index-1][3]), float(urlArr[index-1][4])]
                legDist = int(getDisplacement(prevLatLng, latLng))
                currDist += legDist
                legTime = round((toUTCTime('{} {}'.format(urlArr[index][1], urlArr[index][2]))
                             - toUTCTime('{} {}'.format(urlArr[index-1][1], urlArr[index-1][2])))/(60*60), 2)
                currTime = round(currTime + legTime, 2)
            
            GEBCODepth = getGEBCODepth(latLng)
            string = '{} {} {} {} {} {}'.format(legDist, legTime, totDisp, currDist, currTime, GEBCODepth)

            # Add newline unless this is the first line of a brand-new file
            if not(len(fileArr) == 0 and index == -numNewLines):
                if len(fileArr) == 0 or not(index == -numNewLines and '\n' in fileArr[-1]):
                     appendFile.write('\n')
            appendFile.write(string)

        appendFile.close()

# Write data in for all tabs
with open(os.path.join(path,'data','FloatInfo','distances.txt'), 'w') as f:
    for line in allInfoStrings:
        f.write(line)
        if line!=allInfoStrings[-1]:
            f.write('\n')
    f.close()
