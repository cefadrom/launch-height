import $ from 'jquery';
import SensorData, { Cordinates } from '../../utils/SensorData';
import throttle from '../../utils/throttle';


// ---------- DOM elements ----------

const el = {
    // Containers
    result: $('#result'),
    errorContainer: $('#error-container'),
    // Display
    x: $('#result-x'),
    y: $('#result-y'),
    z: $('#result-z'),
    dataCount: $('#result-datacount'),
    dataRate: $('#result-datarate'),
    errorBody: $('#error-body'),
    // Settings
    pause: $('#pause'),
    reset: $('#reset'),
    gravity: $('#gravity') as JQuery<HTMLInputElement>,
    limit: $('#limit') as JQuery<HTMLInputElement>,
    errorResume: $('#error-resume'),
};


// ---------- Variables ----------

// Stats
let dataCount = 0;
let dataRate = 0;

// Settings
let paused = false;
let excludeGravity: boolean = el.gravity.prop('checked') || false;
let rateLimit = el.limit.val() as number || 0;


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

el.errorResume.on('click', () => {
    el.errorContainer.addClass('d-none');
    el.result.removeClass('ghost');
    start();
});


// ---------- Processing and display ----------

const sensorData = new SensorData({ excludeGravity });


function processSensorData(data: Cordinates, err?: string) {

    if (err)
        return handleError(err);

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


function handleError(e: string) {
    el.errorContainer.removeClass('d-none');
    el.errorBody.text(e);
    el.result.addClass('ghost');
    pause();
}


function start() {
    el.result.removeClass('d-none');
    paused = false;
    sensorData.subscribe(throttle(processSensorData, rateLimit !== 0 ? 1000 / rateLimit : 1));
    sensorData.startListening();
}


function pause() {
    paused = true;
    sensorData.stopListening();
}


start();
