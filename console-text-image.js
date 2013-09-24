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
        
        function print() {
            if (console.clear) {
                console.clear();
            }

            // `color-count,color-count/color-count,...` 형태의 데이터를 파싱한다.
            config.data.split('/').forEach(function (line, i) {
                var str = '';
                var colors = [];

                line.split(',').forEach(function (block) {
                    var values = block.split('-');
                    var color = '#' + values[0];
                    var count = Number(values[1]);

                    for (var i = 0; i < count; i++) {
                        str += '%c' + config.word[wordCursor++ % wordLength];
                        colors.push('color:' + color + ';background:' + color);
                    }
                });

                setTimeout(function () {
                    console.log.apply(console, [str].concat(colors));
                }, config.linePrintingInterval * i);
            });

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
