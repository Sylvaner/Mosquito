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
 * Class: Server module db
 */

var mysql = require('mysql');
var config = require('../config/config.json');
var async = require('async');
var connected = false;
var connection;
var fileRowsLimit = 999999;

// Constant: ORDER_BY_GENRE
// Sort menu by genre -> artist -> album.
var ORDER_BY_GENRE = 1;
// Constant: ORDER_BY_ARTIST
// Sort menu by artist -> album.
var ORDER_BY_ARTIST = 2;
// Constant: ORDER_BY_YEAR
// Sort menu by year -> artist -> album.
var ORDER_BY_YEAR = 3;

/**
 * Function: connect
 * 
 * Connect to the database.
 *
 * Public
 * 
 * Parameters:
 *  database - Name of the database.
 *  callback - Function called on connection.
 * 
 * Returns:
 *  callback(boolean) - State of the connection. 
 */
function connect(database, callback) {
    if (!callback || typeof callback == 'undefined')
    {
        callback = database;
        database = config.database;
    }

    connection = mysql.createConnection({host: config.host, user: config.user, password: config.password});
    connection.connect(function(error) {
        if (error)
            throw error;

        // Connect to the database
        connection.query("USE " + database, function(error) {
            connected = (error == null);
            if (callback)
                callback(connected);
        });
    });
}

/**
 * Function: isConnected
 * 
 * Get the state of the connection.
 *
 * Public
 * 
 * Returns:
 *  boolean - State of the connection. 
 */
function isConnected() {
    return connected;
}

/**
 * Function: disconnect
 * 
 * Disconnect and destroy connection.
 *
 * Public
 * 
 * Parameters:
 *  callback - Function called on disconnect.
 * 
 * Returns:
 *  callback(boolean) - State of the connection. 
 */
function disconnect(callback) {
    connection.destroy();
    connected = false;
    if (callback)
        callback(connected);
}

/**
 * Function: getConnection
 * 
 * Get the connection for query.
 *
 * Public
 * 
 * Returns:
 *  Connection - Connection to the database.
 */
function getConnection() {
    return connection;
}

/**
 * Function: escapeStr
 * 
 * Escape string for SQL queries.
 *
 * Public
 * 
 * Parameters:
 *  string - Escaped string.
 */
function escapeStr(data) {
    if (typeof data == 'string')
    {
        data = data.replace(/\\/g, "\\\\");
        data = data.replace(/'/g, '\\\'');
        data = data.replace(/\"/g, '\\"');
        data = data.replace(/%/g, '\\%');
    }
    return data;
}

/**
 * Function: setFileRowsLimit
 *
 * Set limit for number of files in queries.
 *
 * Parameters
 *  limit - Limit of rows.
 */
function setFileRowsLimit(limit)
{
    fileRowsLimit = limit;
}

/**
 * Function: getGenreList
 * 
 * Get the list of genre in database.
 * 
 * Public
 * 
 * Parameters:
 *  callback - Function called on result.
 * 
 * Returns:
 *  callback(array) - Array [[id, name],...]
 */
function getGenreList(callback) {
    if (callback) {
        connection.query("SELECT id, name FROM genre ORDER BY CASE WHEN name = 'Unknow' THEN 1 ELSE 0 END ASC, name ASC", function(error, rows) {
            if (error)
                throw error;
            callback(rows);
        });
    }
}

/**
 * Function: parseChoices
 * 
 * Parse all previous choices.
 * 
 * Private
 * 
 * Parameters:
 *  choices - Array[{data: int, title: string},...]
 * 
 * Returns:
 *  array - Array with parsed data.
 */
function parseChoices(choices)
{
    if (choices != null)
    {
        for (i = 0; i < choices.length; ++i)
        {
            choices[i].data = parseInt(choices[i].data);
            choices[i].title = exports.escapeStr(choices[i].title);
        }
    }
    return choices;
}

/**
 * Function: getMenuList
 * 
 * Get the list of item for menu.
 * 
 * Public
 * 
 * Parameters:
 *  order - Order of menu
 *  level - Depth of the menu.
 *  choices - Previous choices.
 *  callback - Function called for get results.
 * 
 * Returns:
 *  callback(JSon) - List of items [{data: int, title: string},...].
 * 
 * See also:
 *  <ORDER_BY_GENRE>, <ORDER_BY_ARTIST>, <ORDER_BY_YEAR>
 */
function getMenuList(order, level, choices, callback) {
    if (callback) {
        var last = false;
        var choices = parseChoices(choices);
        var query = "";
        if (order == ORDER_BY_GENRE) {
            switch (level) {
                case 0:
                    query = "SELECT id AS data, name AS title FROM genre ORDER BY CASE WHEN name = 'Unknow' THEN 1 ELSE 0 END ASC, name ASC";
                    break;
                case 1:
                    query = "SELECT COUNT(id) AS data, artist AS title FROM audio_file WHERE genre_fk = " + choices[0].data + " GROUP BY artist ORDER BY artist";
                    break;
                case 2:
                    query = "SELECT COUNT(id) AS data, album AS title FROM audio_file WHERE genre_fk = " + choices[0].data + " AND artist = '" + choices[1].title + "' GROUP BY album ORDER BY year, album";
                    last = true;
                    break;
            }
        }
        else if (order == ORDER_BY_ARTIST) {
            switch (level) {
                case 0:
                    query = "SELECT DISTINCT COUNT(id) AS data, artist AS title FROM audio_file GROUP BY artist ORDER BY artist";
                    break;
                case 1:
                    query = "SELECT DISTINCT COUNT(id) AS data, album AS title FROM audio_file WHERE artist = '" + choices[0].title + "' GROUP BY album ORDER BY album";
                    last = true;
                    break;
            }
        }
        else {
            switch (level) {
                case 0:
                    query = "SELECT COUNT(year) AS data, year AS title FROM audio_file GROUP BY year ORDER BY CASE WHEN year IS NULL THEN 1 ELSE 0 END, year";
                    break;
                case 1:
                    query = "SELECT COUNT(artist) AS data, artist AS title FROM audio_file WHERE year = '" + choices[0].title + "' GROUP BY artist ORDER BY artist";
                    break;
                case 2:
                    query = "SELECT COUNT(album) AS data, album AS title FROM audio_file WHERE year = '" + choices[0].title + "' AND artist = '" + choices[1].title + "' GROUP BY album ORDER BY album";
                    last = true;
                    break;
            }
        }
        if (query == '')
            callback(null);
        connection.query(query, function(error, rows) {
            callback(rows, last);
        });
    }
}

/**
 * Function: getFileList
 * 
 * Get the list of selected files.
 * 
 * Public
 * 
 * Parameters:
 *  order - Order of menu
 *  level - Depth level.
 *  choices - Previous choices.
 *  callback - Function called for send results.
 * 
 * Returns:
 *  callback(JSon) - List of items [{id: int, track: int, title: string, artist: string, album: string, year: int, path: string},...].
 * 
 * See also:
 *  <ORDER_BY_GENRE>, <ORDER_BY_ARTIST>, <ORDER_BY_YEAR>
 */
function getFileList(order, level, choices, callback) {
    if (callback) {
        choices = parseChoices(choices);
        select = "SELECT id, track, title, artist, album, year, path FROM audio_file "
        where = "";
        orderBy = " ORDER BY album, track, artist LIMIT " + fileRowsLimit;
        if (level > 0) {
            if (order == ORDER_BY_GENRE) {
                if (level >= 1)
                    where = "genre_fk = " + choices[0].data;
                if (level >= 2)
                    where = where + " AND artist = '" + choices[1].title + "'";
                if (level >= 3)
                    where = where + " AND album = '" + choices[2].title + "'";
            }
            else if (order == ORDER_BY_ARTIST) {
                if (level >= 1)
                    where = "artist = '" + choices[0].title + "'";
                if (level == 2)
                    where = where + " AND album = '" + choices[1].title + "'";
            }
            else {
                if (level >= 1)
                    where = "year = '" + choices[0].title+"'";
                if (level >= 2)
                    where = where + " AND artist = '" + choices[1].title + "'";
                if (level == 3)
                    where = where + " AND album = '" + choices[2].title + "'";
            }
            query = select + "WHERE " + where + orderBy;
        }
        else
            query = select + orderBy;
        connection.query(query, function(error, rows) {
            callback(rows);
        });
    }
}

/**
 * Function: getSearchFileList
 * 
 * Get the list of file from search value.
 * 
 * Public
 * 
 * Parameters:
 *  search - Search pattern.
 *  callback - Function called for send results.
 * 
 * Returns:
 *  callback(JSon) - List of items [{id: int, track: int, title: string, artist: string, album: string, year: int, path: string},...].
 */
function getSearchFileList(search, callback) {
    if (callback) {
        var search = exports.escapeStr(search);
        select = "SELECT id, track, title, artist, album, year, path FROM audio_file "
        where = "WHERE artist LIKE '%" + search + "%' OR title LIKE '%" + search + "%' OR album LIKE '%" + search + "%'";
        orderBy = " ORDER BY album, track, artist LIMIT "+fileRowsLimit;
        var query = select + where + orderBy;

        connection.query(query, function(error, rows) {
            callback(rows);
        });
    }
}

/**
 * Function: getFileData
 * 
 * Get the path of file in database.
 * 
 * Parameters: 
 *  fileId - Id of the file in the database.
 *  callback - Function called for send results.
 *
 * Returns:
 *  callback(string) - file data or null.
 */
function getFileData(fileId, callback)
{
    fileId = parseInt(fileId);
    connection.query("SELECT id, track, title, artist, album FROM audio_file WHERE id = " + fileId, function(error, rows) {
        if (callback)
            callback(rows[0]);
    });
}

/**
 * Function: getFilePath
 * 
 * Get the path of file in database.
 * 
 * Parameters: 
 *  fileId - Id of the file in the database.
 *  callback - Function called for send results.
 *
 * Returns:
 *  callback(string) - Path of the file or null.
 */
function getFilePath(fileId, callback)
{
    fileId = parseInt(fileId);
    connection.query("SELECT path FROM audio_file WHERE id = " + fileId, function(error, rows) {
        if (callback)
            callback(rows[0].path);
    });
}

/**
 * Function: getSettingValue
 *
 * Get the value of setting by name.
 *
 * Parameters:
 *  name - Name of the setting.
 *  callback - Function called for send results.
 *
 * Returns:
 *  callback(string) - Value of the setting.
 */
function getSettingValue(name, callback)
{
    name = exports.escapeStr(name);
    connection.query("SELECT value FROM settings WHERE name = '" + name + "'", function(error, rows) {
        if (callback)
            callback(rows[0].value);
    });
}

/**
 * Function: setSettingValue
 *
 * Set a new value of a setting.
 *
 * Parameters:
 *  name - Name of the setting.
 *  value - New value.
 *  callback - Function called when setting is changed.
 */
function setSettingValue(name, value, callback)
{
    name = exports.escapeStr(name);
    value = exports.escapeStr(value);
    connection.query("UPDATE settings SET value = '" + value + "' WHERE name = '" + name + "'", function(error) {
        if (callback)
            callback(true);
    });
}

/**
 * Function: getAllSettings
 *
 * Return all settings from table.
 *
 * Parameters:
 *  callback - Function called when setting is changed.
 *
 * Returns:
 *  JSON - data.NAME = VALUE
 */
function getAllSettings(callback)
{
    connection.query("SELECT name, value FROM settings", function(error, rows) {
        var settings = {};

        for (var i = 0; i < rows.length; ++i)
            settings[rows[i].name] = rows[i].value;
        if (callback)
            callback(settings);
    });
}

/**
 * Function: deleteOldFiles
 * 
 * Delete all files from previous scans.
 * 
 * Parameters:
 *  callback - Function called when files is deleted.
 */
function deleteOldFiles(callback) {
    this.getSettingValue('last_scan_code', function(value) {
        connection.query("DELETE FROM audio_file WHERE scan_code <> '" + value + "'", function(error) {
            if (callback)
                callback();
        });
    });
}

/**
 * Function: deleteUnusedGenre
 * 
 * Delete all unused genre from database.
 * 
 * Parameters:
 *  callback - Function called when unused genres are deleted.
 */
function deleteUnusedGenre(callback) {
    this.getGenreList(function(genreList) {
        funcList = [];
        var index = 0;
        for (var i = 0; i < genreList.length; ++i)
        {
            funcList.push(function(callback) {
                connection.query("SELECT count(id) AS total FROM audio_file WHERE genre_fk = " + genreList[index].id + " GROUP BY id", function(error, rows) {
                    if (rows.length == 0)
                    {
                        connection.query("DELETE FROM genre WHERE id = " + genreList[index].id, function(error) {
                            ++index;
                            callback();
                        });
                    }
                    else
                    {
                        ++index;
                        callback();
                    }
                });
            });
        }
        async.series(funcList, function(error) {
            if (callback)
                callback();
        });
    });
}

/**
 * Function: getFilesCount
 * 
 * Get count of files from the last / current scan.
 * 
 * Parameters:
 *  callback - Function called for result.
 */
function getFilesCount(callback) {
	connection.query("SELECT COUNT(*) AS total FROM audio_file, settings WHERE audio_file.scan_code = settings.value AND settings.name = 'last_scan_code'", function(error, rows) {
		if (callback)
			callback(rows[0].total);
	});
}

exports.ORDER_BY_GENRE = ORDER_BY_GENRE;
exports.ORDER_BY_ARTIST = ORDER_BY_ARTIST;
exports.ORDER_BY_YEAR = ORDER_BY_YEAR;

exports.connect = connect;
exports.isConnected = isConnected;
exports.disconnect = disconnect;
exports.getConnection = getConnection;
exports.escapeStr = escapeStr;
exports.setFileRowsLimit = setFileRowsLimit;
exports.getGenreList = getGenreList;
exports.getMenuList = getMenuList;
exports.getFileList = getFileList;
exports.getFileData = getFileData;
exports.getFilePath = getFilePath;
exports.getSearchFileList = getSearchFileList;
exports.getSettingValue = getSettingValue;
exports.setSettingValue = setSettingValue;
exports.getAllSettings = getAllSettings;
exports.deleteOldFiles = deleteOldFiles;
exports.deleteUnusedGenre = deleteUnusedGenre;
exports.getFilesCount = getFilesCount;
