
export interface WatchedObject {
    [key: string]: any;
}

type OnChangeCallback = (key: string, newValue: any, oldValue: any) => void;

export function createWatchedObject(obj: WatchedObject, onChange: OnChangeCallback): WatchedObject {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Invalid input object');
    }

    if (typeof onChange !== 'function') {
        throw new Error('Invalid onChange callback function');
    }

    function onSet(target: WatchedObject, key: string, value: any): boolean {
        const oldValue = target[key];
        target[key] = value;
        if (oldValue !== value) {
            onChange(key, value, oldValue);
        }
        return true;
    }

    const proxyObj = new Proxy(obj, { get: onGet, set: onSet });
    return proxyObj;

    function onGet(target: WatchedObject, key: string): any {
        return target[key];
    }
}