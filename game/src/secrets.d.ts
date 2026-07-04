declare module 'secrets.js-grempe' {
    export function share(secret: string, numShares: number, threshold: number): string[];
    export function combine(shares: string[]): string;
    export function str2hex(str: string): string;
    export function hex2str(hex: string): string;
}
