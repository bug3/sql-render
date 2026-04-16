export function render(template: string, values: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(values)) {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\{\\{${escaped}\\}\\}`, 'g');
        result = result.replace(pattern, () => value);
    }

    return result;
}
