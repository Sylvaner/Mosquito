#!/bin/bash
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

KEEP_DATA=0

function dropDb {
	./install/db_uninstall.sh localhost $USER $PASSWORD $DATABASE
}

function initDb {
	./install/db_install.sh localhost $USER $PASSWORD $DATABASE
}

function deleteData {
	if [ $KEEP_DATA -eq 0 ]; then
		dropDb
		rm -fr test/tmp
	fi
}

# Test if mocha is installed
if which mocha > /dev/null; then
	MOCHA='mocha'
else
	MOCHA='nodejs node_modules/mocha/bin/mocha'
fi

TEST_ARRAY+=("$MOCHA test/test_install.js")
TEST_ARRAY+=("python3 test/test_scan.py")
TEST_ARRAY+=("$MOCHA test/test_db.js")
TEST_ARRAY+=("$MOCHA test/test_routes_ajax.js")

COMMENT_TEST_ARRAY+=('')
COMMENT_TEST_ARRAY+=(' Test scan script')
COMMENT_TEST_ARRAY+=('')
COMMENT_TEST_ARRAY+=('')

# Make temporary directory for tests
mkdir test/tmp

echo "###########################################"
echo "#               Unit tests                #"
echo "###########################################"
echo

# Create config file for test database
python3 test/scripts/create_config_file.py

if [ $? -ne 0 ]; then
	exit 1
fi

# Read config file for test
USER=`python3 scripts/getJsonData.py test/tmp/config.json user`
PASSWORD=`python3 scripts/getJsonData.py test/tmp/config.json password`
HOST=`python3 scripts/getJsonData.py test/tmp/config.json host`
DATABASE=`python3 scripts/getJsonData.py test/tmp/config.json database`

for (( i=0; i<$(( ${#TEST_ARRAY[@]} )); i++))
do
  initDb
  if [ -n "${COMMENT_TEST_ARRAY[$i]}" ]; then
    echo ${COMMENT_TEST_ARRAY[$i]}
  fi
  eval ${TEST_ARRAY[$i]}
  if [ $? -ne 0 ]; then
    deleteData
    exit 1
  fi
  dropDb
done

deleteData
