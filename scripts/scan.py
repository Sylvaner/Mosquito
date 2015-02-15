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

update_file_query = "UPDATE audio_file SET title = %s, artist = %s, album = %s, track = %s, year = %d, genre_fk = %d, length = %s, bitrate = %d, scan_code = '%s' WHERE path = '%s'"
insert_file_query = "INSERT INTO audio_file (id, path, title, artist, album, track, year, genre_fk, length, bitrate, scan_code) VALUES (NULL, '%s', %s, %s, %s, %s, %d, %d, %s, %d, '%s')"

genre_list = {}
debug = False
config = {}
file_count = 0

# Function: usage
#
# Print usage message on missing arguments.
#
def usage():
	print("Usage : "+sys.argv[0]+" path config")
	print("\tpath : Root directory for scan")
	print("\tconfig : File with database configuration")

# Function: extract_track
#
# Extract the track number
#
# Parameters:
#  trackStr - String that contains the track number.
#
# Returns
#  integer - Track number.
#
def extract_track(trackStr):
	try:
		if not "/" in trackStr:
			track = int(trackStr)
		else:
			track = int(trackStr.split('/')[0])
	except:
		return "'00'"

	if track < 10:
		return "'0"+str(track)+"'"
	return "'"+str(track)+"'"

# Function: extract_year	
#
# Extract the year.
#
# Parameters:
#  dateStr - String that contains the date.
#
# Returns
#  integer - Year.
#
def extract_year(dateStr):
	year = 0
	try:
		if not "-" in dateStr:
			year = int(dateStr)
		else:
			date_array = dateStr.split('-')
			for data in date_array:
				if len(data) == 4:
					year = int(data)
					break
	except:
		return 0
	return year

# Function: read_mp3_file_data
#
# Read data of mp3 file.
#
# Parameters:
#  file_path - Path of the file.
#
def read_mp3_file_data(file_path):
	try:
		tag = MP3(file_path)
		length = "'"+str(tag.info.length)+"'"
		bitrate = int(tag.info.bitrate)
	except mutagen.mp3.HeaderNotFoundError:
		length = 'NULL';
		bitrate = 0;

	return length, bitrate
	
#def readFlacFileData(file_path, data):
#	print("Flac")
#	tag = FLAC(file_path)
#	print(tag.info)
#	flac = FLAC(file_path)#
#	print(flac.audio.length)
#	return data
	
#def readMp4FileData(file_path, data):
#	print("Mp4")
#	return data

# Function: read_attribute
#
# Read attribute from key and escape string.
#
# Parameters:
#  db - Database connection.
#  data_to_read - Array of data.
#  key - Key to read.
#  add_single_quote - True if single quote must be add.
#
# Returns:
#  String - Read data or ''.
#
def read_attribute(db, data_to_read, key, add_single_quote):
	
	try:
		if isinstance(data_to_read[key], list):
			ret = data_to_read[key][0]
		else:
			ret = str(data_to_read[key])
	except KeyError:
		ret = ""
	
	if add_single_quote:
		ret = "'"+db.escape_string(ret)+"'"
	return ret

# Function: read_file_data	
#
# Read data from file.
#
# Parameters:
#  db - Database connection.
#  file_path - Path of the file.
#  extension - Extension of the file.
#
# Returns:
#  Array - ['title', 'artist', 'album', 'track', 'year', 'genre']
#
def read_file_data(db, file_path, extension):
	data = {'path': file_path}
	try:
		general_data = mutagen.File(file_path, easy=True)
	except (FileNotFoundError, OSError):
		return None

	if general_data is not None:
		data['title'] = read_attribute(db, general_data, 'title', True)
		data['artist'] = read_attribute(db, general_data, 'artist', True)
		data['album'] = read_attribute(db, general_data, 'album', True)
		data['track'] = extract_track(read_attribute(db, general_data, 'tracknumber', False))
		data['year'] = extract_year(read_attribute(db, general_data, 'date', False))
		data['genre'] = read_attribute(db, general_data, 'genre', False)

		if extension == '.mp3':
			data['length'], data['bitrate'] = read_mp3_file_data(file_path)
#		elif extension == ".ogg":
#			data = readOggFileData(file_path, data)
#		elif extension == ".flac":
#			data = readFlacFileData(file_path, data)
#		elif extension == ".mp4":
#			data = readMp4FileData(file_path, data)
		else:
			data['length'] = 'NULL'
			data['bitrate'] = 0
	else:
		return None
		
	return data

# Function: generate_genre_list
#
# Generate array of genres stored in database.
#
# Parameters:
#  db - Database connection.
#
def generate_genre_list(db):
	global genre_list
	
	cursor = db.cursor()
	cursor.execute("SELECT id, name FROM genre")
	for row in cursor.fetchall():
		genre_list[row[1]] = row[0]
	cursor.close()

# Function: get_genre_id
#
# Get id of genre by name
#
# Parameters:
#  db - Database connection.
#  genre_name - Name of genre to find.
#
# Returns:
#  integer - Id
#
def get_genre_id(db, genre_name):
	global genre_list

	if genre_name in genre_list:
		return_value = genre_list[genre_name]
	elif genre_name == "":
		return_value = 1
	else:
		return_value = add_genre(db, genre_name)
	return return_value
		
# Function: add_genre
#
# Add genre to database.
#
# Parameters:
#  db - Database connection.
#  genre_name - Name of genre to find.
#
# Returns:
#  integer - Id
#
def add_genre(db, genre_name):
	global genre_list

	genre_name = db.escape_string(genre_name)
	cursor = db.cursor()
	cursor.execute("INSERT INTO genre (id, name) VALUES (NULL, '"+genre_name+"')")
	genre_id = cursor.lastrowid
	genre_list[genre_name] = genre_id
	cursor.close()
	db.commit()
	return genre_id
	
# Function: file_exists_in_database
#
# Test if file exists in database.
#
# Parameters:
#  db - Database connection.
#  file_path - Path of the file.
#
# Returns:
#  boolean - True if file exists.
#
def file_exists_in_database(db, file_path):
	cursor = db.cursor()
	cursor.execute("SELECT id FROM audio_file WHERE path = '"+db.escape_string(file_path)+"'");
	ret = cursor.fetchone() is not None
	cursor.close()
	return ret

# Function: add_file
#
# Add or update a file in database
#
# Parameters:
#  db - Database connection.
#  file_data - Path of the file.
#  scan_code - Code of the current scan.
#
def add_file(db, file_data, scan_code):
	global file_count
	
	cursor = db.cursor()
	if (debug):
		print(file_data['path'])
	file_count += 1

	if file_exists_in_database(db, file_data['path']):
		cursor.execute(update_file_query % (file_data['title'], file_data['artist'], file_data['album'], file_data['track'], file_data['year'], get_genre_id(db, file_data['genre']), file_data['length'], file_data['bitrate'], scan_code, db.escape_string(file_data['path'])))
	else:
		cursor.execute(insert_file_query % (db.escape_string(file_data['path']), file_data['title'], file_data['artist'], file_data['album'], file_data['track'], file_data['year'], get_genre_id(db, file_data['genre']), file_data['length'], file_data['bitrate'], scan_code))
	cursor.close()
	db.commit()

# Function: scan_path
#
# Scan a path for audio files.
#
# Parameters:
#  db - Database connection.
#  current_path - Path to scan.
#  scan_code - Code of the current scan.
#
def scan_path(db, current_path, scan_code):
	items = listdir(current_path)
	for item in items:
		absolutePath = current_path+'/'+item
		if path.isdir(absolutePath):
			scan_path(db, absolutePath, scan_code)
		else:
			filename, extension = path.splitext(absolutePath)
			extension = extension.lower()[1:]
			# Test supported files
			if extension in config['supportedFiles']:
				file_data = read_file_data(db, absolutePath, extension)
				if file_data is not None:
					add_file(db, file_data, scan_code)

# Function: read_config_file
#
# Read a config file.
#
# Parameters:
#  config_file_path - Path of the file.
#
# Returns:
#  JSON - Config file data.
#
def read_config_file(config_file_path):
	try:
		config_file = open(config_file_path)
		config = json.load(config_file)
		config_file.close()
	except FileNotFoundError:
		print("Config file not found.")
		sys.exit(1)
	return config

# Function: connect_database
#
# Get connection to the database
#
# Parameters:
#  JSON - object with connection settings.
#
def connect_database(config):
	try:
		db = pymysql.connect(host=config["host"], port=3306, user=config["user"], passwd=config["password"], db=config["database"], charset='utf8')
		db.autocommit(True);
	except AttributeError:
		print("Invalid config file.")
		sys.exit(1)
	return db

# Function: generate_scan_code
#
# Generate a random scan code.
#
# Returns:
#  String - 8 chars string.
#
def generate_scan_code():
	return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(8))

# Function: scan
#
# Launch a scan from a directory.
# Parameters:
#  root - Root directory.
#  config_file_path - File for connection settings.
#
# Returns:
#  Write total of added/updated files in console.
#
def scan(root, config_file_path):
	global config
	global file_count
	file_count = 0;
	
	root = path.abspath(root)

	config = read_config_file(config_file_path)

	db = connect_database(config)

	# Launch if path is good
	scan_code = generate_scan_code()
	# Read genre table
	generate_genre_list(db)
	# Write state in settings table
	now = datetime.datetime.now()

	if path.exists(root):
		cursor = db.cursor()
		cursor.execute("UPDATE settings SET value = '"+scan_code+"' WHERE name = 'last_scan_code'")
		cursor.execute("UPDATE settings SET value = '"+str('%04d' % now.year)+"-"+str('%02d' % now.month)+"-"+str('%02d' % now.day)+":"+str('%02d' % now.hour)+":"+str('%02d' % now.minute)+"' WHERE name = 'last_scan_start_time'")
		cursor.execute("UPDATE settings SET value = '0' WHERE name = 'last_scan_state'")
		db.commit()
		
		scan_path(db, root, scan_code)

		cursor.execute("UPDATE settings SET value = '1' WHERE name = 'last_scan_state'")
		db.commit()
		cursor.close()
		print(file_count)
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
