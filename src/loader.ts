import fs from 'node:fs';
import path from 'node:path';

const TOKEN_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function loadTemplate(filePath: string): { template: string; tokens: string[] } {
    const resolved = path.resolve(filePath);

    if (!fs.existsSync(resolved)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const template = fs.readFileSync(resolved, 'utf-8');
    const tokens: string[] = [];
    let match: RegExpExecArray | null;

    // eslint-disable-next-line no-cond-assign
    while ((match = TOKEN_REGEX.exec(template)) !== null) {
        if (!tokens.includes(match[1])) {
            tokens.push(match[1]);
        }
    }

    return { template, tokens };
}
