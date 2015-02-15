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

default_host = 'localhost'
default_user = 'root'
default_database = 'mosquito'
base_user = ''
host = ''
user = ''
database = ''
password = ''

package_dependencies = [
{
	'name': 'NodeJs',
	'commands': ['node', 'nodejs'],
	'package_name': 'nodejs',
	'found': -1
},
{
	'name': 'Npm',
	'commands': ['npm'],
	'package_name': 'npm',
	'found': -1
},
{
	'name': 'Python3',
	'commands': ['python3'],
	'package_name': 'python3',
	'found': -1
},
{
	'name': 'Pip3',
	'commands': ['pip3', 'pip-3.3'],
	'package_name': 'python3-pip',
	'found': -1
},
{
	'name': 'MySQL Server',
	'commands': ['mysql'],
	'package_name': 'mysql-server',
	'found': -1
}
]
install_command = ""

def show_menu():
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
		null = subprocess.DEVNULL
	except AttributeError:
		null = open("/dev/null", "w")
	try:
		subprocess.call([command, '--version'], stdout=null)
		return True
	except OSError:
		return False
	


def ask_y_n(ask, default_value):
	ask_values = ' [Y/n]: '
	answer = 'Fooooooo'
	answered = False
	ret = False
	if default_value.lower() == 'n':
		ask_values = ' [y/N]: '
	while not answered: 
		answer = input(ask+ask_values)
		if answer.lower() == 'y' or answer == '':
			ret = True
			answered = True
		elif answer.lower() == 'n':
			answered = True
			ret = False
	return ret


def check_config():
	print("\n=== Check packages dependencies ===")
	checked_count = 0
	for package in package_dependencies:
		print(package['name']+" : ",end="")
		command_found = 0
		for i in range(len(package['commands'])):
			if which(package['commands'][i]):
				command_found = i
				break
		if command_found != -1:
			print("Ok")
			checked_count = checked_count + 1
			package['found'] = i
		else:
			print("Not found")
	return checked_count

def install_missing_packages():
	if install_command != "":
		package_list = ""
		print("\n=== Install missing packages ===")
		for package in package_dependencies:
			if package['found'] == -1:
				package_list += package['package_name']+" "
		print(install_command+package_list)
		os.system(install_command+package_list);

def install_boot():
	try:
		if os.path.exists('/etc/init.d/mosquito'):
			os.system('/etc/init.d/mosquito stop') 
			os.system('rm -fr /etc/init.d/mosquito')
		# Copy file from template
		init_template = open('install/init_script.tpl')
		init_file = open('/etc/init.d/mosquito', 'w')
		cwd = os.getcwd()
		nodejs_cmd = package_dependencies[0]['commands'][package_dependencies[0]['found']]
		for line in init_template:
			line = line.replace('$$$$$$$$$$', nodejs_cmd)
			init_file.write(line.replace('##########', cwd))
		init_file.close()
		init_template.close()
		# Set +x to init.d script
		os.chmod("/etc/init.d/mosquito", 0o755)
		os.system("update-rc.d mosquito defaults > /dev/null 2>&1")
	except OSError:
		print('Init script template not found.')

def install_script():
	global install_command

	if "linux" in sys.platform:
		distrib = platform.dist()[0]
		if "Mint" in distrib or "buntu" in distrib or "ebian" in distrib:
			install_command = "apt-get install "
		if "edhat" in distrib or "edora" in distrib:
			install_command = "yum -y install "
	if install_command == "":
		print("Platform unknow")
		print(sys.platform)
		print(platform.dist())
		exit(1)
	print("\n=== Check configuration ===")
	if len(package_dependencies) != check_config():
		install_missing_packages()
		if len(package_dependencies) != check_config():
			for package in package_dependencies:
				if package['found'] == -1:
					print("Problem with "+package['name'])
			quit()		
	
	pip_command = package_dependencies[3]['commands'][package_dependencies[3]['found']]
	print("\n=== Install python3 modules ===")
	os.system(pip_command+" install pymysql")
	os.system(pip_command+" install mutagen")
	print("\n=== Install NodeJs module ===")
	os.system("npm install --no-bin-links")
	os.system('mkdir config')
	config_script()
	# Change config file owner
	os.system('chown $SUDO_USER -R config')
	os.system('chgrp $SUDO_USER -R config')
	os.chmod("config/config.json", 0o666)
	
	if ask_y_n('Start automatically on boot', 'y'):
		install_boot()
		os.system('sudo /etc/init.d/mosquito start');
	print("\n=== Installation success ===")
	path = input('Music library path : ')
	
	print("\n=== Update database settings ===")
	os.system("mysql -h"+host+" -u "+user+" -p"+password+" "+database+" -e \"UPDATE settings SET value = '"+path+"' WHERE name = 'path'\"")
	if ask_y_n('Scan now form music', 'y'):
		os.system('./scripts/scan.py '+path+' config/config.json')

def config_script():
	global host
	global user
	global database
	global password
	print("\n=== Configuration ===")
	host = input('MySQL host ['+default_host+']: ')
	if host == "":
		host = default_host
	user = input('MySQL user ['+default_user+']: ')
	if user == "":
		user = default_user
	password = input('MySQL password : ')
	database= input('MySQL database ['+default_database+']: ')
	if database == "":
		database = default_database
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
		
def uninstall(print_status):
	config_file = None
	# Read current config
	try:
		config_file = open('config/config.json')
		config = json.load(config_file)
		config_file.close()
	except OSError:
		print("Config file already deleted")
	if config_file is not None:
		if print_status:
			print("\n=== Drop database ===")
		os.system('./install/db_uninstall.sh '+config['host']+' '+config['user']+' '+config['password']+' '+config['database'])
		if print_status:
			print("\n=== Delete config file ===")
		os.remove('config/config.json')
	# Remove init.d script
	if os.path.exists('/etc/init.d/mosquito'):
		os.system('update-rc.d -f mosquito remove > /dev/null 2>&1')
		
# Launch uninstall script
def uninstall_script():
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

show_menu_prompt = True
choice = 0;
while (show_menu_prompt):
	choice = show_menu()
	if choice > 0 and choice < 5:
		show_menu_prompt = False
choices_func = {1: install_script, 2: config_script, 3: uninstall_script, 4: quit}
choices_func[choice]();

