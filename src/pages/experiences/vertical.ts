import $ from 'jquery';
import DrawGraph from '../../utils/DrawGraph';
import throttle from '../../utils/throttle';

const el = {
    body: $('body'),
    acceleration: $('#acceleration'),
    direction: $('#direction'),
    graph: $('#graph') as JQuery<HTMLCanvasElement>,
};

/** -1 = down; 0 = no movement; 1 = up */
export type MotionType = -1 | 0 | 1;

let motion: MotionType = 0;

const Graph = new DrawGraph(el.graph);
Graph.startDrawing();

function handleDeviceMotion(ev: DeviceMotionEvent) {
    const z = ev.acceleration!.z;
    if (typeof z === 'number') {
        el.acceleration.text(z.toFixed(2));
        updateMotion(z);
        Graph.addPoint(z);
    }
}


let lastBigDirectionChange = 0;

function updateMotion(z: number) {
    if (z > 1) { // Speed increase
        if (motion === 0 && lastBigDirectionChange + 300 < Date.now()) { // If speed was null it accelerates upward
            motion = 1;
        }
    } else if (z < -1) {
        if (motion === 0 && lastBigDirectionChange + 300 < Date.now()) { // If speed was null it accelerates downward
            motion = -1;
        }
    } else {
        motion = 0;
    }
    // displayMotion();
}


function displayMotion() {
    if (motion === 1) {
        el.body
            .removeClass('bg-success')
            .addClass('bg-danger');
        el.direction.text('⬆');
    } else if (motion === -1) {
        el.body
            .removeClass('bg-danger')
            .addClass('bg-success');
        el.direction.text('⬇');
    } else {
        el.body.removeClass([ 'bg-success', 'bg-danger' ]);
        el.direction.text('-');
    }
}

window.addEventListener('devicemotion', throttle(handleDeviceMotion, 1000 / 25), false);
