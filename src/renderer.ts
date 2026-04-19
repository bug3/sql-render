const TOKEN_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

export function render(template: string, values: Record<string, string>): string {
    return template.replace(TOKEN_REGEX, (match, key) => (
        Object.hasOwn(values, key) ? values[key] : match
    ));
}
