#!/bin/bash

TMP_PATH=dev/tmp
LITTLE_TEST_COUNT=5
BIG_TEST_COUNT=20
CONFIG_JSON="{\"host\": \"$1\", \"user\": \"$2\", \"password\": \"$3\", \"database\": \"$4\", \"supportedFiles\": [\"mp3\"]}"
GLOBAL=0
SCRIPT_TO_TEST="scan.py"

mkdir $TMP_PATH
echo $CONFIG_JSON > $TMP_PATH/config.json

if [ $# -lt 5 ]; then
	echo "Usage : $0 HOST USER PASSWORD DATABASE LIBRARY_PATH [SCRIPT_TO_TEST]"
	exit 1
fi
if [ $# -eq 6 ]; then
	SCRIPT_TO_TEST=$6
fi

./install/db_install.sh $1 $2 $3 $4

for j in `seq 1 $BIG_TEST_COUNT`;
do
	BEGIN=$(date +%s)
	for i in `seq 1 $LITTLE_TEST_COUNT`;
	do 
		./scripts/$SCRIPT_TO_TEST $5 $TMP_PATH/config.json >> /dev/null
	done;
	END=$(date +%s)
	CURRENT=$(bc <<< "scale=4;($END-$BEGIN)/$LITTLE_TEST_COUNT")
	echo $CURRENT
	GLOBAL=$(bc <<< "scale=4;$GLOBAL+$END-$BEGIN")
done;
echo " > $(bc <<< "scale=4;$GLOBAL/($BIG_TEST_COUNT*$LITTLE_TEST_COUNT)")"
rm -fr $TMP_PATH

./install/db_uninstall.sh $1 $2 $3 $4

