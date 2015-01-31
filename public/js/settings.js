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
 * Class: Client Settings
 */

function Settings() {
    this.dialog = null;
    this.updateDialog = null;

    /**
     * Function: init
     * 
     * Initialize settings.
     */
    this.init = function() {
        var self = this;
        this.dialog = $('#dialog-settings').dialog({
            autoOpen: false,
            width: '30em',
            modal: true,
            closeOnEscape: true,
            show: {effect: 'fadeIn', duration: 200},
            buttons: [
                {
                    text: locale.update,
                    click: function() {
                        var newPath = $(this).find('#settings-path').val();
                        ajaxQuery({query: 'setSettingValue', queryData: {name: 'path', value: newPath}}, null);
                        $(this).dialog('close');
                        self.openUpdateDialog()
                    }
                },
                {
                    text: locale.save,
                    click: function() {
                        $(this).dialog('close');
                        self.updateSettings($(this));
                    }
                }
            ]
        });

        this.updateDialog = $('#dialog-settings-update').dialog({
            autoOpen: false,
            modal: true,
            width: '30em',
            closeOnEscape: true,
            show: {effect: 'fadeIn', duration: 200},
            buttons: [
                {
                    text: locale.launch,
                    click: function() {
                        $(this).dialog('close');
                        self.updateLibrary($(this).find('#settings-deleteoldfiles').prop('checked'));
                    }
                },
                {
                    text: locale.cancel,
                    click: function() {
                        $(this).dialog('close');
                    }
                }

            ]
        });
        socket.on('libraryUpdated', function(value) {
            console.log(value);
            ui.setLoadingIndicatorState(false);
            ui.initContent();
        });
    }

    /**
     * Function: openDialog
     * 
     * Show the settings dialog.
     */
    this.openDialog = function() {
        var self = this;
        ajaxQuery({query: 'getSettingValue', queryData: {name: 'path'}}, function(data) {
            $('#settings-path').val(data.setting);
            ajaxQuery({query: 'getSettingValue', queryData: {name: 'debug'}}, function(data) {
                $('#settings-debug').prop('checked', (data.setting == 1));
                self.dialog.dialog('open');
            });
        });
    }

    /** 
     * Function: openUpdateDialog()
     *
     * Show dialog for update library settings.
     */
    this.openUpdateDialog = function() {
        this.updateDialog.dialog('open');
    }

    /**
     * Function: updateLibrary
     * 
     * Launch a scan of the library.
     * 
     * Parameters:
     *  deleteOld - True if all files must be deleted.
     */
    this.updateLibrary = function(deleteOld) {
        this.updateDialog.dialog('close');
        ui.setLoadingIndicatorState(true, function(callback) {
        });
        socket.emit('launchLibraryUpdate', deleteOld);
    }

    /**
     * Function: updateSettings
     * 
     * Save a setting.
     */
    this.updateSettings = function(dialog) {
        var newPath = dialog.find('#settings-path').val();
        var newDebug = 0;
        if ($('#settings-debug').prop('checked'))
        {
            debug = true;
            newDebug = 1;
        }
        ajaxQuery({query: 'setSettingValue', queryData: {name: 'path', value: newPath}}, null);
        ajaxQuery({query: 'setSettingValue', queryData: {name: 'debug', value: newDebug}}, null);
    }
}
