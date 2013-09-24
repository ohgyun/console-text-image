#!/usr/bin/env node

var restler = require('restler');
var path = require('path');
var fs = require('fs');
var q = require('q');
var optimist = require('optimist');


var argv = optimist
    .usage('Convert an image to text image data.\nUsage: $0')

    .demand('i')
    .alias('i', 'image')
    .describe('i', 'Image file path to convert.')

    .alias('o', 'output')
    .describe('o', 'Output file (default STDOUT)')
    
    .argv;


var imagePath = argv.image;

var readImageStat = q.nfcall(fs.stat, imagePath);

// http://www.text-image.com/convert/
var postImageToConvert = function (stat) {
    var url = 'http://www.text-image.com/convert/pic2html.cgi';
    var deferred = q.defer();
    restler.post(url, {
        multipart: true,
        data: {
            characters: '1',
            textType: 'sequence',
            fontsize: 1,
            width: 80,
            grayscale: 0,
            bgcolor: 'BLACK',
            contrast: 0,
            browser: 'firefox',
            // restler.file(path, filename, fileSize, encoding, contentType)
            image: restler.file(imagePath, null, stat.size, null, null)
        }
    }).on('success', function (data) {
        deferred.resolve(data);
    }).on('fail', function () {
        deferred.reject(new Error('Request failed to server.'));
    });
    return deferred.promise;
};

var parseResponseHtml = function (html) {
    var deferred = q.defer();

    var start = '<!-- IMAGE BEGINS HERE -->';
    var end = '<!-- IMAGE ENDS HERE -->';
    var regex = new RegExp(start + '(.*)' + end, 'm');

    var str = html.replace(/[\r\n]/g, '');

    var match = regex.exec(str);

    if (match && match[1]) {
        deferred.resolve(match[1]);
    } else {
        deferred.reject(new Error('Responsed HTML is invalid.'));
    }

    return deferred.promise;
};

var makeImageTextData = function (str) {
    // 시작 태그 정리
    str = str.replace(/^<font size="1"><pre>/, '');

    // 마지막 종료 태그 정리
    str = str.replace(/<br><\/pre><\/font>$/, '');

    // 이미지 변환 시 <font> 태그의 닫는 태그가 제대로 출력되지 않는 경우가 있다.
    // 예를 들면, `<font>A/font>`나 `<font>Afont>` 같은 식이고, 이런 코드가 있다면 수정한다.
    str = str.replace(/([01]+)(?:\/?font>)/g, '$1</font>');

    // 열린 태그 이후에 꺽쇠가 생략된 경우도 보정한다.
    str = str.replace(/(#\w{6})(?!>)/g, '$1>');

    // <font> 태그의 여는 태그가 생략된 경우도 있다.
    str = str.replace(/>font/g, '><font');

    var lines = str.split('<br>');

    var regex = /<font color=#([a-z0-9]+)>([01]+)<\/font>/g;

    // `컬러-개수,컬러-개수,컬러-개수/컬러-개수,컬러-개수` 형태의 문자열을 만든다.
    // 슬래시는 라인 브레이크를 나타낸다.
    // 예: fad910-37,f9d910-1,fad910-42/fad910-27,f7d611-1
    var result = lines.map(function (line) {
        var values = [];

        while (regex.test(line)) {
            var color = RegExp.$1;
            var code = RegExp.$2;

            values.push(color + '-' + code.length);
        }

        return values.join(',');
    });

    return result.join('/');
};

var writeToOutput = function (data) {
    var deferred = q.defer();

    var output = argv.o;
    if (output) {
        fs.writeFile(path.join(__dirname, output), data, deferred.makeNodeResolver());
    } else {
        console.log(data);
        deferred.resolve();
    }

    return deferred.promise;
};

// main job
readImageStat
    .then(postImageToConvert)
    .then(parseResponseHtml)
    .timeout(10000)
    .then(makeImageTextData)
    .then(writeToOutput)
    .fail(function (reason) {
        throw new Error(reason);
    })
    .done();