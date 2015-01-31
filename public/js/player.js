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
 * Class: Client Player
 */

var REPEAT_OFF = 0;
var REPEAT_ON = 1;
var REPEAT_ONE = 2;

function Player() {
    this.audio = $('#audio');
    this.playerListId = '#player-list';
    this.playerList = $(this.playerListId);
    this.currentPlayState = false;
    this.shuffle = false;
    this.repeatState = REPEAT_OFF;
    
    /**
     * Function: initEvents
     *
     * Initialize events of controls.
     *
     */
    this.initEvents = function()
    {
        $('#play-button').click($.proxy(this.playButton, this));
        $('#next-button').click($.proxy(function(){this.nextMusic(true);}, this));
        $('#previous-button').click($.proxy(this.previousMusic, this));
        $('#player-option-shuffle').click($.proxy(this.toggleShuffle, this));
        $('#player-option-repeat').click($.proxy(this.chgRepeatState, this));
        this.audio.on('ended', $.proxy(function() {
            this.nextMusic(false);
        }, this));
    }

    /**
     * Function: addOption
     * 
     * Add option to select object.
     * 
     * Parameters:
     *  select - Select object
     *  value - Value of option.
     *  title - Title of option.
     */
    this.addOption = function(select, value, title)
    {
        select.append(
                $('<option>')
                .attr('value', value)
                .append(title)
                );
    }

    /**
     * Function: addFile
     * 
     * Add a file to player list and play it.
     * 
     * Parameters:
     *  fileId - Id of the file.
     */
    this.addFile = function(fileId, title) {
        this.addOption(this.playerList, fileId, title);
        var nbItems = this.playerList.children().size();
        this.launchFile(nbItems - 1, true);
    }

    /**
     * Function: addFilesList
     * 
     * Add a list of files to player list and play the first.
     */
    this.addFilesList = function(filesList)
    {
        var startIndex = this.playerList.children().size();
        if ($.isArray(filesList))
        {
            for (var i = 0; i < filesList.length; ++i) {
                this.addOption(this.playerList, filesList[i].id, filesList[i].title);
            }
            if (!this.currentPlayState)
                this.launchFile(startIndex, true);
        }
    }

    /**
     * Function: launchFile
     * 
     * Load file for audio HTML.
     *
     * Parameters:
     *  index - Index in list.
     *  startPlay - Start to playing the music.
     */
    this.launchFile = function(index, startPlay) {
        self = this;
        if ($(this.playerListId + ' option').length > index) {
            var option = $(this.playerListId + ' option').get(index)
            var fileId = $(option).val();
            $(this.playerListId + ' .selected-file').removeClass('selected-file');
            $(option).addClass('selected-file');
            if (appDebug)
                console.log('Launch file ' + fileId);
            this.audio.empty();
            $('<source>').attr('src', '/music/' + fileId).appendTo(this.audio);
            this.audio.trigger('pause');
            this.audio.trigger('load');
            this.audio.trigger('play');
            this.changePlayState(true);
            ajaxQuery({query: 'getFileData', queryData: fileId}, $.proxy(this.showFileData, this));
        }
    }

    /**
     * Function: launchFirstFile
     *
     * Load first file from the list.
     */
    this.launchFirstFile = function() {
        if (this.playerList.children().length > 0)
            this.launchFile(0, true);
    }

    /**
     * Function: launchFileFromCurrent
     *
     * Launch file with step from current file
     *
     * Parameters:
     *  step - Step from current file (1: next, -1: previous)
     *  startPLay - Start to play file.
     */
    this.launchFileFromCurrent = function(step, startPlay) {
        var children = this.playerList.children();
        var currentIndex = this.playerList.find(".selected-file").index();
        var length = children.length;

        var indexToLoad = (currentIndex + step) % length
        this.launchFile(indexToLoad, startPlay);
    }

    /**
     * Function: playButton
     *
     * Called by #play-button.
     */
    this.playButton = function()
    {
        // Pause if playing
        if (this.currentPlayState)
            this.pauseMusic();
        else
        {
            // If no file in playlist, add all files and play
            if (this.playerList.children().length == 0)
                // Load all files from files list
                ui.addAllButton();
            else
            {
                // If no file selected, play first
                if ($(this.playerListId + ' .selected-file').length == 0)
                    this.launchFirstFile();
                else
                {
                    // Unpause current music
                    this.audio.trigger('play');
                    this.changePlayState(true);
                }
            }
        }
    }

    /**
     * Function: pauseMusic
     *
     * Pause if music is player.
     */
    this.pauseMusic = function() {
        this.audio.trigger('pause');
        this.changePlayState(false);
    }

    /**
     *
     * Function: nextMusic
     *
     * Called by #next-button
     * 
     * Parameters:
     *  userAction - True if the user launch next music.
     */
    this.nextMusic = function(userAction) {
        var playListLength = $(this.playerListId+' option').length;
        var step = 1;
        // If shuffle is activated, random, except repeat one state
        if (this.shuffle && this.repeatState < REPEAT_ONE)
            step = Math.floor(Math.random() * playListLength);
        // Don't step with repeat one mode
        else if (this.repeatState == REPEAT_ONE && !userAction)
            step = 0;
        // On repeat off, remove selected files at end of play list
        if (this.repeatState == REPEAT_OFF)
        {
            var currentIndex = this.playerList.find(".selected-file").index();
            if (currentIndex == playListLength - 1)
            {
                $(this.playerListId + ' .selected-file').removeClass('selected-file');
                this.playButton();
                return;
            }
        }
        this.launchFileFromCurrent(step, true);
    }

    /**
     *
     * Function: previousMusic
     *
     * Called by #previous-button
     */
    this.previousMusic = function() {
        this.launchFileFromCurrent(-1, true);
    }

    /**
     * Function: deleteSelected
     *
     * Delete selected file in playlist.
     */
    this.deleteSelected = function() {
        if ($(this.playerListId + " .selected-file:selected").length > 0)
        {
            var selectedFound = false;
            var newSelection = false;
            var children = $(this.playerListId + " option");
            for (var i = 0; i < children.length; ++i) {
                var child = $(children[i]);
                if (child.hasClass('selected-file'))
                    selectedFound = true;
                if (selectedFound && !child.prop('selected'))
                {
                    newSelection = true;
                    this.launchFile(i, this.currentPlayState);
                    break;
                }
                if (!newSelection)
                    player.pauseMusic();
            }
        }
        $(this.playerListId + " option:selected").remove();
    }

    /**
     * Function: deleteAll
     *
     * Delete all file in playlist.
     */
    this.deleteAll = function() {
        this.playerList.empty();
        this.pauseMusic();
        this.showFileData({title: ''});
    }

    /**
     * Function : launchSelected
     *
     * Launch selected file.
     */
    this.launchSelected = function() {
        this.launchFile(this.playerList.find('option:selected').index(), true);
        this.playerList.find('option:selected').prop('selected', false);
    }
    
    /**
     * Function: changePlayState
     * 
     * Change state and play button image.
     * 
     * Parameters:
     *  newPlayState - Boolean of new play state.
     */
    this.changePlayState = function(newPlayState) {
        if (newPlayState != this.currentPlayState)
        {
            var imgDest = '/images/'+theme+'/play.png';
            if (newPlayState)
                imgDest = '/images/'+theme+'/pause.png';
            var toRotate = $('#play-button')
            var self = this;
            this.rotateItem(toRotate, 100, 0, 90, function(){
                $('#play-button img').attr('src', imgDest);
                self.rotateItem(toRotate, 100, -90, 0, null);
            });
        }
        this.currentPlayState = newPlayState;
    }
    
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
    this.rotateItem = function(item, duration, from, to, callback) {
        $({deg: from}).animate({deg: to}, {
            step: function(deg) {
              item.css('-moz-transform','rotateY('+deg+'deg)');
              item.css('-webkit-transform','rotateY('+deg+'deg)');
              item.css('-o-transform','rotateY('+deg+'deg)');
              item.css('transform','rotateY('+deg+'deg)');
            },
            duration: duration,
            complete: function(){
                if (callback)
                    callback();
            }
        });
    }
    
    /**
     * Function: toggleShuffle
     * 
     * Toggle state of shuffle.
     */
    this.toggleShuffle = function() {
        this.shuffle = !this.shuffle;
        var img = "off";
        if (this.shuffle)
            img = "on"
        $('#player-option-shuffle img').attr('src', '/images/'+theme+'/shuffle_'+img+'.png');
    }

    /**
     * Function: chgRepeatState
     * 
     * Change repeat state.
     */
    this.chgRepeatState = function() {
        this.repeatState = (this.repeatState + 1) % 3;
        var img = "off";
        if (this.repeatState == REPEAT_ON)
            img = "on";
        if (this.repeatState == REPEAT_ONE)
            img = "one";
        $('#player-option-repeat img').attr('src', '/images/'+theme+'/repeat_'+img+'.png');
    }
    
    /**
     * Function: showFileData
     * 
     * Show file data in command pane.
     * 
     * Parameters:
     *  fileData - JSON Object with file data
     */
    this.showFileData = function(fileData) {
        $('#player-info-name').text(fileData.title);
    }
}