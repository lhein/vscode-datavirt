/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IDataSourceConfig, IDVConfig, IEnv } from './model/DataVirtModel';
const YAML = require('yaml');

export function mapDSConfigToEnv(dsConfig: IDataSourceConfig, yaml: IDVConfig): void {
	if (!yaml.spec.env) {
		yaml.spec.env = [];
	}
	for (const [key, val] of dsConfig.entries) {
		const envEntry: IEnv = {
			name: key.toUpperCase(),
			value: val
		};
		let found: boolean = false;
		yaml.spec.env.forEach( (element: IEnv) => {
			if (element.name === generateFullDataSourceConfigEntryKey(dsConfig, envEntry.name)) {
				element.value = envEntry.value;
				found = true;
			}
		});
		if (!found) {
			envEntry.name = generateFullDataSourceConfigEntryKey(dsConfig, envEntry.name);
			yaml.spec.env.push(envEntry);
		}
	}
}

export function generateDataSourceConfigPrefix(dsConfig: IDataSourceConfig): string | undefined {
	if (dsConfig && dsConfig.type && dsConfig.name) {
		return `${dsConfig.type.toUpperCase()}_${dsConfig.name.toUpperCase()}`;
	}
	return undefined;
}

export function generateFullDataSourceConfigEntryKey(dsConfig: IDataSourceConfig, key: string): string | undefined {
	if (dsConfig && key) {
		return `${generateDataSourceConfigPrefix(dsConfig).toUpperCase()}_${key.toUpperCase()}`;
	}
	return undefined;
}

export function loadModelFromFile(file: string): IDVConfig {
	const f = fs.readFileSync(file, 'utf8');
	const yamlDoc:IDVConfig = YAML.parse(f);
	return yamlDoc;
}

export function saveModelToFile(dvConfig: IDVConfig, file: string): void {
	fs.writeFileSync(file, YAML.stringify(dvConfig));
}

export function replaceTemplateName(dsConfig: IDataSourceConfig, dsName: string, templateName: string): IDataSourceConfig | undefined {
	if (dsName && dsConfig && templateName) {
		const dsConfigNew : IDataSourceConfig = {
			name: dsName,
			type: dsConfig.type,
			entries: new Map<string, string>()
		};

		dsConfig.entries.forEach( (value: string, key: string) => {
			if (key.indexOf(templateName) !== -1) {
				dsConfigNew.entries.set(key.replace(templateName, dsName.toUpperCase()), value);
			} else {
				dsConfigNew.entries.set(key, value);
			}
		});

		return dsConfigNew;
	}
	return undefined;
}

export function replaceDDLNamePlaceholder(ddl: string, placeholder: string, replacement: string): string {
	if (ddl && placeholder && replacement) {
		return ddl.split(placeholder).join(replacement);
	}
	return undefined;
}

export function validateName(name: string): string {
	if (name && /^[a-zA-Z0-9]{4,253}$/.test(name)) {
		return undefined;
	} else {
		return 'The entered name does not comply with the naming conventions. ([a-zA-Z0-9] and length of 4-253 characters)';
	}
}

export function validateFileNotExisting(name: string): string {
	const fp: string = path.join(vscode.workspace.rootPath, `${name}.yaml`);
	if (fs.existsSync(fp)) {
		return 'There is already a file with the same name. Please choose a different name.';
	}
	return undefined;
}
