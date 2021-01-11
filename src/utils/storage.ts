export function save(key: string) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const set = descriptor.set!;

        descriptor.set = function(value: any) {
            set.call(this, value);
            saveValue(key, value);
        };

        const value = loadValue(key, descriptor.get!.call(target));
        set.call(target, value);
    };
}

export function saveValue<T = any>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function loadValue<T = any>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);

    if (data === null) {
        return defaultValue;
    }

    return JSON.parse(data);
}
