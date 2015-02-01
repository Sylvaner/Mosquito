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

import os
import sys
import platform
import subprocess
import json

defaultHost = 'localhost'
defaultUser = 'root'
defaultDatabase = 'mosquito'
baseUser = ''
host = ''
user = ''
database = ''
password = ''

packageDependencies = [
{
	'name': 'NodeJs',
	'commands': ['node', 'nodejs'],
	'packageName': 'nodejs',
	'checked': False
},
{
	'name': 'Npm',
	'commands': ['npm'],
	'packageName': 'npm',
	'checked': False
},
{
	'name': 'Python3',
	'commands': ['python3'],
	'packageName': 'python3',
	'checked': False
},
{
	'name': 'Pip3',
	'commands': ['pip3'],
	'packageName': 'python3-pip',
	'checked': False
},
{
	'name': 'MySQL Server',
	'commands': ['mysql'],
	'packageName': 'mysql-server',
	'checked': False
}
]
installCommand = ""

def showMenu():
	print('\n -=| Mosquito Media Player Setup |=- \n')
	print('\t1. Install')
	print('\t2. Reset config')
	print('\t3. Uninstall')
	print('\t4. Quit')
	choice = input('\nChoice : ')
	try:
		return int(choice)
	except ValueError:
		return -1

def which(command):
	try:
		subprocess.call([command, '--version'], stdout=subprocess.DEVNULL)
		return True
	except FileNotFoundError:
		return False

def askYorN(ask, defaultValue):
	askValues = ' [Y/n]: '
	answer = 'Fooooooo'
	answered = False
	ret = False
	if defaultValue.lower() == 'n':
		askValues = ' [y/N]: '
	while not answered: 
		answer = input(ask+askValues)
		if answer.lower() == 'y' or answer == '':
			ret = True
			answered = True
		elif answer.lower() == 'n':
			answered = True
			ret = False
	return ret


def checkConfig():
	print("\n=== Check packages dependencies ===")
	checkedCount = 0
	for package in packageDependencies:
		print(package['name']+" : ",end="")
		commandFound = 0
		for command in package['commands']:
			if which(command):
				commandFound = 1
		if commandFound > 0:
			print("Ok")
			package['checked'] = True
			checkedCount += 1
		else:
			print("Not found")
	return checkedCount

def installMissingPackages():
	if installCommand != "":
		packageList = ""
		print("\n=== Install missing packages ===")
		for package in packageDependencies:
			if not package['checked']:
				packageList += package['packageName']+" "
		print(installCommand+packageList)
		os.system(installCommand+packageList);

def installBoot():
	try:
		if os.path.exists('/etc/init.d/mosquito'):
			os.system('/etc/init.d/mosquito stop') 
			os.system('rm -fr /etc/init.d/mosquito')
		# Copy file from template
		initTemplate = open('install/init_script.tpl')
		initFile = open('/etc/init.d/mosquito', 'w')
		cwd = os.getcwd()
		for line in initTemplate:
			initFile.write(line.replace('##########', cwd))
		initFile.close()
		initTemplate.close()
		# Set +x to init.d script
		os.chmod("/etc/init.d/mosquito", 0o755)
		os.system("update-rc.d mosquito defaults > /dev/null 2>&1")
	except FileNotFoundError:
		print('Init script template not found.')

def installScript():
	global installCommand

	if sys.platform == "linux":
		distrib = platform.dist()[0]
		if "Mint" in distrib or "buntu" in distrib or "ebian" in distrib:
			installCommand = "apt-get install "
		if "edhat" in distrib or "edora" in distrib:
			installCommand = "yum -y install "
	if installCommand == "":
		print("Platform unknow")
		print(sys.platform)
		print(platform.dist())
		exit(1)
	print("\n=== Check configuration ===")
	if len(packageDependencies) != checkConfig():
		installMissingPackages()
		if len(packageDependencies) != checkConfig():
			for package in packageDependencies:
				if not package['checked']:
					print("Problem with "+package['name'])
			quit()		
	
	print("\n=== Install python3 modules ===")
	os.system("pip3 install pymysql")
	os.system("pip3 install mutagen")
	print("\n=== Install NodeJs module ===")
	os.system("npm install --no-bin-links")
	os.system('mkdir config')
	configScript()
	# Change config file owner
	os.system('chown $SUDO_USER -R config')
	os.system('chgrp $SUDO_USER -R config')
	os.chmod("config/config.json", 0o666)
	
	if askYorN('Start automatically on boot', 'y'):
		installBoot()
		os.system('sudo /etc/init.d/mosquito start');
	print("\n=== Installation success ===")
	path = input('Music library path : ')
	
	print("\n=== Update database settings ===")
	os.system("mysql -h"+host+" -u "+user+" -p"+password+" "+database+" -e \"UPDATE settings SET value = '"+path+"' WHERE name = 'path'\"")
	if askYorN('Scan now form music', 'y'):
		os.system('./scripts/scan.py '+path+' config/config.json')

def configScript():
	global host
	global user
	global database
	global password
	print("\n=== Configuration ===")
	host = input('MySQL host ['+defaultHost+']: ')
	if host == "":
		host = defaultHost
	user = input('MySQL user ['+defaultUser+']: ')
	if user == "":
		user = defaultUser
	password = input('MySQL password : ')
	database= input('MySQL database ['+defaultDatabase+']: ')
	if database == "":
		database = defaultDatabase
	if os.path.exists('config/config.json'):
		print("\n=== Delete old data ===")
		uninstall(False)
	print("\n=== Install database ===")
	os.system("./install/db_install.sh "+host+" "+user+" "+password+" "+database)
	
	print("\n=== Write config file ===")
	config = {
		'host': host,
		'user': user,
		'password': password,
		'database': database,
		'listenPort': '8080',
		'localesDirectory': '/locales',
		'locale': 'en',
		'theme': 'default',
		'filesLimit': '2000',
		'supportedFiles': ['mp3', 'flac', 'ogg']
	}
	with open('config/config.json', 'w') as outConfigFile:
		json.dump(config, outConfigFile, sort_keys=False, indent=4)
		
def uninstall(printStatus):
	configFile = None
	# Read current config
	try:
		configFile = open('config/config.json')
		config = json.load(configFile)
		configFile.close()
	except FileNotFoundError:
		print("Config file already deleted")
	if configFile is not None:
		if printStatus:
			print("\n=== Drop database ===")
		os.system('./install/db_uninstall.sh '+config['host']+' '+config['user']+' '+config['password']+' '+config['database'])
		if printStatus:
			print("\n=== Delete config file ===")
		os.remove('config/config.json')
	# Remove init.d script
	if os.path.exists('/etc/init.d/mosquito'):
		os.system('update-rc.d -f mosquito remove > /dev/null 2>&1')
		
# Launch uninstall script
def uninstallScript():
	print("\n=== Uninstall ===")
	uninstall(True)
	print("\n=== Uninstall success ===")
	quit()

# Quit without error
def quit():
	exit(0)

# Launch script
if os.getuid() != 0:
	print("Install must be run as root (sudo).")
	exit(1)

showMenuPrompt = True
choice = 0;
while (showMenuPrompt):
	choice = showMenu()
	if choice > 0 and choice < 5:
		showMenuPrompt = False
choicesFunc = {1: installScript, 2: configScript, 3: uninstallScript, 4: quit}
choicesFunc[choice]();

