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
 * Class: Mobile client application
 */

var TYPE_MENU = 1;
var TYPE_FILE = 2;
var menuOrder = 1;
var contentDiv = null;
var contentList = null;
var playerState = false;
var playList = null;
var playIndex = 0;
var audio = null;
var menuChoices = [];

/**
 * Function: onReady
 *
 * Function called when page is ready.
 * Initialize the application.
 */
$(document).ready(function () {
  contentDiv = $('#content');
  contentList = $('#content-list');
  audio = $('#audio');

  $('#play-button').click(function () {
    playButton();
  });
  $('#next-button').click(function () {
    next();
  });
  $('#previous-button').click(function () {
    previous();
  });
  $('#back-button').click(function () {
    back();
  });
  audio.on('ended', function () {
    next();
  });
  loadData(1, 0);
});

/**
 * Function: showData
 * 
 * Show data as a list.
 * 
 * Parameters:
 *  type - Type of data.
 *  data - Data to show.
 */
function showData(type, data) {
  // Hide old data
  contentList.fadeOut(200, function () {
    contentList.empty();
    $('.iScrollVerticalScrollbar').remove();
    if (type == TYPE_MENU)
      listData = data.list;
    else
    {
      // Always show player on files
      $('#player-command').fadeIn();
      listData = data;
      playList = data;
    }

    // Back button
    if (menuChoices.length == 0)
      $('#back-button').fadeOut();
    else if (menuChoices.length == 1)
      $('#back-button').fadeIn();

    listData.forEach(function (d) {
      // Add last selection to choices
      menuChoices.push(d);

      var span = $('<span>')
      var title = d.title;
      if (d.title == '')
        title = locale.unknow;
      span.append(title);

      // Add list item
      var li = $('<li>')
              .attr('data-choice', JSON.stringify(menuChoices))
              .attr('data-islast', data.isLast ? 1 : 0)
              .click(function () {
                menuClick(type, $(this).attr('data-choice'), $(this).attr(
                        'data-islast'));
              });

      li.append(span).appendTo(contentList);
      // Remove last selection from choices
      menuChoices.pop();
    });
    contentList.fadeIn(200, function () {
      new IScroll('#content', {
        mouseWheel: true,
        scrollbars: true,
        // Click twice on desktop if true
        click: !!('ontouchstart' in window)});
    });
  });
}

/**
 * Function: loadData
 * 
 * Get data from query (Ajax).
 * 
 * Parameters:
 *  type - Type of data.
 */
function loadData(type) {
  var q = {
    order: menuOrder,
    level: menuChoices.length,
    choices: menuChoices
  };
  var query = {
    queryData: q
  };

  if (type == TYPE_MENU)
    query.query = 'getMenuList';
  else
    query.query = 'getFileList';

  ajaxQuery(query, function (returnData) {
    showData(type, returnData);
  });
}

/**
 * Function: menuClick
 * 
 * Called on user click in list.
 * 
 * Parameters:
 *  type - Type of list.
 *  choice - Data of selected item.
 *  isLast - True if is the last level (file).
 */
function menuClick(type, choice, isLast) {
  console.log('boubou');
  choice = JSON.parse(choice);
  if (type == TYPE_MENU) {
    // Make a choice
    menuChoices = choice;
    if (menuChoices.length > 0)
      $('#title').text(menuChoices[menuChoices.length - 1].title);
    else
      $('#title').text('Mosquito');
    newType = TYPE_MENU;
    if (isLast == 1)
      newType = TYPE_FILE;
    loadData(newType, menuChoices.length);
  }
  else {
    // Play a song
    var id = choice[choice.length - 1].id;
    var index = 0;
    for (var i = 0; i < playList.length; ++i)
      if (playList[i].id == id) {
        index = i;
        break;
      }
    play(index);
    setPlayButtonImg();
  }
}

/**
 * Function: selectSong
 * 
 * Show selected song in list.
 * 
 * Parameters:
 *  index - Index of the selected song.
 */
function selectSong(index) {
  $('#content .selected').removeClass('selected');
  $(contentList.children()[index]).addClass('selected');
}

/**
 * Function: next
 * 
 * Play next song.
 */
function next() {
  if (playerState) {
    playIndex = (playIndex + 1) % playList.length;
    play(playIndex);
  }
}

/**
 * Function: previous
 * 
 * Play previous song.
 */
function previous() {
  if (playerState) {
    if (playIndex > 0)
      playIndex = playIndex - 1;
    else
      playIndex = playList.length - 1;
    play(playIndex);
  }
}

/**
 * Function: back
 * 
 * Go back in user interface.
 */
function back() {
  if (menuChoices.length > 0)
  {
    menuChoices.pop();
    menuClick(TYPE_MENU, JSON.stringify(menuChoices), 0);
    if (!playerState)
      $('#player-command').fadeOut();
  }
}

/**
 * Function: playButton
 * 
 * Called when user click on play button.
 */
function playButton() {
  if (playerState) {
    audio.trigger('pause');
    playerState = false;
  }
  else
    play(playIndex);
  setPlayButtonImg();
}

/**
 * Function: setPlayButtonImg
 * 
 * Change the play button
 * 
 * Parameters:
 *  state - Play state.
 */
function setPlayButtonImg()
{
  var imgDest = '';
  if (playerState)
    imgDest = '/images/' + theme + '/pause.png';
  else
    imgDest = '/images/' + theme + '/play.png';
  imgDivChg(imgDest, '#play-button');
}

/**
 * Function: play
 * 
 * Load and play a song.
 * 
 * Parameters:
 *  index - Index in player list.
 */
function play(index) {
  if (typeof index === 'undefined')
    index = 0;

  audio.empty();
  $('<source>').attr('src', '/music/' + playList[index].id).appendTo(audio);
  audio.trigger('pause');
  audio.trigger('load');
  audio.trigger('play');
  playIndex = index;
  selectSong(playIndex);
  playerState = true;
}
