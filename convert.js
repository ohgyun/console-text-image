#!/usr/bin/env node

var restler = require('restler');
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

    .alias('w', 'width')
    .describe('w', 'Width of each line (default 80)')

    .alias('v', 'variable')
    .describe('v', 'Global variable name to assign data')
    
    .argv;


var imagePath = argv.image;

var readImageStat = q.nfcall(fs.stat, imagePath);

// request to http://www.text-image.com/convert/
var postImageToConvert = function (stat) {
    var url = 'http://www.text-image.com/convert/pic2html.cgi';
    var deferred = q.defer();
    restler.post(url, {
        multipart: true,
        data: {
            characters: '1',
            textType: 'sequence',
            fontsize: 1,
            width: argv.width || 80,
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
    // remove start tag
    str = str.replace(/^<font size="1"><pre>/, '');

    // remove end tag
    str = str.replace(/<br><\/pre><\/font>$/, '');

    // fix unclosed <font> tags
    // ex) `<font>A/font>` or `<font>Afont>`
    str = str.replace(/([01]+)(?:\/?font>)/g, '$1</font>');

    // fix case of `<fontA`
    str = str.replace(/(#\w{6})(?!>)/g, '$1>');

    // fix unopend <font> tag
    // ex) `font>A`
    str = str.replace(/>font/g, '><font');

    // modify string to color code
    // ex) black or white
    str = str.replace(/black/ig, '#000000');
    str = str.replace(/white/ig, '#ffffff');

    var lines = str.split('<br>');

    var regex = /<font color=#([a-z0-9]+)>([01]+)<\/font>/g;

    // make data strings with `color{4}count,color{4}count/color{4}count,..` pattern.
    // slash(/) character stands for line break
    // ex) abcd37,bcde1/cdef27,efgh1
    var result = lines.map(function (line) {
        var values = [];

        while (regex.test(line)) {
            var color = RegExp.$1;
            var code = RegExp.$2;

            values.push(encode(color) + code.length);
        }

        return values.join(',');
    });

    return result.join('/');
};

/**
 * encode color code using customized base64 in order to reduce data size.
 * ex) 'abcdef' --> 'q83v'
 * @param {String} code color code (6 hex, ex: efefef)
 */
function encode(color) {
    var keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>';
    var n, enc1, enc2;
    var encoded = '';
    for (var i = 0; i < 6; i += 3) {
        n = parseInt(color.substr(i, 3), 16);
        enc1 = n >> 6;
        enc2 = n & 63;
        encoded += keystr.charAt(enc1) + keystr.charAt(enc2);
    }
    return encoded;
}

var assignToVariable = function (data) {
    if (argv.v) {
        // assign data to variable
        // ex) var name = 'data';
        return 'var ' + argv.v + '=\'' + data + '\';';
    }
    return data;
};

var writeToOutput = function (data) {
    var deferred = q.defer();

    var output = argv.o;
    if (output) {
        fs.writeFile(output, data, deferred.makeNodeResolver());
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
    .then(assignToVariable)
    .then(writeToOutput)
    .fail(function (reason) {
        throw new Error(reason);
    })
    .done();