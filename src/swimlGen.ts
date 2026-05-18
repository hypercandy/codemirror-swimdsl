import { create } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import {
  AuthorDefintion,
  ConstantDefinition,
  Instruction,
  InstructionModifier,
  InstructionModifiers,
  Intensity,
  Message,
  Programme,
  Statements,
  StrokeModifiers,
  SwimInstruction,
} from "./astTypes";

const XML_NAMESPACE = "https://github.com/bartneck/swiML";
const XSI_LINK = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION =
  "https://github.com/bartneck/swiML https://raw.githubusercontent.com/bartneck/swiML/main/version/latest/swiML.xsd";

/**
 * Format the given duration value for use within XML.
 *
 * @param minutes - A string containing a number from 0 to 59.
 * @param seconds - A string containing a number from 0 to 59.
 *
 * @returns A correctly formatted XML duration string.
 */
function xmlDuration(minutes: string, seconds: string): string {
  let durationString = "PT";
  if (Number(minutes) > 0) {
    durationString += minutes;
    durationString += "M";
  }
  if (Number(seconds) > 0) {
    durationString += seconds;
    durationString += "S";
  }
  return durationString;
}

/**
 * Write an AST Instruction node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction inside of.
 * @param instruction - The AST instruction node to write as XML.
 */
function writeInstruction(
  xmlParent: XMLBuilder,
  instruction: Instruction,
): void {
  switch (instruction.statement) {
    case Statements.SWIM_INSTRUCTION:
      writeSwimInstruction(xmlParent, instruction);
      break;

    case Statements.MESSAGE:
      writeMessage(xmlParent, instruction);
      break;
  }
}

/**
 * Write an AST Intensity node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the intensity inside of.
 * @param intensity - The AST intensity node to write as XML.
 */
function writeIntensity(xmlParent: XMLBuilder, intensity: Intensity): void {
  if (intensity.isAlias) {
    xmlParent.ele("zone").txt(intensity.value);
  } else {
    xmlParent.ele("percentageEffort").txt(intensity.value);
  }
}

/**
 * Write an AST InstructionModifier node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction modifier
 *    inside of.
 * @param modifier - The AST instruction modifier node to write as XML.
 */
function writeInstructionModifier(
  xmlParent: XMLBuilder,
  modifier: InstructionModifier,
): void {
  switch (modifier.modifier) {
    case InstructionModifiers.PACE: {
      const intensity = xmlParent.ele("intensity");

      writeIntensity(intensity.ele("startIntensity"), modifier.startIntensity);

      if (modifier.stopIntensity) {
        writeIntensity(intensity.ele("stopIntensity"), modifier.stopIntensity);
      }
      break;
    }
    case InstructionModifiers.EQUIPMENT_SPECIFICATION:
      for (const equipment of modifier.equipment) {
        xmlParent.ele("equipment").txt(equipment);
      }
      break;

    case InstructionModifiers.BREATHE:
      xmlParent.ele("breath").txt(modifier.breatheStrokes);
      break;

    case InstructionModifiers.REST:
      switch (modifier.type) {
        case "SinceStart":
          xmlParent
            .ele("rest")
            .ele("sinceStart")
            .txt(xmlDuration(modifier.minutes, modifier.seconds));
          break;
        case "AfterStop":
          xmlParent
            .ele("rest")
            .ele("afterStop")
            .txt(xmlDuration(modifier.minutes, modifier.seconds));
          break;
        case "InOut":
          xmlParent.ele("rest").ele("inOut").txt(modifier.swimmersIn);
          break;
      }
      break;

    case InstructionModifiers.EXCLUDE_ALIGN:
      xmlParent.ele("excludeAlign").txt("true");
      break;

    case InstructionModifiers.UNDERWATER:
      xmlParent.ele("underwater").txt(modifier.isTrue.toString());
      break;

    case InstructionModifiers.INSTRUCTION_DESCRIPTION:
      xmlParent.ele("instructionDescription").txt(modifier.description);
      break;
  }
}

/**
 * Write an AST SwimInstruction node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the instruction inside of.
 * @param instruction - The AST swim instruction node to write as XML.
 */
function writeSwimInstruction(
  xmlParent: XMLBuilder,
  instruction: SwimInstruction,
): void {
  let parent = xmlParent.ele("instruction");

  if (instruction.repetitions > 1) {
    parent = parent.ele("repetition");
    parent.ele("repetitionCount").txt(String(instruction.repetitions)).up();
  }

  if (instruction.instruction.isBlock) {
    for (const subInstruction of instruction.instruction.instructions) {
      writeInstruction(parent, subInstruction);
    }
  } else {
    const len = instruction.instruction.length;
    const length = parent.ele("length");
    if (len.kind === "distance") {
      length.ele("lengthAsDistance").txt(len.value);
    } else {
      length.ele("lengthAsLaps").txt(len.value);
    }

    if (instruction.strokeModifier === StrokeModifiers.KICK) {
      parent
        .ele("stroke")
        .ele("kicking")
        .ele("standardKick")
        .txt(instruction.instruction.stroke);
    } else {
      parent
        .ele("stroke")
        .ele("standardStroke")
        .txt(instruction.instruction.stroke);
    }
  }

  if (instruction.instructionModifiers.length > 0) {
    for (const modifier of instruction.instructionModifiers) {
      writeInstructionModifier(parent, modifier);
    }
  }
}

/**
 * Write an AST Message node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the message inside of.
 * @param instruction - The AST message node to write as XML.
 */
function writeMessage(xmlParent: XMLBuilder, instruction: Message): void {
  xmlParent.ele("instruction").ele("segmentName").txt(instruction.message);
}

/**
 * Write an AST ConstantDefinition node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the constant definition
 *    inside of.
 * @param definition - The AST constant definition node to write as XML.
 */
function writeConstantDefinition(
  xmlParent: XMLBuilder,
  definition: ConstantDefinition,
): void {
  switch (definition.constantName) {
    case "Title":
      xmlParent.ele("title").txt(definition.value);
      break;

    case "Description":
      xmlParent.ele("programDescription").txt(definition.value);
      break;

    case "Date":
      xmlParent.ele("creationDate").txt(definition.value);
      break;

    case "PoolLength":
      xmlParent.ele("poolLength").txt(definition.value);
      break;

    case "LengthUnit":
      xmlParent.ele("lengthUnit").txt(definition.value);
      break;

    case "Align":
      xmlParent.ele("programAlign").txt(definition.value.toLowerCase());
      break;

    case "NumeralSystem":
      xmlParent.ele("numeralSystem").txt(definition.value);
      break;

    case "HideIntro":
      xmlParent.ele("hideIntro").txt(definition.value.toLowerCase());
      break;

    case "LayoutWidth":
      xmlParent.ele("layoutWidth").txt(definition.value);
      break;
  }
}

/**
 * Write an AST AuthorDefintion node into the XML document.
 *
 * @param xmlParent - The parent XML node to write the author definition inside
 *    of.
 * @param definition - The AST author definition node to write as XML.
 */
function writeAuthorDefinition(
  xmlParent: XMLBuilder,
  definition: AuthorDefintion,
): void {
  const authorNode = xmlParent.ele("author");

  authorNode.ele("firstName").txt(definition.firstName);
  authorNode.ele("lastName").txt(definition.lastName);

  if (definition.emailAddress) {
    authorNode.ele("email").txt(definition.emailAddress);
  }
}

/**
 * Given a complete AST for a SwimDSL document, generate a valid swiML XML
 * document describing the same programme.
 *
 * @param programme - The AST of a SwimDSL programme.
 *
 * @returns A correctly formed swiML XML document exactly describing the
 *    content in `programme`.
 */
export default function emitXml(programme: Programme): string {
  const doc = create({ version: "1.0", encoding: "UTF-8" }).ele("program", {
    xmlns: XML_NAMESPACE,
    "xmlns:xsi": XSI_LINK,
    "xsi:schemaLocation": SCHEMA_LOCATION,
  });

  for (const statement of programme.statements) {
    switch (statement.statement) {
      case Statements.SWIM_INSTRUCTION:
        writeSwimInstruction(doc, statement);
        break;

      case Statements.MESSAGE:
        writeMessage(doc, statement);
        break;

      case Statements.PACE_DEFINITION:
        break;

      case Statements.CONSTANT_DEFINITION:
        writeConstantDefinition(doc, statement);
        break;

      case Statements.AUTHOR_DEFINITION:
        writeAuthorDefinition(doc, statement);
        break;
    }
  }

  return doc.end({ prettyPrint: true });
}
