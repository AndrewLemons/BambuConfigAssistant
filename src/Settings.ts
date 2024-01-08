import * as fse from "fs-extra";

export class SettingsFile {
	name: string;
	type: SettingsType;
	path: string;

	constructor(name: string, type: SettingsType, path: string) {
		this.name = name;
		this.type = type;
		this.path = path;
	}

	readSettings() {
		return fse.readJSONSync(this.path);
	}

	static fromFile(filePath: string) {
		let data = fse.readJSONSync(filePath);
		return new SettingsFile(data.name, data.type, filePath);
	}
}

export enum SettingsType {
	Machine = "machine",
	Process = "process",
	Filament = "filament",
}

export class Settings {
	static adaptToUserSettings(settings: any): any {
		return {
			...settings,
			// Add these fields
			from: "User",
			is_custom_defined: "0",
			version: "1.0.0.0",
			// Remove these fields
			upward_compatible_machine: undefined,
			setting_id: undefined,
			compatible_printers: undefined,
			instantiation: undefined,
			inherits: undefined,
		};
	}
}
