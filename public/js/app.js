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
 * Class: Client application
 */

var player = new Player();
var ui = new UI();
var settings = new Settings();
var shortcuts = new Shortcuts();
var socket;

var currentOrder = 1;

/**
 * Function: onReady
 *
 * Function called when page is ready.
 * Initialize the application.
 */
$(document).ready(function() {
    if (typeof themeReady == 'function')
        themeReady();

    socket = io();

    settings.init();
    player.initEvents();

    ui.initEvents();
    ui.initContent();

    shortcuts.init($(document));
});

/**
 * Function: ajaxQuery
 *
 * Launch a query to the server.
 *
 * Parameters:
 *  ajaxData - Data to send.
 *  successCallback - Function called on success.
 */
ajaxQuery = function(ajaxData, successCallback) {
    var proxyCallback = successCallback;
    if (appDebug)
    {
        proxyCallback = function(data) {
            console.log('Ajax query');
            console.log('Send : ');
            console.log(ajaxData);
            console.log('Receive : ');
            console.log(data);
            if (successCallback != null)
                successCallback(data);
        };
    }
    $.ajax({
        url: "ajax",
        type: "POST",
        data: JSON.stringify(ajaxData),
        dataType: "json",
        cache: false,
        timeout: 5000,
        contentType: "application/json",
        success: proxyCallback,
        error: function(xhr, ajaxOptions, thrownError) {
            console.log(ajaxData);
            console.log(xhr.status);
            console.log(xhr.resoponseText);
            console.log(xhr.error);
            console.log(ajaxOptions);
            console.log(thrownError);
        }
    });
};


