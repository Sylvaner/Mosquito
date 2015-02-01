#!/usr/bin/python3
# -*- coding: utf-8 -*-
## 
 # Mosquito Media Player. 
 # one line to give the program's name and an idea of what it does.
 # Copyright (C) 2015 - Sylvain Dangin
 # 
 # This program is free software; you can redistribute it and/or
 # modify it under the terms of the GNU General Public License
 # as published by the Free Software Foundation; either version 2
 # of the License, or (at your option) any later version.
 # 
 # This program is distributed in the hope that it will be useful,
 # but WITHOUT ANY WARRANTY; without even the implied warranty of
 # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 # GNU General Public License for more details.
 # 
 # You should have received a copy of the GNU General Public License
 # along with this program; if not, write to the Free Software
 # Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
##

# Class: Script scan

import json
import pymysql
import sys
import mutagen
import string
import random
import datetime
from os import path
from os import listdir

from mutagen.mp3 import MP3
#from mutagen.flac import FLAC

genreList = {}
debug = False
config = {}
fileCount = 0

# Function: usage
#
# Print usage message on missing arguments.
#
def usage():
	print("Usage : "+sys.argv[0]+" path config")
	print("\tpath : Root directory for scan")
	print("\tconfig : File with database configuration")

# Function: extractTrack
#
# Extract the track number
#
# Parameters:
#  trackStr - String that contains the track number.
#
# Returns
#  integer - Track number.
#
def extractTrack(trackStr):
	track = 0
	try:
		if not "/" in trackStr:
			track = int(trackStr)
		else:
			track = int(trackStr.split('/')[0])
	except ValueError:
		track = 0
	ret = str(track)

	if track < 10:
		ret = "0"+ret
	return "'"+ret+"'"

# Function: extractYear	
#
# Extract the year.
#
# Parameters:
#  dateStr - String that contains the date.
#
# Returns
#  integer - Year.
#
def extractYear(dateStr):
	year = ""
	try:
		if not "-" in dateStr:
			year = dateStr
		else:
			dateArr = dateStr.split('-')
			for data in dateArr:
				if len(data) == 4:
					year = data
	except ValueError:
		year = ""
	return "'"+year+"'"

# Function: readMp3FileData
#
# Read data of mp3 file.
#
# Parameters:
#  filePath - Path of the file.
#  data - Object with know data.
#
def readMp3FileData(filePath, data):
	try:
		tag = MP3(filePath)
		data['length'] = "'"+str(tag.info.length)+"'"
		data['bitrate'] = str(tag.info.bitrate)
	except mutagen.mp3.HeaderNotFoundError:
		data['length'] = '';
		data['bitrate'] = '';
		
	return data
	
#def readFlacFileData(filePath, data):
#	print("Flac")
#	tag = FLAC(filePath)
#	print(tag.info)
#	flac = FLAC(filePath)#
#	print(flac.audio.length)
#	return data
	
#def readMp4FileData(filePath, data):
#	print("Mp4")
#	return data

# Function: readAttribute
#
# Read attribute from key and escape string.
#
# Parameters:
#  db - Database connection.
#  dataToRead - Array of data.
#  key - Key to read.
#  addSingleQuote - True if single quote must be add.
#
# Returns:
#  String - Read data or ''.
#
def readAttribute(db, dataToRead, key, addSingleQuote):
	try:
		t = ''+dataToRead[key]
	except KeyError:
		return "''"
	except TypeError:
		t = dataToRead[key][0]
	
	if addSingleQuote:
		t = "'"+db.escape_string(t)+"'"
	return t

# Function: readFileData	
#
# Read data from file.
#
# Parameters:
#  db - Database connection.
#  filePath - Path of the file.
#  extension - Extension of the file.
#
# Returns:
#  Array - ['title', 'artist', 'album', 'track', 'year', 'genre']
#
def readFileData(db, filePath, extension):
	data = {'path': filePath}
	try:
		generalData = mutagen.File(filePath, easy=True)
	except (FileNotFoundError, OSError):
		generalData = None
	if generalData is not None:
		data['title'] = readAttribute(db, generalData, 'title', True)
		data['artist'] = readAttribute(db, generalData, 'artist', True)
		data['album'] = readAttribute(db, generalData, 'album', True)
		data['track'] = extractTrack(readAttribute(db, generalData, 'tracknumber', False))
		data['year'] = extractYear(readAttribute(db, generalData, 'date', False))
		data['genre'] = readAttribute(db, generalData, 'genre', False)

		if extension == '.mp3':
			data = readMp3FileData(filePath, data)
#		elif extension == ".ogg":
#			data = readOggFileData(filePath, data)
#		elif extension == ".flac":
#			data = readFlacFileData(filePath, data)
#		elif extension == ".mp4":
#			data = readMp4FileData(filePath, data)
		else:
			data['length'] = 'NULL'
			data['bitrate'] = 'NULL'
	else:
		return None
		
	return data

# Function: generateGenreList
#
# Generate array of genres stored in database.
#
# Parameters:
#  db - Database connection.
#
def generateGenreList(db):
	global genreList
	cursor = db.cursor()
	cursor.execute("SELECT id, name FROM genre")
	for row in cursor.fetchall():
		genreList[row[1]] = row[0]
	cursor.close()

# Function: getGenreId
#
# Get id of genre by name
#
# Parameters:
#  db - Database connection.
#  genreName - Name of genre to find.
#
# Returns:
#  integer - Id
#
def getGenreId(db, genreName):
	global genreList
	ret = 0
	if genreName in genreList:
		returnValue = genreList[genreName]
	elif genreName == "''":
		returnValue = 1
	else:
		returnValue = addGenre(db, genreName)
	return returnValue
		
# Function: addGenre
#
# Add genre to database.
#
# Parameters:
#  db - Database connection.
#  genreName - Name of genre to find.
#
# Returns:
#  integer - Id
#
def addGenre(db, genreName):
	global genreList
	genreName = db.escape_string(genreName)
	cursor = db.cursor()
	cursor.execute("INSERT INTO genre (id, name) VALUES (NULL, '"+genreName+"')")
	genreId = cursor.lastrowid
	genreList[genreName] = genreId
	cursor.close()
	return genreId
	
# Function: fileExistsInDatabase
#
# Test if file exists in database.
#
# Parameters:
#  db - Database connection.
#  filePath - Path of the file.
#
# Returns:
#  boolean - True if file exists.
#
def fileExistsInDatabase(db, filePath):
	cursor = db.cursor()
	cursor.execute("SELECT id FROM audio_file WHERE path = '"+db.escape_string(filePath)+"'");
	ret = cursor.fetchone() is not None
	cursor.close()
	return ret

# Function: addFile
#
# Add or update a file in database
#
# Parameters:
#  db - Database connection.
#  fileData - Path of the file.
#  scanCode - Code of the current scan.
#
def addFile(db, fileData, scanCode):
	global fileCount
	
	cursor = db.cursor()
	if (debug):
		print(fileData['path'])
	fileCount += 1

	if fileExistsInDatabase(db, fileData['path']):
		cursor.execute(("UPDATE audio_file SET "
						"title = "+fileData['title']+", "
						"artist = "+fileData['artist']+", "
						"album = "+fileData['album']+", "
						"track = "+fileData['track']+", "
						"year = "+fileData['year']+", "
						"genre_fk = "+str(getGenreId(db, fileData['genre']))+", "
						"length = "+fileData['length']+", "
						"bitrate = "+fileData['bitrate']+", "
						"scan_code = '"+scanCode+"' WHERE path = '"+db.escape_string(fileData['path'])+"'"))
	else:
		cursor.execute(("INSERT INTO audio_file (id, path, title, artist, album, track, year, genre_fk, length, bitrate, scan_code) VALUES "
						"(NULL, '"+db.escape_string(fileData['path'])+"', "+fileData['title']+", "+fileData['artist']+", "+fileData['album']+", "+fileData['track']+", "+fileData['year']+", "+str(getGenreId(db, fileData['genre']))+", "+fileData['length']+", "+fileData['bitrate']+", '"+scanCode+"')"))
	cursor.close()
	db.commit()

# Function: scanPath
#
# Scan a path for audio files.
#
# Parameters:
#  db - Database connection.
#  currentPath - Path to scan.
#  scanCode - Code of the current scan.
#
def scanPath(db, currentPath, scanCode):
	items = listdir(currentPath)
	for item in items:
		absolutePath = currentPath+'/'+item
		if path.isdir(absolutePath):
			scanPath(db, absolutePath, scanCode)
		else:
			filename, extension = path.splitext(absolutePath)
			extension = extension.lower()[1:]
			# Test supported files
			if extension in config['supportedFiles']:
				fileData = readFileData(db, absolutePath, extension)
				if fileData is not None:
					addFile(db, fileData, scanCode)

# Function: readConfig
#
# Read a config file.
#
# Parameters:
#  configFilePath - Path of the file.
#
# Returns:
#  JSON - Config file data.
#
def readConfigFile(configFilePath):
	try:
		configFile = open(configFilePath)
		config = json.load(configFile)
		configFile.close()
	except FileNotFoundError:
		print("Config file not found.")
		sys.exit(1)
	return config

# Function: connectDatabase
#
# Get connection to the database
#
# Parameters:
#  JSON - object with connection settings.
#
def connectDatabase(config):
	try:
		db = pymysql.connect(host=config["host"], port=3306, user=config["user"], passwd=config["password"], db=config["database"], charset='utf8')
		db.autocommit(True);
	except AttributeError:
		print("Invalid config file.")
		sys.exit(1)
	return db

# Function: generateScanCode
#
# Generate a random scan code.
#
# Returns:
#  String - 8 chars string.
#
def generateScanCode():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))

# Function: scan
#
# Launch a scan from a directory.
# Parameters:
#  root - Root directory.
#  configFilePath - File for connection settings.
#
# Returns:
#  Write total of added/updated files in console.
#
def scan(root, configFilePath):
	global config
	global fileCount
	fileCount = 0;
	
	root = path.abspath(root)

	config = readConfigFile(configFilePath)

	db = connectDatabase(config)

	# Launch if path is good
	scanCode = generateScanCode()
	# Read genre table
	generateGenreList(db)
	# Write state in settings table
	now = datetime.datetime.now()

	if path.exists(root):
		cursor = db.cursor()
		cursor.execute("UPDATE settings SET value = '"+scanCode+"' WHERE name = 'last_scan_code'")
		cursor.execute("UPDATE settings SET value = '"+str('%04d' % now.year)+"-"+str('%02d' % now.month)+"-"+str('%02d' % now.day)+":"+str('%02d' % now.hour)+":"+str('%02d' % now.minute)+"' WHERE name = 'last_scan_start_time'")
		cursor.execute("UPDATE settings SET value = '0' WHERE name = 'last_scan_state'")
		db.commit()
		
		scanPath(db, root, scanCode)

		cursor.execute("UPDATE settings SET value = '1' WHERE name = 'last_scan_state'")
		db.commit()
		cursor.close()
		print(fileCount)
	else:
		print("Problem with path : "+root)
		sys.exit(1)


if __name__ == '__main__':
	try:
		root = sys.argv[1]
	except IndexError:
		usage()
		sys.exit(1)

	scan(sys.argv[1], sys.argv[2])
