import { EditorState } from "@codemirror/state";
import { TreeCursor } from "@lezer/common";
import {
  AuthorDefintion,
  BlockInstruction,
  Breathe,
  ConstantDefinition,
  Instruction,
  InstructionDescription,
  InstructionModifier,
  InstructionModifiers,
  Intensity,
  Length,
  Message,
  Pace,
  PaceDefinition,
  Programme,
  Rest,
  SingleInstruction,
  Statement,
  Statements,
  StrokeModifiers,
  SwimInstruction,
} from "./astTypes";

/**
 * Create an AST node for a `Pace` CST node.
 *
 * Precondition: `cursor` points to a `Pace`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Pace` AST node.
 */
function visitPace(cursor: TreeCursor, state: EditorState): Pace {
  // Move down into starting intensity
  cursor.firstChild();

  const startIntensity: Intensity = {
    isAlias: cursor.name === "PaceAlias",
    value: state.sliceDoc(cursor.from, cursor.to),
  };

  let stopIntensity: Intensity | undefined = undefined;

  // Move to finishing Intensity if it exists
  if (cursor.nextSibling()) {
    stopIntensity = {
      isAlias: cursor.name === "PaceAlias",
      value: state.sliceDoc(cursor.from, cursor.to),
    };
  }

  // Move back up to Pace
  cursor.parent();

  return {
    modifier: InstructionModifiers.PACE,
    startIntensity,
    stopIntensity,
  };
}

/**
 * Create an AST node for a `PaceDefinition` CST node.
 *
 * Precondition: `cursor` points to a `PaceAlias`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitPaceDefinition(
  cursor: TreeCursor,
  state: EditorState,
): PaceDefinition {
  // Move into PaceDefinitionName
  cursor.firstChild();
  const name = state.sliceDoc(cursor.from, cursor.to);

  // Move into Pace
  cursor.nextSibling();
  const pace = visitPace(cursor, state);

  // Move back up to the PaceDefinition
  cursor.parent();

  return { statement: Statements.PACE_DEFINITION, name, pace };
}

/**
 * Creates an AST node for `Breathe` CST node
 *
 * Precondition: `cursor` points to a `Breathe`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Breathe` AST node
 */
function visitBreathe(cursor: TreeCursor, state: EditorState): Breathe {
  // Move into the breatheStrokes value
  cursor.firstChild();
  const breatheStrokes = state.sliceDoc(cursor.from, cursor.to);

  // Step back up to the Breathe
  cursor.parent();
  return {
    modifier: InstructionModifiers.BREATHE,
    breatheStrokes: breatheStrokes,
  };
}

/**
 * Create an AST node for an `instruction` CST node.
 *
 * Precondition: `cursor` points to any of `SwimInstruction`,
 * `RestInstruction`, or `Message`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `Instruction` AST node.
 */
function visitInstruction(cursor: TreeCursor, state: EditorState): Instruction {
  if (cursor.name === "SwimInstruction") {
    return visitSwimInstruction(cursor, state);
  }

  return visitMessage(cursor, state);
}

/**
 * Create an AST node for a `Duration` CST node.
 *
 * Precondition: `cursor` points to a `Duration` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `PaceDefinition` AST node.
 */
function visitDuration(
  cursor: TreeCursor,
  state: EditorState,
): { minutes: string; seconds: string } {
  // Move down to minutes Number
  cursor.firstChild();
  const minutes = state.sliceDoc(cursor.from, cursor.to);

  // Move to seconds Number
  cursor.nextSibling();
  const seconds = state.sliceDoc(cursor.from, cursor.to);

  // Move back up to Duration
  cursor.parent();

  return { minutes, seconds };
}

/**
 * Convert the swimDSL equipment name to the swiML equipment name.
 *
 * @param equipmentName - The swimDSL name of an eqipment item.
 *
 * @returns The swiML name of the same item.
 */
function getEquipment(equipmentName: string | undefined): string {
  switch (equipmentName) {
    case "Board":
      return "board";

    case "Pads":
      return "pads";

    case "PullBuoy":
      return "pullBuoy";

    case "Fins":
      return "fins";

    case "Snorkel":
      return "snorkel";

    case "Chute":
      return "chute";

    case "StretchCord":
      return "stretchCord";

    default:
      return "";
  }
}

/**
 * Create an AST node for an `instructionModifier` CST node.
 *
 * Precondition: `cursor` points to one of `EquipmentSpecification`, `Pace`,
 * `Duration`, `Breathe`, `Underwater`, or `InstructionDescription`.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `InstructionModifier` AST node.
 */
function visitInstructionModifier(
  cursor: TreeCursor,
  state: EditorState,
): InstructionModifier {
  if (cursor.name === "EquipmentSpecification") {
    const equipment: string[] = [];

    // Move down into first EquipmentName
    cursor.firstChild();

    do {
      const equipmentName = state.sliceDoc(cursor.from, cursor.to);
      equipment.push(getEquipment(equipmentName));
    } while (cursor.nextSibling());

    // Step back up to the EquipmentSpecification
    cursor.parent();

    return {
      modifier: InstructionModifiers.EQUIPMENT_SPECIFICATION,
      equipment,
    };
  }

  if (cursor.name === "Pace") {
    return visitPace(cursor, state);
  }

  if (cursor.name === "ExcludeAlignSpecification") {
    return { modifier: InstructionModifiers.EXCLUDE_ALIGN };
  }

  if (cursor.name === "Breathe") {
    return visitBreathe(cursor, state);
  }

  if (cursor.name === "InstructionDescription") {
    return visitInstructionDescription(cursor, state);
  }

  if (cursor.name === "Underwater") {
    return {
      modifier: InstructionModifiers.UNDERWATER,
      isTrue: true,
    };
  }

  // We are in Rest
  return visitRest(cursor, state);
}

/**
 * Create an AST node for a `Rest` CST node.
 *
 * Precondition: `cursor` points to a `Rest` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Rest` AST node.
 */
function visitRest(cursor: TreeCursor, state: EditorState): Rest {
  cursor.firstChild(); // Step into the RestType
  let rest: Rest;

  if (cursor.name === "RestInOut") {
    cursor.firstChild(); // Step into Number
    const swimmersIn = state.sliceDoc(cursor.from, cursor.to);
    cursor.parent(); // Back to RestInOut

    rest = {
      modifier: InstructionModifiers.REST,
      type: "InOut",
      swimmersIn: swimmersIn,
    };
  } else {
    const type = cursor.name === "RestAfterStop" ? "AfterStop" : "SinceStart";

    cursor.firstChild();
    const duration = visitDuration(cursor, state);
    cursor.parent();

    rest = {
      modifier: InstructionModifiers.REST,
      type,
      ...duration,
    };
  }
  cursor.parent(); // Back to Rest

  return rest;
}

/**
 * Convert the swimDSL stroke name to the swiML stroke name.
 *
 * @param strokeName - The swimDSL name of stroke.
 *
 * @returns The swiML name of the same stroke.
 */
function getStroke(strokeName: string): string {
  switch (strokeName) {
    case "Freestyle":
    case "Free":
    case "Fr":
      return "freestyle";

    case "Backstroke":
    case "Back":
    case "Bk":
      return "backstroke";

    case "Breaststroke":
    case "Breast":
    case "Br":
      return "breaststroke";

    case "Butterfly":
    case "Fly":
    case "Fl":
      return "butterfly";

    case "IndividualMedley":
    case "Medley":
    case "Im":
      return "individualMedley";

    case "ReverseIndividualMedley":
    case "ReverseMedley":
    case "ReverseIm":
      return "reverseIndividualMedley";

    case "IndividualMedleyOverlap":
    case "MedleyOverlap":
    case "ImOverlap":
      return "individualMedleyOverlap";

    case "IndividualMedleyOrder":
    case "MedleyOrder":
    case "ImOrder":
      return "individualMedleyOrder";

    case "ReverseIndividualMedleyOrder":
    case "ReverseMedleyOrder":
    case "ReverseImOrder":
      return "reverseIndividualMedleyOrder";

    case "NumberOne":
      return "nr1";

    case "NumberTwo":
      return "nr2";

    case "NumberThree":
      return "nr3";

    case "NumberFour":
      return "nr4";

    case "NotFreestyle":
    case "NotFree":
    case "NotFr":
      return "notFreestyle";

    case "NotBackstroke":
    case "NotBack":
    case "NotBk":
      return "notBackstroke";

    case "NotBreastroke":
    case "NotBreast":
    case "NotBr":
      return "notBreastroke";

    case "NotButterfly":
    case "NotFly":
    case "NotFl":
      return "notButterfly";

    case "Choice":
    default:
      return "any";
  }
}

function getStrokeModifier(strokeModifierName: string): StrokeModifiers {
  switch (strokeModifierName) {
    case "Kick":
      return StrokeModifiers.KICK;
    case "Pull":
      return StrokeModifiers.PULL;
    case "Drill":
      return StrokeModifiers.DRILL;
    default:
      return StrokeModifiers.STANDARD;
  }
}

/**
 * Create an AST node for a `SwimInstruction` CST node.
 *
 * Precondition: `cursor` points to a `SwimInstruction` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `SwimInstruction` AST node.
 */
function visitSwimInstruction(
  cursor: TreeCursor,
  state: EditorState,
): SwimInstruction {
  let repetitions = 1;
  let strokeModifier: StrokeModifiers = StrokeModifiers.STANDARD;
  let instruction: SingleInstruction | BlockInstruction;
  const instructionModifiers: InstructionModifier[] = [];

  // Move into either Number (for repetitions) or SingleInstruction |
  // BlockInstruction
  cursor.firstChild();

  if (cursor.name === "Number") {
    repetitions = Number(state.sliceDoc(cursor.from, cursor.to));

    // Move into SingleInstruction | BlockInstruction
    cursor.nextSibling();
  }

  if (cursor.name === "BlockInstruction") {
    // Move into first Instruction of the block
    cursor.firstChild();

    const instructions: Instruction[] = [];
    do {
      instructions.push(visitInstruction(cursor, state));
    } while (cursor.nextSibling());

    instruction = { isBlock: true, instructions };
    // cursor is still on the last instruction of the block
  } else {
    // cursor is on SingleInstruction
    cursor.firstChild();
    cursor.firstChild();

    let kind: Length["kind"];

    switch (cursor.name) {
      case "LengthAsDistance":
        kind = "distance";
        break;

      case "LengthAsLaps":
        kind = "laps";
        break;

      default:
        kind = "distance";
    }

    cursor.firstChild();

    const length: Length = {
      kind,
      value: state.sliceDoc(cursor.from, cursor.to),
    };
    cursor.parent(); // exits LengthAsDistance or LengthAsLaps

    cursor.parent(); // exits length
    cursor.nextSibling();
    const stroke = getStroke(state.sliceDoc(cursor.from, cursor.to));

    instruction = { isBlock: false, length, stroke };
    // cursor is still on the Stroke
  }
  // Move back up to SwimInstruction
  cursor.parent();

  if (cursor.nextSibling()) {
    let hasModifiers = true;
    if (cursor.name === "StrokeModifier") {
      strokeModifier = getStrokeModifier(
        state.sliceDoc(cursor.from, cursor.to),
      );

      // Move away from the StrokeModifier to a potential instruction modifier.
      hasModifiers = cursor.nextSibling();
    }

    if (hasModifiers) {
      do {
        instructionModifiers.push(visitInstructionModifier(cursor, state));
      } while (cursor.nextSibling());
    }
  }

  // Move up out of the SwimInstruction
  cursor.parent();

  return {
    statement: Statements.SWIM_INSTRUCTION,
    repetitions,
    instruction,
    strokeModifier,
    instructionModifiers,
  };
}

/**
 * Create an AST node for a `Message` CST node.
 *
 * Precondition: `cursor` points to a `Message` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `Message` AST node.
 */
function visitMessage(cursor: TreeCursor, state: EditorState): Message {
  return {
    statement: Statements.MESSAGE,
    message: state.sliceDoc(cursor.from, cursor.to),
  };
}

/**
 * Create an AST node for a `ConstantDefinition` CST node.
 *
 * Precondition: `cursor` points to a `ConstantDefinition` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns A `ConstantDefinition` AST node.
 */
function visitConstantDefinition(
  cursor: TreeCursor,
  state: EditorState,
): ConstantDefinition {
  // Move into ConstantDefinition
  cursor.firstChild();
  const constantName = state.sliceDoc(cursor.from, cursor.to);

  // Move into Number | StringContent | Boolean
  cursor.nextSibling();
  const value: string = state.sliceDoc(cursor.from, cursor.to);

  // Move up out of the ConstantDefinition
  cursor.parent();
  return {
    statement: Statements.CONSTANT_DEFINITION,
    constantName,
    value,
  };
}

/**
 * Create an AST node for a `AuthorDefinition` CST node.
 *
 * Precondition: `cursor` points to an `AuthorDefinition` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An `AuthorDefinition` AST node.
 */
function visitAuthorDefinition(
  cursor: TreeCursor,
  state: EditorState,
): AuthorDefintion {
  // Move into AuthorDefinition's first child, the first name
  cursor.firstChild();
  const firstName = state.sliceDoc(cursor.from, cursor.to);

  // Move into last name
  cursor.nextSibling();
  const lastName = state.sliceDoc(cursor.from, cursor.to);

  let emailAddress: string | undefined;
  // Move into email address, if it exists
  if (cursor.nextSibling()) {
    emailAddress = state.sliceDoc(cursor.from, cursor.to);
  }

  // Move back up to the AuthorDefinition
  cursor.parent();
  return {
    statement: Statements.AUTHOR_DEFINITION,
    firstName,
    lastName,
    emailAddress,
  };
}

/**
 * Create an AST node for a `InstructionDescription` CST node.
 *
 * Precondition: `cursor` points to an `InstructionDescription` node.
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 */
function visitInstructionDescription(
  cursor: TreeCursor,
  state: EditorState,
): InstructionDescription {
  // Move into the InstructionDescription description text.
  cursor.firstChild();
  const description = state.sliceDoc(cursor.from, cursor.to);

  // Move back up to the InstructionDescription.
  cursor.parent();
  return {
    modifier: InstructionModifiers.INSTRUCTION_DESCRIPTION,
    description,
  };
}

/**
 * Create an AST for the current program in `state`.
 *
 * Precondition: `cursor` points to the topmost node (`SwimProgramme`).
 *
 * Postcondition: `cursor` will point to the same node it pointed to when
 * passed to this function.
 *
 * @param cursor - A reference to a Lezer syntax tree node.
 * @param state - The state of the CodeMirror editor.
 *
 * @returns An AST as an objection holding a list of top level statements.
 */
export default function buildAst(
  cursor: TreeCursor,
  state: EditorState,
): Programme {
  const statements: Statement[] = [];

  function walk(): void {
    do {
      let node: Statement | null = null;

      switch (cursor.type.name) {
        case "SwimInstruction":
          node = visitSwimInstruction(cursor, state);
          break;
        case "Message":
          node = visitMessage(cursor, state);
          break;
        case "PaceDefinition":
          node = visitPaceDefinition(cursor, state);
          break;
        case "ConstantDefinition":
          node = visitConstantDefinition(cursor, state);
          break;
        case "AuthorDefinition":
          node = visitAuthorDefinition(cursor, state);
          break;
        default:
          break;
      }

      if (node !== null) {
        statements.push(node);
      }
    } while (cursor.nextSibling());
  }

  cursor.firstChild();
  walk();
  return { statements };
}
