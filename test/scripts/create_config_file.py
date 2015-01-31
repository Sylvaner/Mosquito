#!/usr/bin/python3
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

import os
import sys
import json

# Open config file
try:
	configFile = open(os.getcwd()+"/config/config.json")
	config = json.load(configFile)
	configFile.close()
except FileNotFoundError:
	print("Config file not found.")
	sys.exit(1)

# Open test config file for database
try:
	configFile = open(os.getcwd()+"/test/config/config_test.json")
	configTest = json.load(configFile)
	config["database"] = configTest["database"]
	configFile.close()
except FileNotFoundError:
	print("Config file not found.")
	sys.exit(1)


tmpConfigFilePath = os.getcwd()+"/test/tmp/config.json"
tmpConfigFile = open(tmpConfigFilePath, 'w+')

json.dump(config, tmpConfigFile)

tmpConfigFile.close()

