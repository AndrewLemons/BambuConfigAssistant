import path from "node:path";
import crypto from "node:crypto";
import * as fse from "fs-extra";
import BambuStudioConfig from "./BambuStudioConfig";
import { Settings } from "./Settings";

const runProcess = () => {
	const config = fse.readJSONSync(path.resolve(process.cwd(), "config.json"));
	const bambuDir = path.resolve(process.cwd(), config.bambuConfigDir);
	const outputDir = path.resolve(
		process.cwd(),
		config.outputDir ?? config.bambuConfigDir,
	);

	const bambu = new BambuStudioConfig(
		path.resolve(process.cwd(), config.bambuConfigDir),
	);

	console.log("Running process");
	console.log(`Using BambuStudio configuration at ${JSON.stringify(bambuDir)}`);
	console.log(`Using output directory at ${JSON.stringify(outputDir)}`);

	if (config.cleanOutputDir) {
		console.log("Cleaning output directory");
		fse.emptyDirSync(outputDir);
	}

	for (let clone of config.clone) {
		console.log(`Cloning ${clone.type} from "${clone.from}" to "${clone.to}"`);

		// Find settings file
		let settingsFile = bambu.findSettingsFile(clone.type, clone.from);

		// Ensure the settings file exists
		if (!settingsFile) {
			console.error(`Settings for ${clone.type} "${clone.from}" not found`);
			continue;
		}

		// Clone settings
		let settings = bambu.readFullSettings(settingsFile);
		settings = Settings.adaptToUserSettings({
			...settings,
			name: clone.to,
			...clone.overwrite,
		});

		// Create settings ID
		let settingsId = crypto
			.createHash("sha256")
			.update(settings.name)
			.digest("hex");

		// Save settings
		bambu.saveUserSettings(
			settings,
			clone.user ?? "default",
			settingsId,
			outputDir,
		);
	}
};

runProcess();
