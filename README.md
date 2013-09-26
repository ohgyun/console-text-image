ConsoleTextImage
==================

ConsoleTextImage is a tiny script to print image to console.  
You can make text data from an image and print it to console panel of chrome developer tool.

Just for fun!


### Examples
You can view the examples of the ConsoleTextImage [in this page](http://ohgyun.github.io/console-text-image/example/example.html).


### Usage
1. Make text data with your own image using `convert.js`. (Check below)
2. Add `console-text-image.min.js` to your page.
````
<script src="console-text-image.min.js"></script>
````

3. Create a `ConsoleTextImage` instance.
````
var options = {
    data: {text data you made},
    word: {word to fill the image},
    phrase: {if you call print func on console, it prints this phrase first},
    globalFuncName: {you can print via this function globally, without an instance},
    linePrintingInterval: {line printing interval (ms)}
};
var image = ConsoleTextImage(options);
image.print(); // print to console.
````


### Making text data from an image
You can make text data using `convert.js` node script.  
(Powered by http://www.text-image.com/convert/)

````
$ npm install # install dependencies

$ node ./convert.js # show usage

$ node ./convert.js -i {imageFilePath} -o {outputFilePath}

$ node ./convert.js -i example.png -o example.data
````


### License
Copyright 2013 [Ohgyun Ahn](mailto:ohgyun@gmail.com) MIT License
