"use strict";
/**
 * stocobs-language-model-gen.ts
 * @author Sidharth Mishra
 * @description This module generates the JSON structure of the language model for STOCOBS.
 * @created Tue Jan 23 2018 11:27:10 GMT-0800 (PST)
 * @copyright 2017 Sidharth Mishra
 * @last-modified Tue Jan 23 2018 14:30:05 GMT-0800 (PST)
 */
Object.defineProperty(exports, "__esModule", { value: true });
// =========================================================================================
//                                  IMPORTS
// =========================================================================================
var fs_1 = require("fs");
var path_1 = require("path");
var util_1 = require("util");
// =========================================================================================
//                                  MAIN DRIVER
// =========================================================================================
(function generateLanguageModel(modelJSONFileName) {
    var opFilePath = path_1.resolve(modelJSONFileName);
    var companyNamesFilePath = path_1.resolve("companyNames.txt");
    console.log("Language model will be generated into " + opFilePath + " from the names in " + companyNamesFilePath + " file.");
    util_1.promisify(fs_1.readFile)(companyNamesFilePath)
        .then(function (data) {
        var companyNames = data.toString().split(/\n/);
        return companyNames;
    })
        .then(function (companyNames) {
        companyNames = companyNames.map(function (name) { return name.trim(); });
        return companyNames;
    })
        .then(function (companyNames) { return removeDuplicates(companyNames); })
        .then(function (companyNames) { return genSlotValues(companyNames); })
        .then(function (slotValues) { return genSlotTypes(slotValues); })
        .then(function (types) { return genIntents(types); })
        .then(function (typesNIntents) {
        return genLanguageModel(typesNIntents.types, typesNIntents.intents, "stock aubs");
    })
        .then(function (languageModel) { return printLanguageModel(languageModel, opFilePath); })
        .catch(function (error) {
        console.log("Promised Error :: " + JSON.stringify(error));
    });
})("stocobs-language-model-test.json");
// =========================================================================================
//                                      UTILITIES AND HELPERS
// =========================================================================================
/**
 * Removes the duplicate company names and names that exceed 140 chars -- Alexa's limit.
 *
 * @param {Array<string>} companyNames
 * The company names from the file.
 *
 * @returns {Array<string>}
 * The unique list of company names.
 */
function removeDuplicates(companyNames) {
    var duplicateCountMap = {};
    companyNames.forEach(function (name) {
        if (!duplicateCountMap[name])
            duplicateCountMap[name] = 1;
        else
            duplicateCountMap[name] += 1;
    });
    return Object.getOwnPropertyNames(duplicateCountMap).filter(function (name) { return name.length <= 140; });
}
/**
 * Generates the slot types from the given slot values for STOCOBS.
 *
 * @param {Array<SlotValue>} slotValues
 * The list of slot values.
 *
 * @returns {Array<SlotType>}
 * The generated list of slot types.
 */
function genSlotTypes(slotValues) {
    var slotTypes = [];
    slotTypes.push(new SlotType("COMPANY_NAME", slotValues));
    return slotTypes;
}
/**
 * Generates the list of intents for the STOCOBS langage model.
 *
 * @param {Array<SlotType>} types
 * The slot types.
 *
 * @returns {{types: Array<SlotType>, intents: Array<Intent>}}
 * The makeshift object for chaining promises.
 */
function genIntents(types) {
    var intents = [];
    intents.push(new Intent("AMAZON.CancelIntent"));
    intents.push(new Intent("AMAZON.HelpIntent"));
    intents.push(new Intent("AMAZON.StopIntent"));
    intents.push(new Intent("StockObserver", [
        "Alexa ask stock aubs how is {companyName} doing today",
        "Alexa ask stock aubs how is {companyName} doing",
        "Alexa ask stock aubs how was {companyName} doing today",
        "Alexa ask stock aubs how was {companyName} today",
        "Alexa ask stock aubs how {companyName} did today",
        "Alexa ask stock aubs how {companyName} was doing today",
        "Alexa ask stock aubs how {companyName} has done today",
        "Alexa how did {companyName} do today"
    ], [new Slot("companyName", "COMPANY_NAME")]));
    return { types: types, intents: intents };
}
/**
 * Generates the language model from slot types, intents, and the invocation name.
 *
 * @param {Array<SlotType>} types
 * The slot types.
 *
 * @param {Array<Intent>} intents
 * The intents.
 *
 * @param {string} [invocationName="stock aubs"] The invocation name of the skill.
 */
function genLanguageModel(types, intents, invocationName) {
    if (invocationName === void 0) { invocationName = "stock aubs"; }
    return new LanguageModel(types, intents, invocationName);
}
/**
 * Prints the language model to the output file.
 *
 * @param {LanguageModel} languageModel
 * The language model for STOCOBS.
 *
 * @param {string} opFilePath
 * The output file path.
 */
function printLanguageModel(languageModel, opFilePath) {
    var stocObsModel = new STOCOBSLanguageModel(languageModel);
    util_1.promisify(fs_1.writeFile)(opFilePath, JSON.stringify(stocObsModel, null, 2))
        .then(function (err) {
        if (err)
            console.log("Error while printing :: " + JSON.stringify(err));
        else
            console.log("Done!");
    })
        .catch(function (error) {
        console.log("Error :: " + JSON.stringify(error));
    });
}
/**
 * Generates the Slot values from the list of company names.
 *
 * @param {Array<string>} companyNames
 * The list of company names
 *
 * @returns {Array<SlotValue>}
 * The list of slot values.
 */
function genSlotValues(companyNames) {
    return companyNames.map(function (name) { return new SlotValue(new SlotName(name)); });
}
// =========================================================================================
//                                      TYPES
// =========================================================================================
/**
 * The final language model to be printed.
 * @class STOCOBSLanguageModel
 */
var STOCOBSLanguageModel = /** @class */ (function () {
    function STOCOBSLanguageModel(languageModel) {
        this.languageModel = languageModel;
    }
    return STOCOBSLanguageModel;
}());
/**
 * The language model as per Alexa's Skill Set Editor.
 * @class LanguageModel
 */
var LanguageModel = /** @class */ (function () {
    function LanguageModel(types, intents, invocationName) {
        this.types = types;
        this.intents = intents;
        this.invocationName = invocationName;
    }
    return LanguageModel;
}());
/**
 * The Slot type.
 * @class SlotType
 */
var SlotType = /** @class */ (function () {
    function SlotType(name, values) {
        this.name = name;
        this.values = values;
    }
    return SlotType;
}());
/**
 * A value for a SlotType.
 * @class SlotValue
 */
var SlotValue = /** @class */ (function () {
    function SlotValue(name, id) {
        this.name = name;
        this.id = id;
    }
    return SlotValue;
}());
/**
 * The name of a slot along with its synonyms.
 * @class SlotName
 */
var SlotName = /** @class */ (function () {
    function SlotName(value) {
        var synonyms = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            synonyms[_i - 1] = arguments[_i];
        }
        var _this = this;
        this.value = value;
        this.synonyms = [];
        if (synonyms)
            synonyms.forEach(function (s) { return _this.synonyms.push(s); });
    }
    return SlotName;
}());
/**
 * The intent.
 * @class Intent
 */
var Intent = /** @class */ (function () {
    function Intent(name, samples, slots) {
        this.name = name;
        if (samples)
            this.samples = samples;
        else
            this.samples = [];
        this.slots = slots;
    }
    return Intent;
}());
/**
 * A slot in the intent.
 * @class Slot
 */
var Slot = /** @class */ (function () {
    function Slot(name, type) {
        this.name = name;
        this.type = type;
    }
    return Slot;
}());
// =========================================================================================
