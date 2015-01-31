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

import sys
import os
import json

try:
	jsonFilePath = sys.argv[1]
	key = sys.argv[2]
except IndexError:
	print("Usage : "+sys.argv[0]+" json_file key")
	sys.exit(1)

jsonFile = open(jsonFilePath)
jsonData = json.load(jsonFile)
jsonFile.close()

try:
	print(jsonData[key])
except:
	print("Attribute '"+key+"' not found.")
	sys.exit(1)

