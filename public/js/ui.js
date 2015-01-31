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
 * Class: Client UI
 */

var uiContentSelectedFiles = $([]);
var uiDraggableOffset = {top: 0, left: 0};

function UI() {
    /**
     * Function: initEvents
     *
     * Initialize all events.
     */
    this.initEvents = function() {
        $('#add-selected').click(this.addSelectedButton);
        $('#add-all').click(this.addAllButton);
        $('#delete-selected').click(function() {
            player.deleteSelected();
        });
        $('#delete-all').click(function() {
            player.deleteAll();
        });
        $('#search-button').click($.proxy(this.launchSearch, this));
        $('#search-input').keyup($.proxy(function(e) {
            if (e.keyCode == 13)
                this.launchSearch();
        }, this));
        $('#player-list').dblclick(function() {
            player.launchSelected();
        });
        $('#settings').click(function() {
            settings.openDialog();
        });
        // Make list selectable
        $('#content').selectable({
            distance: 1,
            filter: 'tr'
        });
        $('#by-genre').click($.proxy(function() {
            this.chgMenuOrder(1);
        }, this));
        $('#by-artist').click($.proxy(function() {
            this.chgMenuOrder(2);
        }, this));
        $('#by-year').click($.proxy(function() {
            this.chgMenuOrder(3);
        }, this));
    }
    /**
     * Function: initContent
     *
     * Initialize the user interface.
     */
    this.initContent = function() {
        $('#left-pane').empty();
        $('#file-list').empty();
        this.loadMenuList($('#left-pane'), currentOrder, 0, null);
        this.loadFileList(1, 0, null);
    },
            /**
             * Function: chgMenuOrder
             * 
             * Change the order for menu.
             * 
             * Parameters:
             *  newOrder - Order choosed by user.
             */
            this.chgMenuOrder = function(newOrder) {
                currentOrder = newOrder;
                $('#left-pane').empty();
                this.loadMenuList($('#left-pane'), newOrder, 0, null);
            }

    /**
     * Function: addSelectedButton
     *
     * Function called on Add Selected button event.
     */
    this.addSelectedButton = function() {
        var data = [];
        $('#content .ui-selected').each(function() {
            data.push({id: $(this).attr('data-id'), title: $(this).attr('data-title')});
        });

        if (data.length)
            player.addFilesList(data);
    }
    /**
     * Function: addAllButton
     *
     * Function called on Add all button event.
     */
    this.addAllButton = function() {
        var data = [];
        $('#content tr').each(function() {
            data.push({id: $(this).attr('data-id'), title: $(this).attr('data-title')});
        });
        if (data.length)
            player.addFilesList(data);
    }

    /**
     * Function: menuClick
     *
     * Called when user click on menu item.
     *
     * Parameters:
     *  container - Item event caller.
     */
    this.menuClick = function(container) {
        var level = parseInt(container.attr('data-level')) + 1;
        var dataChoice = JSON.parse(container.attr('data-choice'));
        var li = container.parent();

        // Check if menu is open
        if (li.hasClass('open')) {
            // Close the menu
            container.parent().find('ul').remove();
            li.removeClass('open');
            li.addClass('close');
        } else if (container.attr('data-islast') == 'false') {
            // Open the menu
            li.removeClass('close');
            li.addClass('open');
            this.loadMenuList(container.parent(), currentOrder, level, dataChoice);
        }
        // Update files list
        this.loadFileList(currentOrder, level, dataChoice);
    }

    /**
     * Function: loadMenuList
     *
     * Load a part of the menu.
     *
     * Parameters:
     * 	container - Item where the menu will be append.
     *  menuOrder - Order of the menu.
     *  menuLevel - Depth of the menu.
     *  menuChoices - Previous choices.
     */
    this.loadMenuList = function(container, menuOrder, menuLevel, menuChoices) {

        if (menuChoices == null)
            menuChoices = [];

        var loadingMenuDiv = this.addLoadingDiv($('#left-pane'));
        var q = {
            order: menuOrder,
            level: menuLevel,
            choices: menuChoices
        };

        ajaxQuery({
            query: 'getMenuList',
            queryData: q
        }, function(returnData) {
            listData = returnData.list;
            var ul = $('<ul>');
            listData.forEach(function(d) {
                // Add last selection to choices
                menuChoices.push(d);
                // Add list item
                var li = $('<li>');
                if (!returnData.isLast)
                    li.addClass('close');
                var span = $('<span>')
                        .attr('data-choice', JSON.stringify(menuChoices))
                        .attr('data-level', menuLevel)
                        .attr('data-islast', returnData.isLast)
                        .click(function() {
                            ui.menuClick($(this));
                        });

                var title = d.title;
                if (d.title == '')
                    title = locale.unknow;
                span.append(title);

                li.append(span).hide().appendTo(ul).fadeIn('slow');
                // Remove last selection from choices
                menuChoices.pop();
            });
            container.append(ul);
            loadingMenuDiv.remove();
        });
    }

    /**
     * Function: loadFileList
     *
     * Load a list of files.
     *
     * Parameters:
     *  menuOrder - Order of the menu.
     *  menuLevel - Depth of the menu.
     *  menuChoices - Previous choices.
     */
    this.loadFileList = function(menuOrder, menuLevel, menuChoices) {
        var loadingDiv = this.addLoadingDiv($('#content'));
        var q = {
            order: menuOrder,
            level: menuLevel,
            choices: menuChoices
        };

        $('#file-list').empty();

        var self = this;
        ajaxQuery({
            query: 'getFileList',
            queryData: q
        }, function(listData) {
            self.loadFileListContent(listData);
            loadingDiv.remove();
        });
    }

    /**
     * Function: loadFileListContent
     *
     * Load files list from ajax query.
     *
     * Parameters:
     *  listData - List of files
     */
    this.loadFileListContent = function(listData) {
        var container = $('#file-list');
        listData.forEach(function(d) {
            var tr = $('<tr>')
                    .attr('data-id', d.id)
                    .attr('data-title', d.title)
                    .dblclick(function() {
                        player.addFile(d.id, d.title);
                    });
            $('<td>').append(d.track).addClass('right').appendTo(tr);
            $('<td>').append(d.title).appendTo(tr);
            $('<td>').append(d.artist).appendTo(tr);
            $('<td>').append(d.album).appendTo(tr);
            $('<td>').append(d.year).appendTo(tr);
            $('<td>').append(d.path).appendTo(tr);
            container.append(tr);
        });
        $('#file-list tr:odd').addClass('odd');
    }

    /**
     * Function: addLoadingDiv
     *
     * Add a loading gif hover data in conainter.
     *
     * Parameters:
     *  container - Container where loading gif will be added.
     */
    this.addLoadingDiv = function(container) {
        var div = $('<div>').addClass('loading-indicator');
        var img = $('<img>').attr('src', '/images/' + theme + '/loading_indicator.gif');
        div.append(img);
        container.prepend(div);

        return div;
    }

    /**
     * Function: launchSearch
     * 
     * Launch search.
     */
    this.launchSearch = function() {
        var searchValue = $('#search-input').val();
        var loadingDiv = this.addLoadingDiv($('#content'));

        $('#file-list').empty();

        var self = this;
        ajaxQuery({
            query: 'getSearchFileList',
            queryData: {search: searchValue}
        }, function(listData) {
            self.loadFileListContent(listData);
            loadingDiv.remove();
        });
    }

    /**
     * Function: setLoadingIndicatorState
     *
     * Show or hide a loading indicator.
     *
     * Parameters:
     *  state - Show or hide the indicator.
     *  hoverCallback - Callback when mouse is hover.
     */
    this.setLoadingIndicatorState = function(state, hoverCallback) {
        if (state)
        {
            var indicator = $('#menu-loading-indicator');
            indicator.fadeIn();
            indicator.hover(function() {
                ajaxQuery({
                    query: 'getFilesCount',
                    queryData: null
                }, function(ret) {
                    indicator.attr('title', locale['filesCount'].replace('%d', ret.count));
                    indicator.tooltip();
                });
            });
        }
        else
            $('#menu-loading-indicator').fadeOut();
    }
}
