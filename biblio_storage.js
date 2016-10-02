/*jshint
    esnext:        true,
    browser:    true,
    devel:        true,
    unused:        true,
    undef:        true,
        -W097,
        -W040
*/
/*global
    MessageBotExtension
*/
 
'use strict';
 
var biblio_storage = MessageBotExtension('biblio_storage');
 
(function() {
	this.setAutoLaunch(true);
	this.addSettingsTab('Storage Management');
	this.settingsTab.innerHTML = '<style>#biblio_storage_man { margin-top: 1em; }#biblio_storage_man > input { margin: 0.5em; width:calc(100% - 2em);}</style><p>Warning: If you change the values below, you may break the bot! <a style="color:#f00;text-decoration:underline;" onclick="biblio_storage.clearConfig();">Last resort - Clear Everything</a></p>';
	this.worlds = {};
	this.ids = [];
	Object.keys(localStorage).forEach(function(key) {
		if (key.indexOf('joinArr') === 0) {
			this.ids.push(parseInt(key.substring(7)));
		}
	}.bind(this));
 
	this.clearConfig = function() {
		if (confirm("Are you sure you want to clear ALL configuration and save data?")) {
			localStorage.clear();
		}
	};
 
	this.loadWorldData = function() {
		var worldId = this.settingsTab.querySelector('select').selectedOptions[0].getAttribute('data-wid');
		var worldName = this.settingsTab.querySelector('select').selectedOptions[0].textContent;
		if (worldId != 'global' && isNaN(parseInt(worldId))) {
			return;
		}
 
		var c = document.getElementById('biblio_storage_man');
		var tmpHTML = '<h3>' + this.bot.stripHTML(worldName) + '</h3>';
		var counter = 0;
 
		if (worldId == 'global') {
			var r = new RegExp(/[0-9]/);
			Object.keys(localStorage).forEach(function(key) {
				if (!r.test(key)) { //If key contains no numbers
					tmpHTML += '<label>' + this.bot.stripHTML(key) + '</label><input><br>';
				}
			}.bind(this));
			c.innerHTML = tmpHTML;
			Object.keys(localStorage).forEach(function(key) {
				if (!r.test(key)) {
					this.settingsTab.getElementsByTagName('input')[counter++].value = localStorage.getItem(key);
				}
			}.bind(this));
		} else {
			Object.keys(localStorage).forEach(function(key) {
				if (key.indexOf(worldId) != -1) {
					tmpHTML += '<label>' + this.bot.stripHTML(key) + '</label><input><br>';
				}
			}.bind(this));
			c.innerHTML = tmpHTML;
			Object.keys(localStorage).forEach(function(key) {
				if (key.indexOf(worldId) != -1) {
					this.settingsTab.getElementsByTagName('input')[counter++].value = localStorage.getItem(key);
				}
			}.bind(this));
		}
	};
 
	this.saveWorldData = function() {
		var els = this.settingsTab.getElementsByTagName('label');
		var els2 = this.settingsTab.getElementsByTagName('input');
 
		for (var i = 0; i < els.length; i++) {
			localStorage.setItem(els[i].textContent, els2[i].value);
		}
 
		this.settingsTab.querySelector('button').textContent = 'Saved';
		setTimeout(function() {
			this.settingsTab.querySelector('button').textContent = 'Save';
		}.bind(this), 1000);
	};
 
	var biblio_storage_xhr = new XMLHttpRequest();
	biblio_storage_xhr.onload = function() {
		var p = new DOMParser();
		this.doc = p.parseFromString(biblio_storage_xhr.responseText, 'text/html');
 
		this.doc.body.querySelector('script').textContent.split('\n').forEach(function(line) {
			if (line.startsWith('\t\t\tupdateWorld')) {
				var needed = line.substring(15, line.length - 1);
				//"needed" currently isn't valid JSON, fix it.
				needed = needed.replace(/(['"])?(\w+)(['"])?: (')?(.*?)(')?([,}])/gi, '"$2": "$5"$7');
				var world = JSON.parse(needed);
 
				if (this.ids.indexOf(parseInt(world.id)) != -1) {
					this.worlds[world.name] = parseInt(world.id);
				}
			}
		}.bind(this));
 
		var tmpHTML = '<select><option>Choose...</option><option data-wid="global">Globals</option>';
		Object.keys(this.worlds).forEach(function(world) {
			tmpHTML += '<option data-wid="' + this.worlds[world] + '">' + this.bot.stripHTML(world) + ' (' + this.worlds[world] + ')</option>';
		}.bind(this));
		tmpHTML += '</select><div id="biblio_storage_man"></div><button>Save</button>';
		this.settingsTab.innerHTML += tmpHTML;
 
		this.settingsTab.querySelector('select').addEventListener('change', this.loadWorldData.bind(this), false);
		this.settingsTab.querySelector('button').addEventListener('click', this.saveWorldData.bind(this), false);
	}.bind(this);
	biblio_storage_xhr.open('GET', '/worlds');
	biblio_storage_xhr.send();
}.call(biblio_storage));
