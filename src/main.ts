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

				const pastedText = evt.clipboardData?.getData('text/plain') ?? '';
				const videoId = this.extractYoutubeId(pastedText);
				const isShort = pastedText.includes('/shorts/');
				const shortsWidth = this.settings.shortsWidth || '100%';

				if (videoId) {
					evt.preventDefault();

					let embedCode = '';

					switch (this.settings.embedStyle) {
						case 'md':
							embedCode = `![](${pastedText})`;
							break;
						case 'iframe':
							if (isShort) {
								embedCode = `<iframe style="aspect-ratio: 9/16; width: ${shortsWidth};" src="https://www.youtube.com/embed/${videoId}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
							} else {
								embedCode = `<iframe width="100%" style="aspect-ratio: 16/9;" src="https://www.youtube.com/embed/${videoId}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
							}
							break;
						case 'div':
							if (isShort) {
								embedCode = `<div style="position: relative; width: ${shortsWidth}; aspect-ratio: 9/16; overflow: hidden;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${videoId}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
							} else {
								embedCode = `<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" src="https://www.youtube.com/embed/${videoId}" title="Video Embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
							}
							break;
					}

					editor.replaceRange(embedCode, { line: line, ch: 0 }, { line: line, ch: lineText.length });
					editor.setCursor({ line: line, ch: embedCode.length });
				}
			})
		);
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

		containerEl.createEl('h2', { text: 'Video Embed Settings' });

		const embedDesc = document.createDocumentFragment();
		embedDesc.append(
			'Choose how YouTube links are automatically formatted when pasted on an empty line.',
			embedDesc.createEl('br'),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '1. markdown: ![]() — cleanest code but fixed size, unresponsive.' }),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '2. iframe: simple HTML — fills pane width, no black bars.' }),
			embedDesc.createEl('br'),
			embedDesc.createEl('span', { text: '3. div: bulletproof wrapper — should work in 100% of cases.' }),
		);

		new Setting(containerEl)
			.setName('Embed Style')
			.setDesc(embedDesc)
			.addDropdown(dropdown => dropdown
				.addOption('md', '1. standard markdown')
				.addOption('iframe', '2. iframe (responsive)')
				.addOption('div', '3. div (responsive)')
				.setValue(this.plugin.settings.embedStyle)
				.onChange(async (value: string) => {
					this.plugin.settings.embedStyle = value as VideoEmbedSettings['embedStyle'];
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Shorts width')
			.setDesc('Width of the embed for YouTube Shorts (portrait videos). Use % for relative (e.g. 50%) or px for fixed (e.g. 360px). Default: 100%.')
			.addText(text => text
				.setPlaceholder('100%')
				.setValue(this.plugin.settings.shortsWidth)
				.onChange(async (value: string) => {
					this.plugin.settings.shortsWidth = value.trim() || '100%';
					await this.plugin.saveSettings();
				}));
	}
}