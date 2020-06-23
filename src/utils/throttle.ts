export default function throttle(callback: Function, delay: number): any {
    let last: number;
    let timer: number;
    return function (this: any) {
        let context = this;
        let now = Date.now();
        let args = arguments;
        if (last && now < last + delay) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                last = now;
                callback.apply(context, args);
            }, delay);
        } else {
            last = now;
            callback.apply(context, args);
        }
    };
}