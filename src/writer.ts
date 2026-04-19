import fs from 'node:fs';
import path from 'node:path';

export function writeRendered(filePath: string, sql: string): void {
    const resolved = path.resolve(filePath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, sql, 'utf-8');
}
