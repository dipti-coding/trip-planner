// Minimal ambient types so the jest corpus test can read fixture files from disk.
// The project doesn't ship @types/node (RN runtime has no fs), but jest runs on
// Node, where these are available at test time.
declare module 'fs' {
  export function readFileSync(path: string, encoding: string): string;
}
declare module 'path' {
  export function join(...parts: string[]): string;
}
declare const __dirname: string;
