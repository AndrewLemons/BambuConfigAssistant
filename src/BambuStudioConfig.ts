import path from "node:path";
import * as fse from "fs-extra";
import { SettingsFile, SettingsType } from "./Settings";

const SETTINGS_SCOPES = ["system", "user"];

export default class BambuStudioConfig {
	dir: string;

	private definedSettings: SettingsFile[];

	constructor(dir: string) {
		this.dir = dir;
		this.definedSettings = [];
		this.index();
	}

	index(): void {
		this.definedSettings = [];

		for (let scope of SETTINGS_SCOPES) {
			let scopeDir = path.join(this.dir, scope);
			if (!fse.existsSync(scopeDir)) continue;
			this.definedSettings.push(
				...BambuStudioConfig.findSettingsFiles(scopeDir),
			);
		}
	}

	getSettingsFiles(type: SettingsType): SettingsFile[] {
		return this.definedSettings.filter((s) => s.type === type);
	}

	findSettingsFile(type: SettingsType, name: String): SettingsFile | undefined {
		return this.definedSettings.filter(
			(s) => s.name === name && s.type === type,
		)[0];
	}

	getMachines(): SettingsFile[] {
		return this.getSettingsFiles(SettingsType.Machine);
	}

	findMachine(name: string): SettingsFile | undefined {
		return this.findSettingsFile(SettingsType.Machine, name);
	}

	getProcesses(): SettingsFile[] {
		return this.getSettingsFiles(SettingsType.Process);
	}

	findProcess(name: string): SettingsFile | undefined {
		return this.findSettingsFile(SettingsType.Process, name);
	}

	getFilaments(): SettingsFile[] {
		return this.getSettingsFiles(SettingsType.Filament);
	}

	findFilament(name: string): SettingsFile | undefined {
		return this.findSettingsFile(SettingsType.Filament, name);
	}

	readFullSettings(settingsFile: SettingsFile): any {
		let settings = fse.readJSONSync(settingsFile.path);
		let type = settingsFile.type;

		// Handle inheritance
		let inherits = settings.inherits;
		let inheritedSettings = {};
		if (inherits) {
			let inheritsFile = this.findSettingsFile(type, inherits);
			if (!inheritsFile)
				throw new Error(`Could not find settings file "${inherits}"`);
			inheritedSettings = this.readFullSettings(inheritsFile);
		}
		settings = {
			...inheritedSettings,
			...settings,
			inherits: undefined,
		};

		return settings;
	}

	saveUserSettings(settings: any, user: string, outputPath: string = ""): void {
		let settingsDir = path.resolve(
			this.dir,
			outputPath,
			"user",
			user,
			settings.type,
		);
		let settingsFilePath = path.resolve(settingsDir, settings.name + ".json");
		let settingsInfoPath = path.resolve(settingsDir, settings.name + ".info");

		// Ensure the directory exists
		fse.ensureDirSync(settingsDir);

		// Write the files
		fse.writeJSONSync(settingsFilePath, settings, { spaces: 4 });
		fse.writeFileSync(settingsInfoPath, BambuStudioConfig.createInfoContent());

		// Re-index
		this.index();
	}

	private static findSettingsFiles(targetDir: string) {
		let settings: SettingsFile[] = [];

		let items = fse.readdirSync(targetDir);
		for (let item of items) {
			let itemPath = path.join(targetDir, item);
			// If we found a json file
			if (itemPath.endsWith(".json")) {
				settings.push(SettingsFile.fromFile(itemPath));
			}
			// If we found a directory
			if (fse.statSync(itemPath).isDirectory()) {
				settings.push(...BambuStudioConfig.findSettingsFiles(itemPath));
			}
		}

		return settings;
	}

	private static createInfoContent() {
		let timestamp = (new Date().getTime() / 1000).toFixed(0);
		return `sync_info = \nuser_id = \nsetting_id = \nbase_id = \nupdated_time = ${timestamp}\n`;
	}
}

module.exports = BambuStudioConfig;
