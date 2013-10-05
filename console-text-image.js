;(function (global) {
    if (! global.chrome) { return; }

    function extend(dest, src) {
        for (var k in src) {
            if (src.hasOwnProperty(k)) {
                dest[k] = src[k];
            }
        }
        return dest;
    }

    var keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>!@#$%^&*()_+[]{}';

    /**
     * decode color code using customized base64
     * ex) 'q83v' --> 'abcdef'
     * @param {String} encoded
     */
    function decodeColor(encoded) {
        var enc1, enc2, c1, c2, c3;
        var decoded = '';
        for (var i = 0; i < 4; i += 2) {
            enc1 = keystr.indexOf(encoded[i]);
            enc2 = keystr.indexOf(encoded[i + 1]);

            c1 = enc1 >> 2;
            c2 = ((enc1 & 3) << 2) | enc2 >> 4;
            c3 = enc2 & 15;

            decoded += c1.toString(16) + c2.toString(16) + c3.toString(16);
        }
        return decoded;
    }

    /**
     * decode code length using keystr
     * @param {String} char
     */
    function decodeLength(char) {
        return keystr.indexOf(char) + 1;
    }

    global.ConsoleTextImage = function (options) {
        var config = extend({
            word: '01',
            linePrintingInterval: 0,
            data: '',
            phrase: '',
            globalFuncName: ''
        }, options);

        var wordCursor = 0;
        var wordLength = config.word.length;
        var LINE_BREAK = '/';
        
        function print() {
            if (console.clear) {
                console.clear();
            }

            config.data.split('/').forEach(function (line, lineIdx) {
                var str = '';
                var colors = [];

                for (var i = 0, len = line.length; i < len; i += 5) {
                    // block = `color{4}count{1}`
                    var color = '#' + decodeColor(line.substr(i, 4));
                    var count = decodeLength(line.substr(i+4, 1));

                    for (var j = 0; j < count; j++) {
                        str += '%c' + config.word[wordCursor++ % wordLength];
                        colors.push('color:' + color + ';background:' + color);
                    }
                }

                setTimeout(function () {
                    console.log.apply(console, [str].concat(colors));
                }, config.linePrintingInterval * lineIdx);
            });

            // reset word cursor
            wordCursor = 0;

            return config.phrase;
        }

        print.toString = function () {
            return 'I am a function. Please call me!';
        };

        if (config.globalFuncName) {
            global[config.globalFuncName] = print;
        }

        return {
            print: print
        };
    };
}(this));
