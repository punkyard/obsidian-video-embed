import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';

interface VideoEmbedSettings {
	embedStyle: 'md' | 'iframe' | 'div';
	shortsWidth: string;
}

const DEFAULT_SETTINGS: VideoEmbedSettings = {
	embedStyle: 'md',
	shortsWidth: '100%',
};

export default class VideoEmbed extends Plugin {
	settings: VideoEmbedSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new VideoEmbedSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('editor-paste', (evt: ClipboardEvent) => {
				const editor = this.app.workspace.activeEditor?.editor;
				if (!editor) return;

				const line = editor.getCursor().line;
				const lineText = editor.getLine(line).trim();
				if (lineText !== '') return;

				const pastedTextRaw = evt.clipboardData?.getData('text/plain') ?? '';
				if (!this.isOnlyYoutubeUrlPaste(pastedTextRaw)) return;

				const pastedText = pastedTextRaw.trim();
				const videoId = this.extractYoutubeId(pastedText);
				const startTime = this.extractYoutubeStartTime(pastedText);
				const isShort = pastedText.includes('/shorts/');
				const shortsWidth = this.settings.shortsWidth || '100%';
				const embedSrc = this.buildYoutubeEmbedSrc(videoId, startTime);

				if (videoId) {
					evt.preventDefault();

					let embedCode = '';

					switch (this.settings.embedStyle) {
						case 'md':
							embedCode = `![](${this.buildYoutubeWatchUrl(videoId, startTime)})`;
							break;
						case 'iframe':
							if (isShort) {
									embedCode = `<iframe style="aspect-ratio: 9/16; width: ${shortsWidth};" src="${embedSrc}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
							} else {
									embedCode = `<iframe width="100%" style="aspect-ratio: 16/9;" src="${embedSrc}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
							}
							break;
						case 'div':
							if (isShort) {
									embedCode = `<div style="position: relative; width: ${shortsWidth}; aspect-ratio: 9/16; overflow: hidden;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="${embedSrc}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
							} else {
									embedCode = `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="${embedSrc}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
							}
							break;
					}

					editor.replaceRange(embedCode, { line: line, ch: 0 }, { line: line, ch: lineText.length });
					editor.setCursor({ line: line, ch: embedCode.length });
				}
			})
		);
	}

	isOnlyYoutubeUrlPaste(text: string): boolean {
		const trimmed = text.trim();
		if (trimmed === '') return false;
		if (/\s/.test(trimmed)) return false;

		const isYoutubeHost = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
		if (!isYoutubeHost) return false;

		return this.extractYoutubeId(trimmed) !== null;
	}

	buildYoutubeEmbedSrc(videoId: string | null, startTime: number | null): string {
		const baseUrl = `https://www.youtube.com/embed/${videoId ?? ''}`;
		if (!videoId || startTime === null || startTime < 0) return baseUrl;

		return `${baseUrl}?start=${startTime}`;
	}

	buildYoutubeWatchUrl(videoId: string | null, startTime: number | null): string {
		if (!videoId) return '';

		let url = `https://www.youtube.com/watch?v=${videoId}`;
		if (startTime !== null && startTime >= 0) {
			url += `&t=${startTime}`;
		}

		return url;
	}

	extractYoutubeStartTime(url: string): number | null {
		const timeMatch = url.match(/[?&#](?:t|start)=([^&#]+)/i);
		if (!timeMatch?.[1]) return null;

		return this.parseYouTubeTimeToSeconds(timeMatch[1]);
	}

	parseYouTubeTimeToSeconds(value: string): number | null {
		const normalized = value.trim().toLowerCase();
		if (normalized === '') return null;

		if (/^\d+$/.test(normalized)) {
			return Number.parseInt(normalized, 10);
		}

		const match = normalized.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
		if (!match) return null;

		const hours = Number.parseInt(match[1] ?? '0', 10);
		const minutes = Number.parseInt(match[2] ?? '0', 10);
		const seconds = Number.parseInt(match[3] ?? '0', 10);
		const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

		return totalSeconds > 0 ? totalSeconds : null;
	}

	normalizeShortsWidth(value: string): string {
		const normalized = value.trim().replace(/\s+/g, '');
		if (normalized === '') {
			return '100%';
		}
		if (/^\d+$/.test(normalized)) {
			return `${normalized}px`;
		}
		if (/^\d+(?:\.\d+)?%$/.test(normalized) || /^\d+(?:\.\d+)?px$/.test(normalized)) {
			return normalized;
		}
		return normalized;
	}

	extractYoutubeId(url: string): string | null {
		const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
		const match = url.match(regex);
		return match ? (match[1] ?? null) : null;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class VideoEmbedSettingTab extends PluginSettingTab {
	plugin: VideoEmbed;

	constructor(app: App, plugin: VideoEmbed) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		const embedDesc = document.createDocumentFragment();
		embedDesc.append(
			'Choose how YouTube links are automatically formatted when pasted on an empty line.',
			embedDesc.createEl('br'),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '1. Markdown: ![]() — cleanest code, but fixed size and not responsive.' }),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '2. Iframe: simple HTML — fills pane width with no black bars.' }),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '3. Div: resilient wrapper — works in most cases.' }),
		);

		new Setting(containerEl)
			.setName('Embed style')
			.setDesc(embedDesc)
			.addDropdown(dropdown => dropdown
				.addOption('md', 'Markdown')
				.addOption('iframe', 'Iframe (responsive)')
				.addOption('div', 'Div (responsive)')
				.setValue(this.plugin.settings.embedStyle)
				.onChange(async (value: string) => {
					this.plugin.settings.embedStyle = value as VideoEmbedSettings['embedStyle'];
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('YouTube shorts width')
			.setDesc('Width of the embed for YouTube shorts (portrait videos). Enter a number for pixels (for example, 360) or a percentage for ratio (for example, 100%).')
			.addText(text => text
				.setPlaceholder('100%')
				.setValue(this.plugin.settings.shortsWidth)
				.onChange(async (value: string) => {
					this.plugin.settings.shortsWidth = this.plugin.normalizeShortsWidth(value);
					await this.plugin.saveSettings();
				}));
	}
}