#!/bin/sh
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
if [ $# -lt 4 ]; then
	echo "Usage : $0 HOST USER PASSWORD DATABASE"
	exit
fi

HOST=$1
USER=$2
PASSWORD=$3
DATABASE=$4

mysql -h$HOST -u $USER -p$PASSWORD<<INSTALL_SCRIPT

CREATE DATABASE IF NOT EXISTS $DATABASE;
USE $DATABASE;

CREATE TABLE IF NOT EXISTS audio_file (
	id int(10) unsigned NOT NULL AUTO_INCREMENT,
	path varchar(512) NOT NULL,
	title varchar(255) DEFAULT NULL,
	artist varchar(255) DEFAULT NULL,
	album varchar(255) DEFAULT NULL, 
	track varchar(3) DEFAULT NULL,
	year int(10) DEFAULT NULL,
	genre_fk int(10) DEFAULT NULL,
	length VARCHAR(32) DEFAULT NULL,
	bitrate int(11) DEFAULT NULL,
	scan_code varchar(12) DEFAULT NULL,
	PRIMARY KEY (id),
	KEY artist (artist,year)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8; 

CREATE TABLE IF NOT EXISTS process (
    code varchar(64) NOT NULL,
    value varchar(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
CREATE TABLE IF NOT EXISTS genre (
    id int(10) unsigned NOT NULL AUTO_INCREMENT,
    name varchar(64) NOT NULL, 
    PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO genre (id, name) VALUES (1, 'Unknow');

CREATE TABLE IF NOT EXISTS settings (
	id int(10) unsigned NOT NULL AUTO_INCREMENT,
	name varchar(32) NOT NULL,
	value varchar(512) NOT NULL,
	PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO settings (id, name, value) VALUES (1, 'path', '.');
INSERT INTO settings (id, name, value) VALUES (2, 'last_scan_code', '');
INSERT INTO settings (id, name, value) VALUES (3, 'last_scan_start_time', '');
INSERT INTO settings (id, name, value) VALUES (4, 'last_scan_state', '1');
INSERT INTO settings (id, name, value) VALUES (5, 'debug', '0');

INSTALL_SCRIPT
