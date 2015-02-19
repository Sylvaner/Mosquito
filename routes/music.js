/** 
 * Mosquito Media Player. 
 * one line to give the program's name and an idea of what it does.
 * Copyright (C) 2015 - Sylvain Dangin
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
**/
/**
 * Class: Server route Music
 */
var fs = require('fs');
var db;
var debug;

/**
 * Function: init
 * 
 * Parameters:
 *  connection - Database connection.
 */
exports.init = function(connection) {
    if (typeof settings != 'undefined')
        debug = settings.debug;
    else
        debug = false;
    db = connection;
}

/**
 * Function: get
 * 
 * Route format : /music/fileId
 * 
 * Parameters:
 *  req - Query object.
 *  res - Object with callback for stream.
 *
 * Returns:
 *  res.send(data) - Query data.
 */
exports.get = function(req, res) {
    // Check if fileId exist
    if (req.params.fileId != null) {
        // Get music file path
        if (debug)
            console.log('Route : /music');
        db.getFilePath(req.params.fileId, function(filePath) {
            if (debug)
                console.log('/music play : fileId' + req.params.fileId + " ; filePath " + filePath);
            // Test if file is in database
            if (filePath != null) {
                // Test if file exists
                if (fs.existsSync(filePath))
                {
                    // Launch stream
                    var stat = fs.statSync(filePath);

                    res.writeHead(200, {
                        'Content-Type': 'audio',
                        'Content-Length': stat.size
                    });

                    var readStream = fs.createReadStream(filePath);
                    readStream.on('data', function(data){
                      res.write(data);
                    });
                    readStream.on('end', function(){
                      res.end();
                    });
                }
                else
                    console.log('File not found : '+filePath);
            }
        });
    }
}
