/**
 *  recorded.js
 */

"use strict";

var fs = require('fs');
var path = require('path');
var util = require('util');
var child_process = require('child_process');

var opts = require('../chinachu/node_modules/opts');
var mkdirp = require('../chinachu/node_modules/mkdirp');
var dateFormat = require('../chinachu/node_modules/dateformat');

opts.parse([
  {
    short       : 'i',
    long        : 'input',
    description : '変換元パス',
    value       : true,
    required    : true,
  },
  {
    short       : 'o',
    long        : 'output',
    description : '変換先ディレクトリ',
    value       : true,
    required    : true,
  },
  {
    short       : 'program-data',
    long        : 'program-data',
    description : '番組データ(JSON)',
    value       : true,
    required    : false,
  },
  {
    short       : 'ffmpeg',
    long        : 'ffmpeg',
    description : 'ffmpegパス',
    value       : true,
    required    : false,
  }
], true);

function encode() {
  var printf02d = function(num) {
    return (num < 10)? '0' + num : '' + num;
  };
  var formatToHMS = function(ms){
    var h = String(Math.floor(ms / 3600000) + 100).substring(1);
    var m = String(Math.floor((ms - h * 3600000)/60000)+ 100).substring(1);
    var s = String(Math.round((ms - h * 3600000 - m * 60000)/1000)+ 100).substring(1);
    return h+':'+m+':'+s;
  };

  var ffmpeg = opts.get('ffmpeg') || 'ffmpeg';
  var input = opts.get('input');
  var output = opts.get('output');
  var encodeStart = Date.now();
  var programData;
  var destDir;
  var destName;

  util.log("encode start: " + path.resolve(input));

  try {
    programData = JSON.parse(opts.get('program-data'));
  } catch (e) {
    programData = null;
  }
  if (programData
  &&  programData.title
  &&  programData.fullTitle
  &&  programData.start) {
    destDir = path.resolve(output, programData.title);
    destName = dateFormat(new Date(programData.start), 'yyyymmdd-HHMM')
             + '-' + programData.title
             + ((programData.episode !== null)? '-' + printf02d(programData.episode) : '')
             + '.mp4';

    util.log('    program data: ' + opts.get('program-data'));
  }
  else {
    var programTitle = path.basename(input).replace(/\..*$/, '');
    destDir = path.resolve(output, programTitle);
    destName = programTitle + '.mp4';
  }

  if (!fs.existsSync(path.resolve(opts.get('output'), destDir))) {
    mkdirp.sync(destDir);
  }

  child_process.exec(
    ffmpeg + ' -y -i "' + path.resolve(input) + '"'
    + ' -threads 0'
    + ' -deinterlace'
    + ' -f mp4'
    + ' -vcodec libx264'
    + ' -level 31'
    + ' -refs 6'
    + ' -bf 3'
    + ' -r 30000/1001'
    + ' -aspect 16:9'
    + ' -s 1280x720'
    + ' -bufsize 20000k'
    + ' -b 1000000'
    + ' -maxrate 2500000'
    + ' "' + path.resolve(destDir, destName) + '"',
    function(err, stdout, stderr) {
      if (err) {
        util.log(err);
        util.log('encode failed');
      } else {
        var encodeTime = Date.now() - encodeStart;
        util.log('encode finished: ' + path.resolve(destDir, destName));
        util.log('    time: ' + formatToHMS(encodeTime))
      }
    }
  );
}

function main() {
  encode();
}

main();
