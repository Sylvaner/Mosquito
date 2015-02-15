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
var exec = require('child_process').exec
var mysql = require('mysql');
var assert = require('assert');
var config = require('../test/tmp/config.json');
var db = require('../modules/db');

var connection;

describe('Test database module methods', function() {
    this.timeout(4000);

    before(function(done) {
        db.connect(config.database, function() {
            connection = db.getConnection();
            exec('python3 scripts/scan.py test/data test/tmp/config.json', function(error) {
                done();
            });
        });
    });
    after(function(done) {
        db.disconnect(function() {
            done();
        });
    });

    it('Test escapeStr', function(done) {
        assert.equal('no escape', db.escapeStr('no escape'));
        assert.equal('single quote \\\'escape', db.escapeStr('single quote \'escape'));
        assert.equal('percent \\%', db.escapeStr('percent %'));
        assert.equal('double quote \\"escape', db.escapeStr('double quote "escape'));
        done();
    });
    
    it('Test getGenreList method', function(done) {
        db.getGenreList(function(list1) {
            // List order by name
            assert.equal(8, list1.length);
            assert.equal("Heavy Metal", list1[3].name);
            // Test unknow at last position
            assert.equal("Unknow", list1[7].name);
            done();
        });
    });

    it('Test getMenuList method (By genre)', function(done) {
        db.getMenuList(db.ORDER_BY_GENRE, 0, null, function(list1, isLast1) {
            assert.equal(8, list1.length);
            assert.equal(false, isLast1);
            assert.equal("Heavy Metal", list1[3].title);
            db.getMenuList(db.ORDER_BY_GENRE, 1, [list1[3]], function(list2, isLast2) {
                assert.equal(2, list2.length);
                assert.equal(false, isLast2);
                assert.equal("The mermaids", list2[1].title);
                db.getMenuList(db.ORDER_BY_GENRE, 2, [list1[3], list2[0]], function(list3, isLast3) {
                    assert.equal(2, list3.length);
                    assert.equal(true, isLast3);
                    assert.equal("More Noise", list3[0].title);
                    done();
                });
            });
        });
    });

    it('Test getMenuList method (By artist)', function(done) {
        db.getMenuList(db.ORDER_BY_ARTIST, 0, null, function(list1, isLast1) {
            assert.equal(10, list1.length);
            assert.equal(false, isLast1);
            assert.equal("Flac Boy", list1[4].title);
            db.getMenuList(db.ORDER_BY_ARTIST, 1, [list1[7]], function(list2, isLast2) {
                assert.equal(2, list2.length);
                assert.equal(true, isLast2);
                assert.equal("Noisy sound", list2[1].title);
                done();
            });
        });
    });

    it('Test getMenuList method (By year)', function(done) {
        db.getMenuList(db.ORDER_BY_YEAR, 0, null, function(list1, isLast1) {
            assert.equal(6, list1.length);
            assert.equal(false, isLast1);
            assert.equal("1983", list1[2].title);
            db.getMenuList(db.ORDER_BY_YEAR, 1, [list1[1]], function(list2, isLast2) {
                assert.equal(2, list2.length);
                assert.equal(false, isLast2);
                assert.equal("Boomboom", list2[1].title);
                db.getMenuList(db.ORDER_BY_YEAR, 2, [list1[1], list2[0]], function(list3, isLast3) {
                    assert.equal(1, list3.length);
                    assert.equal(true, isLast3);
                    assert.equal("Bip", list3[0].title);
                    done();
                });
            });
        });
    });

    it('Test getFileList method (By genre)', function(done) {
        db.getGenreList(function(list) {
            var heavyMetalId = -1;
            for (var i = 0; i < list.length; ++i)
                if (list[i].name == 'Heavy Metal')
                    heavyMetalId = list[i].id;
            assert.notEqual(-1, heavyMetalId);
            choices = [
                {data: heavyMetalId, title: 'Heavy Metal'},
                {data: 2, title: 'Noise band'}
            ];
            db.getFileList(db.ORDER_BY_GENRE, 0, null, function(list1) {
                assert.equal(11, list1.length);
                assert.equal("Boomboom", list1[2].artist);
                db.getFileList(db.ORDER_BY_GENRE, 1, choices, function(list2) {
                    assert.equal(3, list2.length);
                    assert.equal("42", list2[2].title);
                    db.getFileList(db.ORDER_BY_GENRE, 2, choices, function(list3) {
                        assert.equal(2, list3.length);
                        assert.equal("100", list3[0].title);
                        done();
                    });
                });
            });
        });
    });

    it('Test getFileList method (By artist)', function(done) {
        choices = [
            {data: 5, title: 'Nine Zero'},
            {data: 1, title: 'Zerooo'}
        ];
        db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list1) {
            assert.equal(11, list1.length);
            assert.equal("1200", list1[4].title);
            db.getFileList(db.ORDER_BY_ARTIST, 1, choices, function(list2) {
                assert.equal(1, list2.length);
                assert.equal("90", list2[0].title);
                db.getFileList(db.ORDER_BY_ARTIST, 2, choices, function(list3) {
                    assert.equal(1, list3.length);
                    assert.equal("Zerooo", list3[0].album);
                    done();
                });
            });
        });
    });

    it('Test getFileList method (By year)', function(done) {
        choices = [
            {data: 2, title: '1983'},
            {data: 1, title: 'Jazzy'},
            {data: 1, title: 'Jazz collection'}
        ];
        db.getFileList(db.ORDER_BY_YEAR, 0, null, function(list1) {
            assert.equal(11, list1.length);
            assert.equal("Best quality", list1[3].album);
            db.getFileList(db.ORDER_BY_YEAR, 1, choices, function(list2) {
                assert.equal(2, list2.length);
                assert.equal(1, list2[1].track);
                db.getFileList(db.ORDER_BY_YEAR, 2, choices, function(list3) {
                    assert.equal(1, list3.length);
                    assert.equal('1983', list3[0].year);
                    db.getFileList(db.ORDER_BY_YEAR, 3, choices, function(list4) {
                        assert.equal(1, list4.length);
                        assert.equal('Jazz collection', list4[0].album);
                        done();
                    });
                });
            });
        });
    });

	it('Test getFileData', function(done) {
        db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list) {
			db.getFileData(list[1].id, function(data1) {
				assert.equal(list[1].title, data1.title);
				assert.equal(list[1].artist, data1.artist);
				db.getFileData(list[2].id, function(data2) {
					assert.equal(list[1].album, data1.album);
					assert.equal(list[1].track, data1.track);
					done();
				});
			});
		});
	});
	
    it('Test getFilePath', function(done) {
        db.getFilePath(2, function(path) {
            assert.equal(true, path.indexOf("data") > -1);
            done();
        });
    });

    it('Test getSettingValue', function(done) {
        db.getSettingValue('path', function(value) {
            assert.equal('.', value);
            done();
        });
    });

    it('Test setSettingValue', function(done) {
        var oldValue = '.';
        var newValueForTest = '/';
        db.setSettingValue('path', newValueForTest, function() {
            db.getSettingValue('path', function(newValue1) {
                assert.equal(newValueForTest, newValue1);
                db.setSettingValue('path', oldValue, function() {
                    db.getSettingValue('path', function(newValue2) {
                        assert.equal(oldValue, newValue2);
                        done();
                    });
                });
            });
        });
    });

    it('Test setFileRowsLimit', function(done) {
        db.setFileRowsLimit(2);
        db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list1) {
            assert.equal(2, list1.length);
            db.setFileRowsLimit(999999);
            db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list2) {
                assert.ok(list2);
                done();
            });
        });
    });

    it('Test getAllSettings', function(done) {
        db.getAllSettings(function(settings) {
            assert.equal('.', settings.path);
            assert.equal('0', settings.debug);
            assert.equal('1', settings.last_scan_state);
            done();
        });
    });

    it('Test deleteOldFiles', function(done) {
        exec('python3 scripts/scan.py test/data/Techno test/tmp/config.json', function(error) {
            db.deleteOldFiles(function() {
                db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list1) {
                    assert.equal(1, list1.length);
                    exec('python3 scripts/scan.py test/data test/tmp/config.json', function(error) {
                        db.getFileList(db.ORDER_BY_ARTIST, 0, null, function(list2) {
                            assert.equal(11, list2.length);
                            done();
                        });
                    });
                });
            });
        });
    });

    it('Test deleteUnusedGenre', function(done) {
        connection.query("INSERT INTO genre (id, name) VALUES (NULL, 'Test')", function(error) {
            db.getGenreList(function(list1) {
                assert.equal(9, list1.length);
                db.deleteUnusedGenre(function() {
                    db.getGenreList(function(list1) {
                        assert.equal(8, list1.length);
                        done();
                    });
                });
            });
        });
    });

    it('Test getFilesCount', function(done) {
        exec('python3 scripts/scan.py test/data/Classic test/tmp/config.json', function(error) {
            db.getFilesCount(function(data) {
                assert.equal(1, data);
                exec('python3 scripts/scan.py test/data test/tmp/config.json', function(error) {
                    db.getFilesCount(function(data) {
                        assert.equal(11, data);
                        done();
                    });
                });
            });
        });
    });
});

