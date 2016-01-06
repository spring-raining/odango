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
           + ' -loglevel error'
           + ' -threads 0'                 // マルチスレッド化
           + ' -f mp4'                     // 出力コンテナ
           + ' -c:v libx264'               // 映像コーデック
           + ' -c:a libfdk_aac'            // 音声コーデック
           + ' -b:v 1536k'                 // 映像ビットレート
           + ' -b:a 192k'                  // 音声ビットレート
           + ' -r 30000/1001'              // フレームレート (30000/1001 = 29.97fps)
           + ' -aspect 16:9'               // アスペクト比
           + ' -s 1280x720'                // 映像サイズ
           + ' -flags +loop'               // +loop ブロックフィルタ有効化
           + ' -filter:v yadif'            // インターレース解除
           + ' -pass 1'                    // 1パスエンコード
           + ' -level 31'                  // x264レベル (1920x1080では41に)
           + ' -refs 6'                    // 動き予測用フレーム参照数
           + ' -bf 3'                      // 最大連続Bフレーム数
           + ' -ar 48000'                  // 音声サンプリングレート
           + ' "' + path.resolve(destDir, destName) + '"',
    { maxBuffer: 1024 * 1024 },
    function(err, stdout, stderr) {
      if (err) {
        util.log(err);
        util.log('encode failed');
      } else {
        util.log('encode finished: ' + path.resolve(destDir, destName));
      }
      var encodeTime = Date.now() - encodeStart;
      util.log('    time: ' + formatToHMS(encodeTime));
    }
  );
}

function main() {
  encode();
}

main();
