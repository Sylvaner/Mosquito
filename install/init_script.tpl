#!/bin/sh
### BEGIN INIT INFO
# Provides: mosquito
# Required-Start : $local_fs $remote_fs $mysql
# Required-Stop  : $local_fs $remote_fs $mysql
# Default-Start : 2 3 4 5
# Default-Stop : 0 1 6
# Short-Description : Mosquito Player initscript
# Description : Launch Mosquito Player server
### END INIT INFO

RETURN_VALUE=0
SERVER_DIR="##########"
LOCK="/tmp/mosquito.lock"
LOG="/var/log/mosquito"

do_start() {
	if [ ! -f $LOCK ]; then
		$$$$$$$$$$ $SERVER_DIR/app.js >> $LOG &
		PID=$!
		if [ $PID ]; then
			echo $PID > $LOCK
		fi
	else
		echo "Mosquito Player is already started."
		RETURN_VALUE=1
	fi	
}

do_stop() {
	kill -s KILL `cat $LOCK`
	rm -fr $LOCK
}

case "$1" in
	start)
		do_start
		;;
	stop)
		do_stop
		;;
	restart)
		do_stop
		do_start
		;;
	*)
		echo "mosquito start|restart|stop"
		;;
esac

exit $RETURN_VALUE
