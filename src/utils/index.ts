export async function ping(url: string): Promise<boolean> {
    try {
        return (await fetch(url)).ok;
    } catch (e) {
        return false;
    }
}
