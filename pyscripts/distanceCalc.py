# Last modified by Stefan Kildal-Brandt 6/25/26
#
# Turns the SOM/*_all.txt float information into
#           FloatInfo/*.txt for every float
#           FloatInfo/distance.txt at the very end
# suitable for later cron updates by updateInfo.py
# knowing that map.js reads a combination of SOM and FloatInfo
#
# This script takes a few hours to run
# Recommended to only use to build list of float data from scratch

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
     with open(os.path.join(path,'data','FloatInfo','{}.txt'.format(floats[k])), 'w') as f:
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
with open(os.path.join(path,'data','FloatInfo','distances.txt'), 'w') as f:
    for line in strArr:
        f.write(line)
        if line != strArr[-1]:
            f.write('\n')
    f.close()
