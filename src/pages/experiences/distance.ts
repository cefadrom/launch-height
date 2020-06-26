import $ from 'jquery';
import _ from 'lodash';
import ErrorHandler from '../../utils/ErrorHandler';
import SensorData from '../../utils/SensorData';

const el = {
    // Containers
    result: $('#result'),
    // Display
    acceleration: $('#acceleration'),
    step: $('#step'),
    motions: $('#motions'),
    // Misc
    restart: $('#restart') as JQuery<HTMLButtonElement>,
};

const g = 9.81;
type DataType = { [timestamp: number]: number }
let savedData: DataType = {};
let step: 'wait' | 'record' | 'process' | 'finish' = 'wait';


const errorHandler = new ErrorHandler(el.result);
const sensorData = new SensorData({ throttle: 60, excludeGravity: false });
sensorData.subscribe(handleSensorData);
sensorData.errorHandler = errorHandler.catchError;
errorHandler.resumeErrorCallback = start;


el.restart.on('click', start);

start();


function start() {
    savedData = {};
    step = 'wait';
    el.restart.addClass('d-none');
    el.motions.text('En attente de données');
    sensorData.startListening();
}


const handleBigValue = _.debounce(() => {
    step = 'process';
}, 2000);

function handleSensorData({ z }: { z: number }) {

    if (z > g + 4) {
        if (step === 'wait')
            step = 'record';
        handleBigValue();
    }

    if (step === 'record')
        savedData[Date.now()] = z;

    el.acceleration.text(z.toFixed(1));

    if (step === 'process')
        processData();

    el.step.text(prettifyStepName(step));
}

function processData() {
    step = 'finish';
    sensorData.stopListening();

    // Filtering useless data (last low values)
    const lastSmallKey = _.findLastKey(savedData, o => o > g + 4)!;
    const validKeys = _.filter(_.keys(savedData), val => +val < +lastSmallKey);
    savedData = _.pick(savedData, validKeys) as DataType;

    // Calculations with time
    const deltaTime = +_.findLastKey(savedData)! - +_.findKey(savedData)!;
    const timeHeight = 1 / 2 * g * (deltaTime / 2 / 1000) ** 2;   // 1/2 * g * t²

    // Calculations with acceleration
    let currentAcceleration = 0, accelerationHeight = 0, previousTimestamp = +_.findKey(savedData)!;
    _.each(savedData, (acceleration, timestamp) => {
        currentAcceleration += acceleration;
        if (currentAcceleration > 0)    // a must be > 0
            accelerationHeight += 1 / 2 * currentAcceleration * ((+timestamp - previousTimestamp) / 1000) ** 2;  // 1/2 * a * t²
        previousTimestamp = +timestamp;
    });
    accelerationHeight = accelerationHeight / 2;    // Acc is the whole way, its half is the height

    // Display
    el.restart.removeClass('d-none');
    el.motions.html(`
        <h6 class="mt-2 mb-1">Enregistrement</h6>
        ${_.size(savedData)} données en ${deltaTime.toFixed(0)} ms
        <h6 class="mt-2 mb-1">Distances estimées</h6>
        Avec le temps : ${timeHeight.toFixed(3)} m
        <br>
        Avec l'accélération : ${accelerationHeight.toFixed(3)} m
        <br>
        Moyenne des deux : ${((timeHeight + accelerationHeight) / 2).toFixed(3)} m
    `);
}


function prettifyStepName(stepName: typeof step): string {
    switch (stepName) {
        case 'wait':
            return 'en attente';
        case 'record':
            return 'enregistrement';
        case 'process':
            return 'traitement';
        case 'finish':
            return 'terminé';
    }
}
