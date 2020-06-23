import throttle from './throttle';

export type Cordinates = { x: number, y: number, z: number };
export type SensorCallback = (data: Cordinates, error?: string) => any;

export default class SensorData {

    private callback?: SensorCallback;
    private noDataTimeout?: number = undefined;
    private throttleValue: number | null;
    private sensorCallback: (ev: DeviceMotionEvent) => any;
    private consecutiveErrors = 0;
    public excludeGravity: boolean;

    /**
     * @param throttleValue Optional throttle value (in times per second)
     * @param excludeGravity Exclude the gravity in the returned values
     */
    constructor({ throttle: throttleValue = null, excludeGravity = false }: { throttle?: null | number, excludeGravity?: boolean } = {}) {
        this.throttleValue = throttleValue;
        this.excludeGravity = excludeGravity;
        this.handleSensorData = this.handleSensorData.bind(this);
        this.startListening = this.startListening.bind(this);
        this.stopListening = this.stopListening.bind(this);
        this.setThrottle = this.setThrottle.bind(this);
        this.sensorCallback = throttle(this.handleSensorData, 0);
    }

    private checkCallback() {
        if (!this.callback)
            throw new Error('Please subscribe fisrt');
        return true;
    }

    private handleSensorData(ev: DeviceMotionEvent) {

        if (this.noDataTimeout) {
            clearTimeout(this.noDataTimeout);
            this.noDataTimeout = undefined;
        }

        if (!this.checkCallback()) return;

        let data;
        if (this.excludeGravity)
            data = ev.acceleration;
        else
            data = ev.accelerationIncludingGravity;
        if (!data || data.x === null || data.y === null || data.z === null) {
            this.consecutiveErrors++;
            if (this.consecutiveErrors > 10) {
                return this.handleError(!data
                    ? `L'accéléromètre n'a retourné aucune donnée 10 fois de suite.`
                    : `L'accéléromètre a retourné des données incomplètes 10 fois de suite.`,
                );
            }
        } else {
            this.callback!(data as Cordinates);
        }
    }

    private handleError(err: string) {
        clearInterval(this.noDataTimeout);
        this.stopListening();
        this.checkCallback();
        this.callback!({ x: 0, y: 0, z: 0 }, err);
    }

    public startListening() {
        this.noDataTimeout = setTimeout(
            () => this.handleError(`L'accéléromètre n'a retourné aucune donnée après une seconde.`),
            1000,
        );

        this.sensorCallback = throttle(this.handleSensorData, this.throttleValue ? 1000 / this.throttleValue : 0);

        if (window.DeviceMotionEvent) {
            try {
                window.addEventListener('devicemotion', this.sensorCallback, false);
            } catch (e) {
                this.handleError(e);
            }
        } else {
            this.handleError(`Impossible d'accéder à l'accéléromètre.`);
        }
    }

    public stopListening() {
        window.removeEventListener('devicemotion', this.sensorCallback);
    }

    public subscribe(callback: SensorCallback) {
        this.callback = callback;
    }

    public setThrottle(throttle: number | null) {
        this.throttleValue = throttle;
        this.stopListening();
        this.startListening();
    }

}
