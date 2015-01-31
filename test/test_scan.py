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
import unittest
import pymysql
import json
import sys
import os
import mutagen
import datetime
sys.path.append(os.getcwd()+"/scripts")
import scan
import time

db = ''
config = ''

# CONSTANTS
NB_TABLES_IN_DATABASE = 3

class RedirectOutput():
	def __init__(self):
		self.output = '' 

	def write(self, s):
		self.output += s;

class TestScriptScan(unittest.TestCase):
	def setUp(self):
		cursor = db.cursor()
		cursor.execute("TRUNCATE TABLE audio_file")
		cursor.execute("TRUNCATE TABLE genre")
		cursor.execute("INSERT INTO genre (id, name) VALUES (1, 'Unknow')")
		cursor.close()
		db.commit()
		scan.genreList = {}

	def testExtractTrack(self):
		self.assertEqual("'01'", scan.extractTrack("01"))
		self.assertEqual("'03'", scan.extractTrack("03/11"))
		self.assertEqual("'00'", scan.extractTrack("A_Text"))

	def testReadMp3FileData(self):
		data = {'path': os.path.abspath("test/data/Rock/Heavy/300.mp3")}
		data = scan.readMp3FileData(data['path'], data)
		self.assertEqual("'10.004897959183673'", data['length'])
		self.assertEqual('161548', data['bitrate'])
		data = {'path': os.path.abspath("test/data/Techno/NotAMusicFile.txt")}
		data = scan.readMp3FileData(data['path'], data)
		self.assertEqual('', data['length'])

#	def testReadFlacFileData(self):
#		data = {'path': os.path.abspath("test/data/Classic/1200.flac")}
#		data = scan.readFlacFileData(data['path'], data)
#		self.assertEqual("'10.004897959183673'", data['length'])
#		self.assertEqual('161548', data['bitrate'])
#		data = {'path': os.path.abspath("test/data/Techno/NotAMusicFile.txt")}
#		data = scan.readOggFileData(data['path'], data)
#		self.assertEqual('NULL', data['length'])

	def testReadFileData(self):
		data = scan.readFileData(db, os.path.abspath("test/data/Jazz/1500.mp3"), "mp3")
		self.assertEqual("'Jazzy'", data["artist"])
		self.assertEqual("'1500'", data["title"])
		self.assertNotEqual("NULL", data['genre'])
		data = scan.readFileData(db, os.path.abspath("test/data/Techno/NotAMusicFile.txt"), "txt")
		self.assertIsNone(data)

	def testAddGenre(self):
		self.assertEqual(2, scan.addGenre(db, "Zeuhl"))

	def testGenerateGenreList(self):
		scan.generateGenreList(db)
		self.assertEqual(1, len(scan.genreList))
		self.assertEqual(1, scan.genreList['Unknow'])

	def testGetGenreId(self):
		scan.generateGenreList(db)
		self.assertEqual(1, scan.getGenreId(db, "Unknow"))
		self.assertEqual(2, scan.getGenreId(db, "Zeuhl"))
		
	def testFileExistsInDatabase(self):
		data = scan.readFileData(db, os.path.abspath("test/data/Jazz/1500.mp3"), "mp3")
		self.assertFalse(scan.fileExistsInDatabase(db, data['path']))
		scan.addFile(db, data, "ScanCodeTest")
		self.assertTrue(scan.fileExistsInDatabase(db, data['path']))
		
	def testAddFile(self):
		cursor = db.cursor()
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(0, cursor.rowcount)
		data = scan.readFileData(db, os.path.abspath("test/data/Rock/Heavy/300.mp3"), "mp3")
		scan.addFile(db, data, "ScanCodeTest")
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(1, cursor.rowcount)
		cursor.close()
		
	def testReadConfigFile(self):
		tmpConfigFilePath = os.getcwd()+"/test/tmp/test.json"
		tmpConfigFile = open(tmpConfigFilePath, 'w+')
		tmpConfigFile.write('{\n\t"foo": "bar"\n}\n');
		tmpConfigFile.close()
		testConfig = scan.readConfigFile(tmpConfigFilePath)
		self.assertEqual("bar", testConfig["foo"])
	
	def testConnectDatabase(self):
		testDb = scan.connectDatabase(config)
		cursor = testDb.cursor()
		cursor.execute("SHOW TABLES")
		self.assertNotEqual(0, cursor.rowcount)
		cursor.close()
	
	def testGenerateScanCode(self):
		scanCode = scan.generateScanCode()
		self.assertIsInstance(scanCode, str)
		self.assertEqual(8, len(scanCode))
		
	def testScanPath(self):
		cursor = db.cursor()
		query1 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest1'"
		query2 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest2'"
		query3 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest3'"
		query4 = "SELECT * FROM audio_file WHERE path LIKE '%Rock%' AND scan_code = 'UnitTest3'"

		cursor.execute(query1)
		self.assertEqual(0, cursor.rowcount)

		scan.scanPath(db, os.path.abspath("test/data/Rock"), "UnitTest1")

		cursor.execute(query1)
		self.assertEqual(3, cursor.rowcount)

		scan.scanPath(db, os.path.abspath("test/data/Techno"), "UnitTest2")

		cursor.execute(query1)
		self.assertEqual(3, cursor.rowcount)
		cursor.execute(query2)
		self.assertEqual(1, cursor.rowcount)

		scan.scanPath(db, os.path.abspath("test/data"), "UnitTest3")

		cursor.execute(query1)
		self.assertEqual(0, cursor.rowcount)
		cursor.execute(query2)
		self.assertEqual(0, cursor.rowcount)
		cursor.execute(query3)
		self.assertEqual(11, cursor.rowcount)
		cursor.execute(query4)
		self.assertEqual(3, cursor.rowcount)

		cursor.close()

	def testScan(self):
		cursor = db.cursor()
		now = datetime.datetime.now()
		
		startTimeRegex = r'^'+str('%04d' % now.year)+'\-'+str('%02d' % now.month)+'\-'+str('%02d' % now.day)+'\:'+str('%02d' % now.hour)+'\:.{2}$'
		# First pass
		redirectOutput = RedirectOutput()
		saveStdOut = sys.stdout
		sys.stdout = redirectOutput
		scan.scan("test/data", "test/tmp/config.json")
		sys.stdout = saveStdOut
		self.assertEqual('11\n', redirectOutput.output)
		# Get scan code for test with second pass
		cursor.execute("SELECT value FROM settings WHERE name='last_scan_code'")
		result = cursor.fetchone()
		firstScanCode = result[0]
		# Number of scanned files
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(11, cursor.rowcount)
		# Scan start time
		cursor.execute("SELECT value FROM settings WHERE name='last_scan_start_time'")
		result = cursor.fetchone()
		self.assertRegex(result[0], startTimeRegex)
		# Scan state (Finish)
		cursor.execute("SELECT value FROM settings WHERE name='last_scan_state'")
		result = cursor.fetchone()
		self.assertEqual(1, int(result[0]))
		
		# Second pass
		redirectOutput = RedirectOutput()
		saveStdOut = sys.stdout
		sys.stdout = redirectOutput
		scan.scan("test/data", "test/tmp/config.json")
		sys.stdout = saveStdOut
		self.assertEqual('11\n', redirectOutput.output)
		# Same number of files
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(11, cursor.rowcount)
		# Test if scan code is different
		cursor.execute("SELECT value FROM settings WHERE name='last_scan_code'")
		result = cursor.fetchone()
		self.assertNotEqual(firstScanCode, result[0])
		cursor.close()

if __name__ == "__main__":
	# Open config file
	try:
		configFile = open(os.getcwd()+"/test/tmp/config.json")
		config = json.load(configFile)
		configFile.close()
	except FileNotFoundError:
		print("Config file not found.")
		sys.exit(1)
	
	# Connect to db
	try:
		db = pymysql.connect(host=config["host"], port=3306, user=config["user"], passwd=config["password"], db=config["database"], charset='utf8')
		db.autocommit(True)
	except AttributeError:
		print("Invalid config file.")
		sys.exit(1)

	# Launch test
	unittest.main()
