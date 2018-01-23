/**
 * stocobs-language-model-gen.ts
 * @author Sidharth Mishra
 * @description This module generates the JSON structure of the language model for STOCOBS.
 * @created Tue Jan 23 2018 11:27:10 GMT-0800 (PST)
 * @copyright 2017 Sidharth Mishra
 * @last-modified Tue Jan 23 2018 14:30:05 GMT-0800 (PST)
 */

// =========================================================================================
//                                  IMPORTS
// =========================================================================================

import { readFile, writeFile } from "fs";
import { resolve } from "path";
import { promisify } from "util";
import { type } from "os";

// =========================================================================================
//                                  MAIN DRIVER
// =========================================================================================
(function generateLanguageModel(modelJSONFileName: string) {
  const opFilePath: string = resolve(modelJSONFileName);
  const companyNamesFilePath: string = resolve("companyNames.txt");
  console.log(`Language model will be generated into ${opFilePath} from the names in ${companyNamesFilePath} file.`);
  promisify(readFile)(companyNamesFilePath)
    .then((data: Buffer) => {
      const companyNames = data.toString().split(/\n/);
      return companyNames;
    })
    .then((companyNames: Array<string>) => {
      companyNames = companyNames.map(name => name.trim());
      return companyNames;
    })
    .then((companyNames: Array<string>) => removeDuplicates(companyNames))
    .then((companyNames: Array<string>) => genSlotValues(companyNames))
    // .then((slotValues: Array<SlotValue>) => console.log(`slot values = ${JSON.stringify(slotValues, null, 2)}`))
    .then((slotValues: Array<SlotValue>) => genSlotTypes(slotValues))
    // .then((types: Array<SlotType>) => console.log(`slot types = ${JSON.stringify(types, null, 2)}`))
    .then((types: Array<SlotType>) => genIntents(types))
    .then((typesNIntents: { types: Array<SlotType>; intents: Array<Intent> }) =>
      genLanguageModel(typesNIntents.types, typesNIntents.intents, "stock aubs")
    )
    .then((languageModel: LanguageModel) => printLanguageModel(languageModel, opFilePath))
    .catch(error => {
      console.log(`Promised Error :: ${JSON.stringify(error)}`);
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
function removeDuplicates(companyNames: Array<string>): Array<string> {
  const duplicateCountMap: { [name: string]: number } = {};
  companyNames.forEach((name: string) => {
    if (!duplicateCountMap[name]) duplicateCountMap[name] = 1;
    else duplicateCountMap[name] += 1;
  });
  return Object.getOwnPropertyNames(duplicateCountMap).filter((name: string) => name.length <= 140);
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
function genSlotTypes(slotValues: Array<SlotValue>): Array<SlotType> {
  const slotTypes: Array<SlotType> = [];
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
function genIntents(types: Array<SlotType>): { types: Array<SlotType>; intents: Array<Intent> } {
  const intents = [];
  intents.push(new Intent("AMAZON.CancelIntent"));
  intents.push(new Intent("AMAZON.HelpIntent"));
  intents.push(new Intent("AMAZON.StopIntent"));
  intents.push(
    new Intent(
      "StockObserver",
      [
        "Alexa ask stock aubs how is {companyName} doing today",
        "Alexa ask stock aubs how is {companyName} doing",
        "Alexa ask stock aubs how was {companyName} doing today",
        "Alexa ask stock aubs how was {companyName} today",
        "Alexa ask stock aubs how {companyName} did today",
        "Alexa ask stock aubs how {companyName} was doing today",
        "Alexa ask stock aubs how {companyName} has done today",
        "Alexa how did {companyName} do today"
      ],
      [new Slot("companyName", "COMPANY_NAME")]
    )
  );
  return { types, intents };
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
function genLanguageModel(
  types: Array<SlotType>,
  intents: Array<Intent>,
  invocationName: string = "stock aubs"
): LanguageModel {
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
function printLanguageModel(languageModel: LanguageModel, opFilePath: string) {
  const stocObsModel: STOCOBSLanguageModel = new STOCOBSLanguageModel(languageModel);
  promisify(writeFile)(opFilePath, JSON.stringify(stocObsModel, null, 2))
    .then(err => {
      if (err) console.log(`Error while printing :: ${JSON.stringify(err)}`);
      else console.log(`Done!`);
    })
    .catch(error => {
      console.log(`Error :: ${JSON.stringify(error)}`);
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
function genSlotValues(companyNames: Array<string>): Array<SlotValue> {
  return companyNames.map(name => new SlotValue(new SlotName(name)));
}

// =========================================================================================
//                                      TYPES
// =========================================================================================

/**
 * The final language model to be printed.
 * @class STOCOBSLanguageModel
 */
class STOCOBSLanguageModel {
  languageModel: LanguageModel;

  constructor(languageModel: LanguageModel) {
    this.languageModel = languageModel;
  }
}

/**
 * The language model as per Alexa's Skill Set Editor.
 * @class LanguageModel
 */
class LanguageModel {
  types: Array<SlotType>;
  intents: Array<Intent>;
  invocationName: string;

  constructor(types: Array<SlotType>, intents: Array<Intent>, invocationName: string) {
    this.types = types;
    this.intents = intents;
    this.invocationName = invocationName;
  }
}

/**
 * The Slot type.
 * @class SlotType
 */
class SlotType {
  name: string;
  values: Array<SlotValue>;

  constructor(name: string, values: Array<SlotValue>) {
    this.name = name;
    this.values = values;
  }
}

/**
 * A value for a SlotType.
 * @class SlotValue
 */
class SlotValue {
  id?: string;
  name: SlotName;

  constructor(name: SlotName, id?: string) {
    this.name = name;
    this.id = id;
  }
}

/**
 * The name of a slot along with its synonyms.
 * @class SlotName
 */
class SlotName {
  value: string;
  synonyms: Array<string>;

  constructor(value: string, ...synonyms: Array<string>) {
    this.value = value;
    this.synonyms = [];
    if (synonyms) synonyms.forEach(s => this.synonyms.push(s));
  }
}

/**
 * The intent.
 * @class Intent
 */
class Intent {
  name: string;
  samples: Array<string>;
  slots?: Array<Slot>;

  constructor(name: string, samples?: Array<string>, slots?: Array<Slot>) {
    this.name = name;
    if (samples) this.samples = samples;
    else this.samples = [];
    this.slots = slots;
  }
}

/**
 * A slot in the intent.
 * @class Slot
 */
class Slot {
  name: string;
  type: string;

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }
}

// =========================================================================================
