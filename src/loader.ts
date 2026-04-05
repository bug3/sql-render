import fs from 'node:fs';
import path from 'node:path';

const TOKEN_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function loadTemplate(filePath: string): { template: string; tokens: string[] } {
    const resolved = path.resolve(filePath);

    if (!fs.existsSync(resolved)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const template = fs.readFileSync(resolved, 'utf-8');
    const seen = new Set<string>();
    const tokens: string[] = [];

    for (const match of template.matchAll(TOKEN_REGEX)) {
        if (!seen.has(match[1])) {
            seen.add(match[1]);
            tokens.push(match[1]);
        }
    }

    return { template, tokens };
}
