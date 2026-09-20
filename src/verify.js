const LIST_TOOLS = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
};

function parseReply(body) {
    const text = body.trim();
    const payload = text.startsWith('event:') || text.startsWith('data:')
        ? text
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('')
        : text;
    return JSON.parse(payload);
}

export async function verifyKey(endpoint, key) {
    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(LIST_TOOLS),
            signal: AbortSignal.timeout(20000),
        });
    } catch (error) {
        return {
            ok: false,
            reason:
                error.name === 'TimeoutError'
                    ? 'The server did not answer in time. Check your connection and try again.'
                    : `Could not reach ${endpoint}.`,
        };
    }

    if (response.status === 401) {
        return { ok: false, reason: 'That key was not accepted. Check it, or create a new one in the dashboard.' };
    }
    if (!response.ok) {
        return { ok: false, reason: `The server answered ${response.status}.` };
    }

    try {
        const message = parseReply(await response.text());
        if (message.error) return { ok: false, reason: message.error.message || 'The server returned an error.' };
        return { ok: true, tools: (message.result?.tools || []).map((tool) => tool.name) };
    } catch {
        return { ok: false, reason: 'The server’s reply could not be read.' };
    }
}
