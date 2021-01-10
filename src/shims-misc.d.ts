declare module 'json5' {
    const JSON5: {
        parse: typeof JSON.parse
    };

    export default JSON5;
}

declare module 'stats.js' {
    class Stats {
        dom: HTMLDivElement;

        // 0: fps, 1: ms, 2: mb, 3+: custom
        showPanel(type: number): void;

        begin(): void;

        end(): void;
    }

    export default Stats;
}
