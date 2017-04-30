'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

class Browse {
    path: string[] = new Array<string>();
    limitSymbolsToIncludedHeaders: boolean;
    databaseFilename: string;
}

class Configuration {
    name : string;
    includePath: string[] = new Array<string>();
    defines: string[] = new Array<string>();
    browse: Browse = new Browse();
}

class PropertiesFile {
    configurations: Configuration[] = new Array<Configuration>();
}

class Settings {
    includes: string[] = new Array<string>();
    defines: string[] = new Array<string>();
}

function whereis(filename:string):string {
    var delim = path.delimiter;
    var currentPath = process.env.PATH;
    if (currentPath === undefined) {
        currentPath = process.env.Path;
    }
    var directories = currentPath.split(delim);
    for (var i = 0; i < directories.length; i++) {
        if (!(directories[i].indexOf("bin") > -1)) {
            continue;
        }
        var pth = path.join(directories[i], filename);
        if (fs.existsSync(pth)) {
            return directories[i];
        }
    }
    return undefined;
}

function getWPILibDirectory():string {
    return path.join(os.homedir(), "wpilib");
}

function getWPIlibSettings():Settings {
    let workspace = vscode.workspace.rootPath;
    if (workspace == undefined) {
        return undefined;
    }
    return new Settings();
}

function getCompilerFolder():string {
    var directory = whereis('arm-frc-linux-gnueabi-gcc.exe');
    directory = directory.substring(0, directory.lastIndexOf(path.sep));
    return directory;
}

function updateWpiConfigurationFile() {
    var settings = getWPIlibSettings();
    if (settings === undefined) {
        console.log("Not a workspace");
    }
    var workspaceRootString = "${workspaceRoot}";
    console.log(getWPILibDirectory());
    
    var compilerFolder = getCompilerFolder();
    console.log(compilerFolder);

    var props : PropertiesFile = new PropertiesFile();
    props.configurations.push(new Configuration());
    props.configurations[0].name = "Mac";
    props.configurations.push(new Configuration());
    props.configurations[1].name = "Linux";
    props.configurations.push(new Configuration());
    props.configurations[2].name = "Win32";

    for (let i = 0; i < props.configurations.length; i++) {
        let config = props.configurations[i];
        let includesArray = new Array<string>();
        includesArray.push(workspaceRootString);
        includesArray.push(compilerFolder);
        for (let j = 0; j < settings.includes.length; j++) {
            includesArray.push(settings.includes[j]);
        }
        config.includePath = includesArray;
        config.browse.path = includesArray;
        config.browse.databaseFilename = "";
        config.browse.limitSymbolsToIncludedHeaders = false;

    }

    let vsPath = path.join(vscode.workspace.rootPath, '.vscode');
    let filePath = path.join(vsPath, 'c_cpp_properties.json');

    let writeSettings = {
        flags: 'w',
        defaultEncoding: 'utf8',
        fd: null,
        mode: 0o666,
        autoClose: true
    }
    
    try {
        fs.mkdirSync(vsPath);
    } catch(e) {
        if (e.code !== 'EEXIST') throw e;
    }
    fs.writeFileSync(filePath, JSON.stringify(props));
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "wpilib-cpp" is now active!');

    updateWpiConfigurationFile();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.updateWpiIncludes', () => {
        // The code you place here will be executed every time your command is executed
        updateWpiConfigurationFile();

        // Display a message box to the user
        vscode.window.showInformationMessage('Successfully updated WPILib Include Files');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}