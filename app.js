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
 * Class: Serveur launch
 */
// Modules
var http = require('http');
var express = require('express');
var io = require('socket.io');
var jade = require('jade');
var fs = require('fs');
var i18n = require('i18n');
var bodyParser = require('body-parser');
var exec = require('child_process').exec;

// Routes
var ajax = require('./routes/ajax');
var music = require('./routes/music');

// Objects
var db = require('./modules/db');
var config = require('./config/config.json');
var server = null;
var io = null;
global.settings = null;

/**
 * Function: launchServer
 *
 * Configure and launch the server.
 */
function launchServer()
{
    app = express();
    server = http.createServer(app);
    app.set('view engine', 'jade');
    app.use(express.static(__dirname + '/public'));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(i18n.init);
    server.listen(config.listenPort);
}

/**
 * Function: addRoutes
 *
 * Add all routes from other files.
 */
function addRoutes()
{
    ajax.init(db);
    app.post('/ajax', ajax.post);
    music.init(db);
    app.get('/music/:fileId', music.get);
}

/**
 * Function: testMobile
 *
 * Test if browser is a mobile.
 *
 * Parameters:
 *  userAgent - String of user agent.
 *
 * Returns:
 *  boolean - True if browser is on mobile.
 */
function testMobile(userAgent)
{
    var ua = userAgent.toLowerCase();
    if (ua.indexOf('mobile') > -1)
        return true;
    if (ua.indexOf('android') > -1)
        return true;
    return false;
}

/**
 * Function: setHomePage
 *
 * Set home page.
 */
function setHomePage()
{
    app.get('/', function(req, res) {
        if (global.settings.debug)
            console.log('Connection: show home page');


        if (global.settings.mobileTheme != '' && testMobile(req.header('user-agent'))) {
            var theme = config.mobileTheme;
            var cssArray = ['reset', 'global', global.settings.mobileTheme + '/theme'];
            var jsArray = ['jquery.min', 'global', 'iscroll', 'mob-app'];
        }
        else {
            var theme = global.settings.theme;
            var cssArray = ['reset', 'global', 'jquery-ui.min', global.settings.theme + '/theme-pos', global.settings.theme + '/theme'];
            var jsArray = ['jquery.min', 'jquery-ui', 'global', global.settings.theme + '/theme', 'settings', 'player', 'ui', 'shortcuts', '/socket.io/socket.io.js', 'app'];
        }

        app.set('views', "" + __dirname + "/views/" + theme);
        res.render('global', {
            cssArray: cssArray,
            jsArray: jsArray,
            theme: global.settings.theme,
            lang: global.settings.locale,
            appDebug: global.settings.debug,
            locale: JSON.stringify(i18n.getCatalog()[global.settings.locale])
        });
    });
}

/**
 * Function: configSocket
 *
 * Configure socket.io
 */
function configSocket()
{
    io = require('socket.io').listen(server);
    io.sockets.on('connection', function(socket) {
        socket.on('launchLibraryUpdate', function(deleteOldFiles) {
            if (global.settings.debug)
                console.log('Launch library update');
            db.getSettingValue('path', function(path) {
                if (global.settings.debug)
                    console.log("Execute command : python3 scripts/scan.py '" + path + "' config/config.json");
                exec("python3 scripts/scan.py '" + path + "' config/config.json", function(error, stdout, stderr) {
                    if (global.settings.debug)
                        console.log('Library updated');
                    db.deleteUnusedGenre(function() {
                        if (global.settings.debug)
                            console.log('Delete unused genres');
                        if (deleteOldFiles)
                        {
                            if (global.settings.debug)
                                console.log('Delete old files');
                            db.deleteOldFiles(function() {
                                socket.emit('libraryUpdated', {count: parseInt(stdout), deleteOldFiles: deleteOldFiles});
                            });
                        }
                        else
                            socket.emit('libraryUpdated', {count: parseInt(stdout), deleteOldFiles: deleteOldFiles});
                    });
                });
            });
        });
    });
}

/**
 * Function: configApp
 * 
 * Configure application.
 * 
 * Parameters:
 *  readSettings - Read settings from database.
 */
function configApp(readSettings)
{
    global.settings = readSettings;
    global.settings.debug = (global.settings.debug == 1) ? true : false;
    global.settings.locale = config.locale;
    global.settings.theme = config.theme;
    global.settings.mobileTheme = config.mobileTheme;

    i18n.configure({
        locales: [global.settings.locale],
        defaultLocale: global.settings.locale,
        directory: __dirname + config.localesDirectory
    });
}

/**
 * Function: start
 *
 * Start server.
 * Connect to database and get settings.
 */
function start() {
    db.setFileRowsLimit(config.filesLimit);
    db.connect(function(connected) {
        if (!connected) {
            console.log("Problem with connection to the database.");
            process.exit();
        }
        else
        {
            db.getAllSettings(function(readSettings) {
                configApp(readSettings);
                if (global.settings.debug)
                    console.log(global.settings);
                launchServer();
                addRoutes();
                setHomePage();
                configSocket();
            });
        }
    });
}

start();
