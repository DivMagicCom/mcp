# DivMagic MCP

Copy any component from a live web page as clean, self-contained HTML or JSX — from inside your agent.

DivMagic opens the page in a real browser and converts what it *renders*. That is the difference from fetching HTML: the output carries the computed styles, the resolved layout, and the markup the page actually produced, not the template it shipped.

```
You:   copy the pricing table from stripe.com/pricing as JSX with tailwind
Agent: → copy_component_from_url
       ← <section className="flex flex-col gap-8 …">…</section>
```

## Get a key

1. Sign in at [divmagic.com/dashboard](https://divmagic.com/dashboard)
2. Open **MCP** and choose **Create key**
3. Copy it straight away

Keys look like `dvmcp_…`, and are shown once. Losing a key means issuing a new one, which immediately revokes the old.

## Install

```bash
npx divmagic-mcp
```

It asks for your key, checks it against the server before touching anything, shows which agents it found, and writes only the ones you pick.

```
Checking the key… works.  (copy_component_from_url, get_component_result)

Found 3 on this machine. Which should get DivMagic?
  1. Claude Code
  2. Cursor
  3. VS Code

Which? (numbers separated by commas, or "all") all
```

Twenty-two agents are supported. Run `npx divmagic-mcp --help` for the list.

```bash
npx divmagic-mcp --key dvmcp_YOUR_KEY -a cursor -a claude-code -y
```

Restart any agent it changed.

<details>
<summary>Or configure it by hand</summary>

**Claude Code**

```bash
claude mcp add --transport http divmagic https://api.divmagic.com/v1/mcp \
  --header "Authorization: Bearer dvmcp_YOUR_KEY"
```

**Cursor** (`~/.cursor/mcp.json`), **VS Code** (`.vscode/mcp.json`), **Windsurf** (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "divmagic": {
      "url": "https://api.divmagic.com/v1/mcp",
      "headers": { "Authorization": "Bearer dvmcp_YOUR_KEY" }
    }
  }
}
```

**Claude Desktop**

```json
{
  "mcpServers": {
    "divmagic": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://api.divmagic.com/v1/mcp",
        "--header", "Authorization: Bearer dvmcp_YOUR_KEY"
      ]
    }
  }
}
```

</details>

## Tools

### `copy_component_from_url`

| Parameter | Type | Default | |
|---|---|---|---|
| `url` | string | — | The page to copy. A bare host works: `stripe.com/pricing`. |
| `componentFormat` | `html` \| `jsx` | `html` | Output language. |
| `styleFormat` | `inline` \| `tailwind` \| `local` \| `external` | `tailwind` | How styling is emitted. |
| `refresh` | boolean | `false` | Render the page again instead of reusing a recent copy. Costs a credit. |

A copy usually takes 10–30 seconds. If it has not finished in about twenty, you get a job id — `get_component_result` collects it.

### `get_component_result`

| Parameter | Type | |
|---|---|---|
| `jobId` | string | The id `copy_component_from_url` gave you. |
| `offset` | integer | Byte offset. Omit for the whole result. |
| `maxBytes` | integer | Bytes per piece, up to 256 KB. |

Polling costs nothing.

## How it behaves

**Large results.** Over 256 KB is not returned inline. You get the size, a download link valid for an hour, and the option to read by `offset`.

**Caching.** A rendered copy is reused for 24 hours. Pass `refresh: true` when a page has changed.

**Credits.** One credit per copy you receive. A failed copy costs nothing. Polling costs nothing.

**Limits.** A page gets 60 seconds to render. Pages behind a login, or that block automated browsers, will not copy.

## Troubleshooting

**`401` "Send your DivMagic MCP key"** — the `Authorization` header is not reaching us.

**`401` "This MCP key is not valid"** — the key was revoked. Create another in the dashboard.

**"Your MCP quota is exhausted"** — top up in the dashboard.

**"The attempt on this job stopped without finishing"** — call `copy_component_from_url` again with the same arguments.

## Support

A page that copied badly: [open an issue](https://github.com/DivMagicCom/mcp/issues).

Account, billing and key questions: [divmagic.com](https://divmagic.com).

## License

MIT — see [LICENSE](LICENSE). The DivMagic service is governed by its [terms](https://divmagic.com/terms).
