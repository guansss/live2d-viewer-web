export function save<T = any>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function load<T = any>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(key);

    if (data === null) {
        return defaultValue;
    }

    return JSON.parse(data);
}
