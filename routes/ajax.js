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
 * Class: Server route Ajax
 */
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
};

/**
 * Function: post
 * 
 * Parameters:
 *  req - AQ object.
 *  res - Object with callback for result.
 *
 * Returns:
 *  res.send(data) - Query data.
 */
exports.post = function(req, res) {
    if (req.body.query != 'undefined') {
        queryData = req.body.queryData;

        switch (req.body.query)
        {
            case 'getMenuList':
                getMenuList(res, queryData);
                break;
            case 'getFileList':
                getFileList(res, queryData);
                break;
            case 'getFileData':
                getFileData(res, queryData);
                break;
            case 'getSearchFileList':
                getSearchFileList(res, queryData.search);
                break;
            case 'getSettingValue':
                getSettingValue(res, queryData.name);
                break;
            case 'setSettingValue':
                setSettingValue(res, queryData.name, queryData.value);
                break;
            case 'getFilesCount':
                getFilesCount(res);
                break;
        }
    }
};

/**
 * Function: getMenuList
 * 
 * Parameters:
 *  data - Query data.
 *  res - Object with callback for result.
 * 
 * Returns:
 *  res.send(JSON) - {list: LIST_FOR_MENU, isLast: boolean}
 */
function getMenuList(res, data) {
    if (debug)
        console.log('AQ (getMenuList) : ' + data.order + ' ; ' + data.level + ' ; ' + data.choices);
    db.getMenuList(data.order, data.level, data.choices, function(list, last) {
        res.json({
            list: list,
            isLast: last
        });
    });
}

/**
 * Function: getMenuList
 * 
 * Parameters:
 *  data - Query data.
 *  res - Object with callback for result.
 * 
 * Returns:
 *  res.send(JSON) - List of items [{data: int, title: string},...].
 */
function getFileList(res, data) {
    if (debug)
        console.log('AQ (getFileList) : ' + data.order + ' ; ' + data.level + ' ; ' + data.choices);
    db.getFileList(data.order, data.level, data.choices, function(list) {
        res.json(list);
    });
}

/**
 * Funcgion: getFileData
 * 
 * Parameters:
 *  fileId - Id of the file.
 *  res - Object with callback for result.
 * 
 * Returns:
 *  res.send(JSON) - List of items [{data: int, title: string},...].
 */
function getFileData(res, fileId) {
    db.getFileData(fileId, function(data) {
        res.json(data);
    });
}

/**
 * Function: getSearchFileList
 * 
 * Parameters:
 *  search - Search word.
 *  res - Object with callback for result.
 * 
 * Returns:
 *  res.send(JSON) - List of items [{data: int, title: string},...].
 */
function getSearchFileList(res, search) {
    if (debug)
        console.log('AQ (getSearchFileList) : ' + search);
    db.getSearchFileList(search, function(list) {
        res.json(list);
    });
}

/**
 * Function: getSettingValue
 * 
 * Parameters:
 *  res - Object with callback for result.
 *  name - Search word.
 * 
 * Returns:
 *  res.send(JSON) - {setting: VALUE}
 */
function getSettingValue(res, name) {
    if (debug)
        console.log('AQ (getSettingValue) : ' + name);
    db.getSettingValue(name, function(value) {
        res.json({setting: value});
    });
}

/**
 * Function: setSettingValue
 * 
 * Parameters:
 *  res - Object with callback for result.
 *  name - Setting name.
 *  value - Setting value.
 */
function setSettingValue(res, name, value) {
    if (debug)
        console.log('AQ (setSettingValue) : ' + name + ' = ' + value);
    db.setSettingValue(name, value, function(value) {
        res.json({return: value});
    });
}

/**
 * Function: getFilesCount
 * 
 * Parameters:
 *  res - Object with callback for result.
 * 
 * Returns:
 *  res.send(JSON) - {count: VALUE}
 */
function getFilesCount(res) {
    if (debug)
        console.log('AQ (getFilesCount)');
    db.getFilesCount(function(value) {
        res.json({count: value});
    });
}
