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
var config = require('../test/tmp/config.json');
var db = require('../modules/db');

var connection;

describe('Test database structure', function() {
    before(function(done) {
        db.connect(config.database, function() {
            connection = db.getConnection();
            done();
        });
    });
    after(function(done) {
        db.disconnect(function() {
            done();
        });
    });
    it('Test if database is connected', function(done) {
        connection.query("SHOW DATABASES LIKE '" + config.database + "'", function(error, rows, fields) {
            assert.equal(1, rows.length);
            connection.query("USE " + config.database, function(error) {
                assert.equal(null, error);
                connection.query("SHOW TABLES", function(error, rows, fields) {
                    assert.equal(null, error);
                    assert.equal(4, rows.length);
                    done();
                });
            });
        });
    });

    it('Test if table audio_file is created', function(done) {
        connection.query("SELECT * FROM audio_file", function(error, rows, fields) {
            assert.equal(null, error);
            assert.equal(11, fields.length);
            assert.equal(0, rows.length);
            done();
        });
    });

    it('Test if table genre is created', function(done) {
        connection.query("SELECT * FROM genre", function(error, rows, fields) {
            assert.equal(null, error);
            assert.equal(2, fields.length);
            assert.equal(1, rows.length);
            done();
        });
    });

    it('Test if table process is created', function(done) {
        connection.query("SELECT * FROM process", function(error, rows, fields) {
            assert.equal(null, error);
            assert.equal(2, fields.length);
            assert.equal(0, rows.length);
            done();
        });
    });

    it('Test if table settings is created', function(done) {
        connection.query("SELECT * FROM settings", function(error, rows, fields) {
            assert.equal(null, error);
            assert.equal(3, fields.length);
            assert.equal(5, rows.length);
            done();
        });
    });

});
