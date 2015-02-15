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
		scan.genre_list = {}

	def test_extract_track(self):
		self.assertEqual("'01'", scan.extract_track("01"))
		self.assertEqual("'03'", scan.extract_track("03/11"))
		self.assertEqual("'00'", scan.extract_track("A_Text"))

	def test_extract_year(self):
		self.assertEqual(1982, scan.extract_year("1982"))
		self.assertEqual(1983, scan.extract_year("01-01-1983"))
		self.assertEqual(1984, scan.extract_year("1984-01-01"))
		self.assertEqual(0, scan.extract_year("AWrongDate"))

	def test_read_mp3_file_data(self):
		data = {'path': os.path.abspath("test/data/Rock/Heavy/300.mp3")}
		length, bitrate = scan.read_mp3_file_data(data['path'])
		self.assertEqual("'10.004897959183673'", length)
		self.assertEqual(161548, bitrate)
		data = {'path': os.path.abspath("test/data/Techno/NotAMusicFile.txt")}
		length, bitrate = scan.read_mp3_file_data(data['path'])
		self.assertEqual('NULL', length)
		self.assertEqual(0, bitrate)

#	def testReadFlacFileData(self):
#		data = {'path': os.path.abspath("test/data/Classic/1200.flac")}
#		data = scan.readFlacFileData(data['path'], data)
#		self.assertEqual("'10.004897959183673'", data['length'])
#		self.assertEqual('161548', data['bitrate'])
#		data = {'path': os.path.abspath("test/data/Techno/NotAMusicFile.txt")}
#		data = scan.readOggFileData(data['path'], data)
#		self.assertEqual('NULL', data['length'])

	def test_read_file_data(self):
		data = scan.read_file_data(db, os.path.abspath("test/data/Jazz/1500.mp3"), "mp3")
		self.assertEqual("'Jazzy'", data["artist"])
		self.assertEqual("'1500'", data["title"])
		self.assertNotEqual("NULL", data['genre'])
		data = scan.read_file_data(db, os.path.abspath("test/data/Techno/NotAMusicFile.txt"), "txt")
		self.assertIsNone(data)

	def test_add_genre(self):
		self.assertEqual(2, scan.add_genre(db, "Zeuhl"))

	def test_generate_genre_list(self):
		scan.generate_genre_list(db)
		self.assertEqual(1, len(scan.genre_list))
		self.assertEqual(1, scan.genre_list['Unknow'])

	def test_get_genre_id(self):
		scan.generate_genre_list(db)
		self.assertEqual(1, scan.get_genre_id(db, "Unknow"))
		self.assertEqual(2, scan.get_genre_id(db, "Zeuhl"))
		
	def test_file_exists_in_database(self):
		data = scan.read_file_data(db, os.path.abspath("test/data/Jazz/1500.mp3"), "mp3")
		self.assertFalse(scan.file_exists_in_database(db, data['path']))
		scan.add_file(db, data, "ScanCodeTest")
		self.assertTrue(scan.file_exists_in_database(db, data['path']))
		
	def test_add_file(self):
		cursor = db.cursor()
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(0, cursor.rowcount)
		data = scan.read_file_data(db, os.path.abspath("test/data/Rock/Heavy/300.mp3"), "mp3")
		scan.add_file(db, data, "ScanCodeTest")
		cursor.execute("SELECT * FROM audio_file")
		self.assertEqual(1, cursor.rowcount)
		cursor.close()
		
	def test_read_config_file(self):
		tmp_config_file_path = os.getcwd()+"/test/tmp/test.json"
		tmp_config_file = open(tmp_config_file_path, 'w+')
		tmp_config_file.write('{\n\t"foo": "bar"\n}\n');
		tmp_config_file.close()
		test_config = scan.read_config_file(tmp_config_file_path)
		self.assertEqual("bar", test_config["foo"])
	
	def test_connect_database(self):
		test_db = scan.connect_database(config)
		cursor = test_db.cursor()
		cursor.execute("SHOW TABLES")
		self.assertNotEqual(0, cursor.rowcount)
		cursor.close()
	
	def test_generate_scan_code(self):
		scan_code = scan.generate_scan_code()
		self.assertIsInstance(scan_code, str)
		self.assertEqual(8, len(scan_code))
		
	def test_scan_path(self):
		cursor = db.cursor()
		query1 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest1'"
		query2 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest2'"
		query3 = "SELECT * FROM audio_file WHERE scan_code = 'UnitTest3'"
		query4 = "SELECT * FROM audio_file WHERE path LIKE '%Rock%' AND scan_code = 'UnitTest3'"

		cursor.execute(query1)
		self.assertEqual(0, cursor.rowcount)

		scan.scan_path(db, os.path.abspath("test/data/Rock"), "UnitTest1")

		cursor.execute(query1)
		self.assertEqual(3, cursor.rowcount)

		scan.scan_path(db, os.path.abspath("test/data/Techno"), "UnitTest2")

		cursor.execute(query1)
		self.assertEqual(3, cursor.rowcount)
		cursor.execute(query2)
		self.assertEqual(1, cursor.rowcount)

		scan.scan_path(db, os.path.abspath("test/data"), "UnitTest3")

		cursor.execute(query1)
		self.assertEqual(0, cursor.rowcount)
		cursor.execute(query2)
		self.assertEqual(0, cursor.rowcount)
		cursor.execute(query3)
		self.assertEqual(11, cursor.rowcount)
		cursor.execute(query4)
		self.assertEqual(3, cursor.rowcount)

		cursor.close()

	def test_scan(self):
		cursor = db.cursor()
		now = datetime.datetime.now()
		
		start_time_regex = r'^'+str('%04d' % now.year)+'\-'+str('%02d' % now.month)+'\-'+str('%02d' % now.day)+'\:'+str('%02d' % now.hour)+'\:.{2}$'
		# First pass
		redirect_output = RedirectOutput()
		saveStdOut = sys.stdout
		sys.stdout = redirect_output
		scan.scan("test/data", "test/tmp/config.json")
		sys.stdout = saveStdOut
		self.assertEqual('11\n', redirect_output.output)
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
		self.assertRegex(result[0], start_time_regex)
		# Scan state (Finish)
		cursor.execute("SELECT value FROM settings WHERE name='last_scan_state'")
		result = cursor.fetchone()
		self.assertEqual(1, int(result[0]))
		
		# Second pass
		redirect_output = RedirectOutput()
		saveStdOut = sys.stdout
		sys.stdout = redirect_output
		scan.scan("test/data", "test/tmp/config.json")
		sys.stdout = saveStdOut
		self.assertEqual('11\n', redirect_output.output)
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
		config_file = open(os.getcwd()+"/test/tmp/config.json")
		config = json.load(config_file)
		config_file.close()
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
