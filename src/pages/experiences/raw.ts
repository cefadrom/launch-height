import $ from 'jquery';
import ErrorHandler from '../../utils/ErrorHandler';
import SensorData, { Cordinates } from '../../utils/SensorData';


// ---------- DOM elements ----------

const el = {
    // Containers
    result: $('#result'),
    // Display
    x: $('#result-x'),
    y: $('#result-y'),
    z: $('#result-z'),
    dataCount: $('#result-datacount'),
    dataRate: $('#result-datarate'),
    // Settings
    pause: $('#pause'),
    reset: $('#reset'),
    gravity: $('#gravity') as JQuery<HTMLInputElement>,
    limit: $('#limit') as JQuery<HTMLInputElement>,
};


// ---------- Variables ----------

// Stats
let dataCount = 0;
let dataRate = 0;

// Settings
let paused = false;
let excludeGravity: boolean = el.gravity.prop('checked') || false;
const limitValue = el.limit.val();
let rateLimit = 0;
if (typeof limitValue === 'string' && !isNaN(parseInt(limitValue)))
    rateLimit = parseInt(limitValue);


// ---------- Settings handlers ----------

el.pause.on('click', () => {
    if (paused) {
        start();
        el.pause
            .addClass('btn-warning')
            .removeClass('btn-success')
            .text('Pause');
    } else {
        pause();
        el.pause
            .removeClass('btn-warning')
            .addClass('btn-success')
            .text('Reprendre');
    }
});


el.reset.on('click', () => {
    dataCount = 0;
    dataRate = 0;
    displayData({ x: 0, y: 0, z: 0 });
});


el.gravity.on('change', e => {
    sensorData.excludeGravity = e.target.checked;
});

el.limit.on('change', e => {
    let value = parseInt(e.target.value);
    if (isNaN(value)) return;
    sensorData.setThrottle(value);
});


// ---------- Processing and display ----------

const errorHandler = new ErrorHandler(el.result);
const sensorData = new SensorData({ excludeGravity, throttle: rateLimit });
sensorData.errorHandler = err => {
    errorHandler.catchError(err);
    pause();
};
errorHandler.resumeErrorCallback = start;


function processSensorData(data: Cordinates) {
    dataCount++;
    dataRate++;
    setTimeout(() => dataRate--, 1000);

    displayData(data);
}


function displayData({ x, y, z }: Cordinates) {
    el.x.text(x);
    el.y.text(y);
    el.z.text(z);
    el.dataCount.text(dataCount);
    el.dataRate.text(dataRate);
}


function start() {
    el.result.removeClass('d-none');
    paused = false;
    sensorData.subscribe(processSensorData);
    sensorData.startListening();
}


function pause() {
    paused = true;
    sensorData.stopListening();
}


start();
