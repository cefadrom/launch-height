type PointsObject = { [timestamp: number]: number };

export default class DrawGraph {

    private readonly ctx: CanvasRenderingContext2D;
    private readonly height: number;
    private readonly width: number;
    private readonly pointRange: number;
    private points: PointsObject = {};
    private interval = -1;

    constructor(canvas: JQuery<HTMLCanvasElement>) {
        this.ctx = canvas[0].getContext('2d')!;
        this.height = canvas.prop('height') || canvas.height();
        this.width = canvas.prop('width') || canvas.width();
        this.pointRange = this.height / 2 - 20;
        this.initCanvas = this.initCanvas.bind(this);
        this.updateCanvas = this.updateCanvas.bind(this);
    }

    private initCanvas(yIndicators = true) {
        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);
        // Bars
        this.ctx.fillStyle = '#707070';
        this.ctx.fillRect(20, 20, 2, this.height - 40);
        this.ctx.fillRect(20, this.height / 2 - 1, this.width - 40, 2);
        // Labels
        this.ctx.fillStyle = 'black';
        this.ctx.font = '15px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Accélération (m/s)', 3, 3);
        this.ctx.textAlign = 'center';
        this.ctx.save();
        this.ctx.rotate(90 * Math.PI / 180);
        this.ctx.fillText('Temps (s)', this.height / 2, -this.width + 3);
        this.ctx.restore();
        // Indicators
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('0', 18, this.height / 2);
        if (yIndicators) {
            this.ctx.fillText('10', 18, 25);
            this.ctx.font = '12px Arial';
            this.ctx.fillText('-10', 18, this.height - 25);
        }
        this.ctx.font = '15px Arial';
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('0', this.width - 25, this.height / 2 + 5);
        this.ctx.fillText('5', 30, this.height / 2 + 5);
    }

    private updateCanvas() {
        // Cleaning
        this.initCanvas(false);
        this.clearPoints();
        // Gather values
        const points = this.points;
        const pointKeys = this.getPointsKeys(points);
        const maxYValue = this.getExtremeValue(points);
        const now = Date.now();
        // Draw path
        this.ctx.beginPath();
        pointKeys.forEach((key, index) => {
            const { posX, posY } = this.getPosFromPoint(+key, this.points[+key], now, maxYValue);
            if (index === 0 || index === pointKeys.length - 1)
                this.ctx.moveTo(posX, posY);
            else
                this.ctx.lineTo(posX, posY);
        });
        this.ctx.closePath();
        // Display path
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // Add y indicators
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(maxYValue.toFixed(1), 18, 25, 18);
        this.ctx.fillText(`-${maxYValue.toFixed(1)}`, 18, this.height - 25, 18);
    }

    private getPosFromPoint(timestamp: number, pointValue: number, now: number, maxY: number) {
        // X
        const deltaTime = now - timestamp;
        const posX = this.width - 24 - (deltaTime / 5000 * (this.width - 44));
        // Y
        if (pointValue > maxY)
            pointValue = maxY;
        else if (pointValue < -maxY)
            pointValue = -maxY;
        const posY = (pointValue / maxY * this.pointRange) + (this.height / 2);

        return { posX, posY };
    }

    private clearPoints() {
        Object.keys(this.points).forEach(key => {
            const ts = +key;
            if (ts < Date.now() - 5000) {
                delete this.points[ts];
            }
        });
    }

    private getPointsKeys(points = this.points): number[] {
        return Object.keys(points).map(key => +key);
    }

    private getExtremeValue(points = this.points) {
        const sortedValues = Object.values(points).sort();
        let max = Math.max(
            sortedValues.slice(-1)[0],
            Math.abs(sortedValues[0]),
        );
        return max + 1;
    }

    public startDrawing() {
        this.interval = setInterval(this.updateCanvas, 1000 / 25);
    }

    public stopDrawing() {
        clearInterval(this.interval);
    }

    public addPoint(point: number) {
        this.points[Date.now()] = point;
    }

}
