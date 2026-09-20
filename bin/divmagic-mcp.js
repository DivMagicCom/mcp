#!/usr/bin/env node
import { agents, detectGlobalAgents, getAgentTypes, upsertServer } from 'add-mcp';

import { verifyKey } from '../src/verify.js';
import { ask, askSecret, choose, close, bold, dim, green, red, yellow } from '../src/prompt.js';

const DEFAULT_ENDPOINT = 'https://api.divmagic.com/v1/mcp';
const DASHBOARD = 'https://divmagic.com/dashboard';
const SERVER_NAME = 'divmagic';

function parseArgs(argv) {
    const args = { agents: null };
    for (let i = 0; i < argv.length; i++) {
        const [flag, inline] = argv[i].split('=');
        const value = () => inline ?? argv[++i];
        if (flag === '--key') args.key = value();
        else if (flag === '--endpoint') args.endpoint = value();
        else if (flag === '--agent' || flag === '-a') (args.agents ||= []).push(value());
        else if (flag === '--all') args.all = true;
        else if (flag === '--yes' || flag === '-y') args.yes = true;
        else if (flag === '--help' || flag === '-h') args.help = true;
    }
    return args;
}

function usage() {
    console.log(`
${bold('divmagic-mcp')} — install DivMagic into your coding agents

  ${dim('$')} npx divmagic-mcp

Options
  --key <key>        Your DivMagic MCP key. Optional. Asked for if not given; Enter skips.
  -a, --agent <id>   Install only to this agent. Repeatable.
  --all              Install to every supported agent, not only those found.
  -y, --yes          Take the detected agents without asking.
  --endpoint <url>   Override the server address.
  -h, --help         This.

Supported agents (${getAgentTypes().length}):
  ${getAgentTypes().join(', ')}

Your key comes from ${DASHBOARD}
`);
}

function label(agentType) {
    return agents[agentType]?.displayName || agentType;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) return usage();

    const endpoint = args.endpoint || DEFAULT_ENDPOINT;

    console.log(`\n${bold('DivMagic')} — copy any component from a live web page, from inside your agent.\n`);

    let key = args.key;
    if (!key && !args.yes) {
        console.log(`Create a key at ${bold(DASHBOARD)} — shown once. Or skip and add it later.\n`);
        key = await askSecret('Paste your key (Enter to skip): ');
    }
    key = (key || '').trim();

    if (key) {
        process.stdout.write('\nChecking the key… ');
        const check = await verifyKey(endpoint, key);
        if (!check.ok) {
            console.log(red('no.'));
            console.log(`\n${check.reason}`);
            console.log(dim('Nothing was changed.'));
            process.exitCode = 1;
            return;
        }
        console.log(green('works.') + dim(`  (${check.tools.join(', ')})`));
    } else {
        console.log(dim('\nNo key yet. First copy will send you to ' + DASHBOARD + ' to get one.\n'));
    }

    const detected = await detectGlobalAgents();
    let chosen;

    if (args.agents) {
        const known = getAgentTypes();
        const unknown = args.agents.filter((a) => !known.includes(a));
        if (unknown.length > 0) {
            console.log(red(`\nNot an agent this knows about: ${unknown.join(', ')}`));
            console.log(dim(`Try one of: ${known.join(', ')}`));
            process.exitCode = 1;
            return;
        }
        chosen = args.agents;
    } else if (args.all) {
        chosen = getAgentTypes();
    } else if (detected.length === 0) {
        console.log(yellow('\nNo supported agent found on this machine.'));
        console.log(dim('Install one, or name it directly with --agent. See --help for the list.'));
        process.exitCode = 1;
        return;
    } else if (args.yes) {
        chosen = detected;
    } else {
        const picked = await choose(
            `Found ${detected.length} on this machine. Which should get DivMagic?`,
            detected.map((type) => ({ id: type, label: label(type) })),
        );
        if (picked.length === 0) {
            console.log(dim('\nNothing chosen. Nothing was changed.'));
            return;
        }
        chosen = picked.map((p) => p.id);
    }

    console.log('');
    const serverConfig = { type: 'http', url: endpoint };
    if (key) serverConfig.headers = { Authorization: `Bearer ${key}` };
    let failures = 0;

    for (const agentType of chosen) {
        const result = upsertServer(agentType, SERVER_NAME, serverConfig, { local: false });
        if (result.success) {
            console.log(`  ${green('✓')} ${label(agentType)} ${dim(result.path)}`);
            if (result.droppedFields?.length) {
                console.log(`    ${yellow('!')} ${dim(`this agent ignores: ${result.droppedFields.join(', ')}`)}`);
            }
        } else {
            failures++;
            console.log(`  ${red('✗')} ${label(agentType)} — ${result.error || 'could not write its config'}`);
        }
    }

    console.log(`\n${bold('Restart the agents you just changed')} — none of them reread their config while running.`);
    console.log(`Then ask one to ${dim('"copy the infobox from en.wikipedia.org/wiki/HTML as JSX"')}.\n`);
    if (!key) {
        console.log(dim(`No key in the config. First copy replies with a signup link at ${DASHBOARD}.\n`));
    }
    console.log(dim(`Server name: ${SERVER_NAME}    Endpoint: ${endpoint}`));

    if (failures > 0) process.exitCode = 1;
}

main()
    .catch((error) => {
        console.error(red(`\n${error.message}`));
        process.exitCode = 1;
    })
    .finally(close);
