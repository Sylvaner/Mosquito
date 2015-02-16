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
 * Class: Client shortcuts
 */

function Shortcuts() {
    /**
     * Function: init
     * 
     * Initialize shorcuts.
     */
    this.init = function(document) {
        var self = this;
        document.keydown(function(event) {
            if (event.altKey) {
                self.testShortcut(event);
            }
        });
    }
    
    /**
     * Function: testShortcut
     * 
     * Test if shortcut is called.
     */
    this.testShortcut = function(event) {
        switch (event.keyCode) {
            // Enter
            case 13:
                player.playButton();
                break;
            // a
            case 65:
                ui.addAllButton();
                break;
            // n
            case 78:
                player.nextMusic(true);
                break;
            // p
            case 80:
                player.previousMusic();
                break;
            // s
            case 83:
                ui.addSelectedButton();
                break;
        }
    }
}
