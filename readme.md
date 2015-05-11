# Taps

/Taps/ is a small counter, written in HTML/JavaScript and optimized for mobile devices.
Its aim is to assist you in counting simple events like people entering and leaving a location or your lecturer's use of
expletives. In contrast to any other similar app, it logs every event (tap) with a timestamp for further statistics.

The logged data is shown in a chart (made with CanvasJS). You can also download it as JSON or CSV file.

## More Features

* All data is stored in the browser's localStorage, so you won't loose your counter states on closing the tab.
* /Taps/ has a dark, OLED screen friendly skin, and will fit perfectly on every smartphone display. Maybe there will be an update to provide full responsiveness for larger screens.
* /Taps/ allows multiple counters and has a simple select box to switch between them on the fly.

## How to install

Download the latest stable version from master branch (Yes, there aren't any yet.) or development version from develop
branch.

Download jQuery 2.1.4 from [] and canvasJS from [] and place the minified js files in `/lib` folder.

Open index.htm in your browser or provide it as a web service.


## License

Although license headers and specification are missing yet, you may consider GNU Public License v3 to be applicable
for /Taps/ itself.