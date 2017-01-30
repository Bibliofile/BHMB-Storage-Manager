/*jshint
    esversion: 6,
    browser: true,
    devel: true,
    unused: true,
    undef: true,
    -W097
*/
/*global
    MessageBotExtension
*/

'use strict';

var biblio_storage = MessageBotExtension('biblio_storage');

(function(ex) {
    ex.setAutoLaunch(true);
    ex.tab = ex.ui.addTab('Storage Management');
    ex.tab.classList.add('container');
    ex.uninstall = function() {
        //Remove tab
        ex.ui.removeTab(ex.tab);
    };

    ex.tab.innerHTML = '<style>#biblio_storage_man { margin-top: 1em; }</style><p>Warning: If you change the values below, you may break the bot! <a style="color:#f00;text-decoration:underline;" onclick="biblio_storage.clearConfig();">Last resort - Clear Everything</a></p>';

    var worlds = {};
    var ids = [];
    Object.keys(localStorage).forEach(function(key) {
        if (key.startsWith('joinArr')) {
            ids.push(parseInt(key.substring(7)));
        }
    });

    ex.clearConfig = function() {
        if (confirm("Are you sure you want to clear ALL configuration and save data?")) {
            localStorage.clear();
        }
    };

    ex.loadWorldData = function() {
        var worldId = ex.tab.querySelector('select').selectedOptions[0].dataset.wid;
        var worldName = ex.tab.querySelector('select').selectedOptions[0].textContent;
        if (worldId != 'global' && isNaN(parseInt(worldId))) {
            return; //Choose...
        }

        var c = document.getElementById('biblio_storage_man');
        var tmpHTML = '<h3 class="subtitle">' + worldName.replace(/</g, '&lt;') + '</h3>';
        var counter = 0;

        if (worldId == 'global') {
            var r = new RegExp(/[0-9]/);
            Object.keys(localStorage).forEach(function(key) {
                if (!r.test(key)) { //If key contains no numbers
                    tmpHTML += '<label>' + key.replace(/</g, '&lt;') + '</label><input class="input"><br>';
                }
            });
            c.innerHTML = tmpHTML;
            Object.keys(localStorage).forEach(function(key) {
                if (!r.test(key)) {
                    ex.tab.getElementsByTagName('input')[counter++].value = localStorage.getItem(key);
                }
            });
        } else {
            Object.keys(localStorage).forEach(function(key) {
                if (key.indexOf(worldId) != -1) {
                    tmpHTML += '<label>' + key.replace(/</g, '&lt;') + '</label><input><br>';
                }
            });
            c.innerHTML = tmpHTML;
            Object.keys(localStorage).forEach(function(key) {
                if (key.indexOf(worldId) != -1) {
                    ex.tab.getElementsByTagName('input')[counter++].value = localStorage.getItem(key);
                }
            });
        }
    };

    ex.saveWorldData = function() {
        var els = ex.tab.getElementsByTagName('label');
        var els2 = ex.tab.getElementsByTagName('input');

        for (var i = 0; i < els.length; i++) {
            localStorage.setItem(els[i].textContent, els2[i].value);
        }

        ex.tab.querySelector('button').textContent = 'Saved';
        setTimeout(function() {
            ex.tab.querySelector('button').textContent = 'Save';
        }, 1000);
    };

    ex.ajax.get('/worlds').then(function(html) {
        var doc = (new DOMParser()).parseFromString(html, 'text/html');

        doc.body.querySelector('script').textContent.split('\n').forEach(function(line) {
            if (line.startsWith('\t\t\tupdateWorld')) {
                var needed = line.substring(15, line.length - 1);
                //"needed" currently isn't valid JSON, fix it.
                needed = needed.replace(/(['"])?(\w+)(['"])?: (')?(.*?)(')?([,}])/gi, '"$2": "$5"$7');
                var world = JSON.parse(needed);

                if (ids.indexOf(parseInt(world.id)) != -1) {
                    worlds[world.name] = parseInt(world.id);
                }
            }
        });

        var tmpHTML = '<select class="select"><option>Choose...</option><option data-wid="global">Globals</option>';
        Object.keys(worlds).forEach(function(world) {
            tmpHTML += '<option data-wid="' + worlds[world] + '">' + world.replace(/</g, '&lt;') + ' (' + worlds[world] + ')</option>';
        });
        tmpHTML += '</select><div id="biblio_storage_man"></div><button class="button is-primary">Save</button>';

        ex.tab.innerHTML += tmpHTML;

        ex.tab.querySelector('select').addEventListener('change', ex.loadWorldData);
        ex.tab.querySelector('button').addEventListener('click', ex.saveWorldData);
    });
}(biblio_storage));
