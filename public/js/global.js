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
 * Class: Global functions
 */

/**
 * Function: ajaxQuery
 *
 * Launch a query to the server.
 *
 * Parameters:
 *  ajaxData - Data to send.
 *  successCallback - Function called on success.
 */
function ajaxQuery(ajaxData, successCallback) {
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
}
;

/**
 * Function: rotateItem
 * 
 * Rotate an item on Y axis.
 * 
 * Parameters:
 *  item - Item to rotate.
 *  duration - Duration of animation.
 *  from - Start rotation.
 *  to - End rotation.
 *  callback - Function called when animation is finish.
 */
function rotateItem(item, duration, from, to, callback) {
    $({deg: from}).animate({deg: to}, {
        step: function(deg) {
            item.css('-moz-transform', 'rotateY(' + deg + 'deg)');
            item.css('-webkit-transform', 'rotateY(' + deg + 'deg)');
            item.css('-o-transform', 'rotateY(' + deg + 'deg)');
            item.css('transform', 'rotateY(' + deg + 'deg)');
        },
        duration: duration,
        complete: function() {
            if (callback)
                callback();
        }
    });
}

function imgDivChg(newImg, itemSelector) {
    var toRotate = $(itemSelector)
    rotateItem(toRotate, 100, 0, 90, function(){
        $(itemSelector+' img').attr('src', newImg);
        rotateItem(toRotate, 100, -90, 0, null);
    });
}