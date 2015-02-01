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
var mysql = require('mysql');
var assert = require('assert');
var exec = require('child_process').exec
var config = require('../test/tmp/config.json');
var db = require('../modules/db');
var ajax = require('../routes/ajax');

function getBaseData(query, queryData)
{
    var baseData = {
        body: {
            query: query,
            queryData: queryData
        }
    };
    return baseData;
}
function ExpressSendProxy(sendFunc)
{
    this.contentType = function(data) {
    },
            this.send = sendFunc
}

describe('Test routes/ajax', function() {
    this.timeout(4000);

    before(function(done) {
        db.connect(config.database, function() {
            connection = db.getConnection();
            exec('python3 scripts/scan.py test/data test/tmp/config.json', function(error) {
                ajax.init(db);
                done();
            });
        });
    });
    after(function(done) {
        db.disconnect(function() {
            done();
        });
    });

    it('Test getMenuList', function(done) {
        var data1 = getBaseData('getMenuList', {order: 1, level: 0, choices: null});
        var data2 = getBaseData('getMenuList', {order: 3, level: 1, choices: [{data: 6, title: '1983'}]});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal('Jazzy', data.list[0].title);
            assert.equal(false, data.isLast);
            done();
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            assert.equal('Classical', data.list[1].title);
            assert.equal(false, data.isLast);
            ajax.post(data2, expressSendProxy2);
        });
        ajax.post(data1, expressSendProxy1);
    });

    it('Test getFileList', function(done) {
        var data1 = getBaseData('getFileList', {order: 1, level: 0, choices: null});
        var data2 = getBaseData('getFileList', {order: 2, level: 1, choices: [{data: 1, title: 'Noise band'}]});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal(2, data.length);
            assert.equal('42', data[1].title);
            done();
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            assert.equal(11, data.length);
            assert.equal('1200', data[4].title);
            ajax.post(data2, expressSendProxy2);
        });
        ajax.post(data1, expressSendProxy1);
    });

	it('Test getFileData', function(done) {
		var file = null;
        var data1 = getBaseData('getFileList', {order: 1, level: 0, choices: null});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
			assert.equal(file.id, data.id);
			assert.equal(file.artist, data.artist);
			assert.equal(file.title, data.title);
			done();
		});
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
			// Get list of files and test the first
			file = data[0];
			var data2 = getBaseData('getFileData', file.id);
			ajax.post(data2, expressSendProxy2);
		});
		ajax.post(data1, expressSendProxy1);
	});
	
    it('Test getSearchFileList', function(done) {
        var data1 = getBaseData('getSearchFileList', {search: 'ro'});
        var data2 = getBaseData('getSearchFileList', {search: 'an'});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal(4, data.length);
            assert.equal('Noise band', data[2].artist)
            done();
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            assert.equal(1, data.length);
            assert.equal('Zerooo', data[0].album);
            ajax.post(data2, expressSendProxy2);
        });
        ajax.post(data1, expressSendProxy1);
    });

    it('Test getSettingValue', function(done) {
        var data1 = getBaseData('getSettingValue', {name: 'path'});
        var data2 = getBaseData('getSettingValue', {name: 'last_scan_state'});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal('1', data.setting);
            done();
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            assert.equal('.', data.setting);
            ajax.post(data2, expressSendProxy2);
        });
        ajax.post(data1, expressSendProxy1);
    });

    it('Test setSettingValue', function(done) {
        this.timeout = 3000;
        var data1 = getBaseData('setSettingValue', {name: 'path', value: '/'});
        var data2 = getBaseData('setSettingValue', {name: 'path', value: '.'});
        var dataGet = getBaseData('getSettingValue', {name: 'path'});

        var expressSendProxy4 = new ExpressSendProxy(function(data) {
            assert.equal('.', data.setting);
            done();
        });
        var expressSendProxy3 = new ExpressSendProxy(function(data) {
            ajax.post(dataGet, expressSendProxy4);
        });
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal('/', data.setting);
            ajax.post(data2, expressSendProxy3);
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            ajax.post(dataGet, expressSendProxy2);
        });
        ajax.post(data1, expressSendProxy1);
    });

    it('Test getFilesCount', function(done) {
        var data1 = getBaseData('getFilesCount', {data: ''});
        var expressSendProxy2 = new ExpressSendProxy(function(data) {
            assert.equal(11, data.count);
            done();
        });
        var expressSendProxy1 = new ExpressSendProxy(function(data) {
            assert.equal(1, data.count);
            exec('python3 scripts/scan.py test/data test/tmp/config.json', function(error) {
                ajax.post(data1, expressSendProxy2);
            });
        });
        exec('python3 scripts/scan.py test/data/Techno test/tmp/config.json', function(error) {
            ajax.post(data1, expressSendProxy1);
        });
    });
});
