![Video Embed](assets/hero.png)

Simply paste a YouTube URL on an **empty line** in an Obsidian note and it's instantly converted into your preferred embed format — no commands, no shortcuts, just paste.

## Features

- intercepts YouTube URLs pasted on empty lines
- three embed styles to choose from
    - responsive in iframe and div modes
    - working on desktop and mobile

## Embed styles

Choose your preferred style in **Settings → Video Embed**.

![Video Embed Settings](assets/video-embed-settings.png)


| Style | Output | Responsive |
|---|---|---|
| markdown | `![]()` | no — fixed size |
| iframe | `<iframe ...>` | yes — fills pane width |
| div | `<div><iframe ...>` | yes — bulletproof |

#### Results in source mode:

![Video Embed Options](assets/video-embed-options.png)

## Usage

![get YouTube URL](assets/video-embed-get-video-url.png)

1. copy YouTube video URL
2. open any note
3. place your cursor on a blank line
4. paste the YouTube URL (`Cmd+V` / `Ctrl+V`)
5. the URL is automatically replaced with the embed

Supported URL formats:
- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://www.youtube.com/shorts/...`
- `https://www.youtube.com/embed/...`

---

### Installation

#### From Obsidian Community Plugins

1. open **Settings → Community plugins**
2. disable Safe mode if prompted
3. click **Browse** and search for `Video Embed`
4. install and enable
5. choose your preferred style (markdown, iframe, div)

#### Manual

1. download `video-embed.zip` from the [latest release](../../releases/latest)
2. unzip it into `<your vault>/.obsidian/plugins/`
3. reload Obsidian and enable the plugin in **Settings → Community plugins**

---

### Roadmap

- **v2** _when repo hits 100 GitHub ⭐_ — more video providers (Vimeo, Dailymotion, …)
- **v3** _when repo hits 1 000 GitHub ⭐_ — import video metadata (title, thumbnail) from URL

### Contributing

Found a bug or have a suggestion? [Open an issue](../../issues).

### License

[GPL-3.0](LICENSE)

---

<p align="center"><sub>made with ⏳ by punkyard</sub></p>
