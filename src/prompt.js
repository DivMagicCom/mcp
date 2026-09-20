import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const ESC = '\u001b[';
const wrap = (code, s) => `${ESC}${code}m${s}${ESC}0m`;

export const bold = (s) => wrap(1, s);
export const dim = (s) => wrap(2, s);
export const green = (s) => wrap(32, s);
export const red = (s) => wrap(31, s);
export const yellow = (s) => wrap(33, s);

let rl;
function io() {
    if (!rl) rl = createInterface({ input: stdin, output: stdout });
    return rl;
}

export function close() {
    if (rl) rl.close();
    rl = undefined;
}

export async function ask(question) {
    const answer = await io().question(question);
    return answer.trim();
}

export async function askSecret(question) {
    const answer = await io().question(question);
    stdout.write(`${ESC}1A${ESC}2K${question}${dim('(hidden)')}\n`);
    return answer.trim();
}

export async function choose(question, options) {
    console.log('\n' + question);
    options.forEach((option, i) => {
        const note = option.note ? '  ' + dim(option.note) : '';
        console.log(`  ${bold(String(i + 1))}. ${option.label}${note}`);
    });

    const raw = await ask(`\nWhich? ${dim('(numbers separated by commas, or "all")')} `);
    if (!raw || raw.toLowerCase() === 'all') return options;

    const picked = raw
        .split(',')
        .map((part) => parseInt(part.trim(), 10))
        .filter((n) => n >= 1 && n <= options.length)
        .map((n) => options[n - 1]);

    return [...new Set(picked)];
}

export async function confirm(question) {
    const answer = await ask(`${question} ${dim('(y/n)')} `);
    return /^y(es)?$/i.test(answer);
}
