export const enum Statements {
  SWIM_INSTRUCTION,
  MESSAGE,
  PACE_DEFINITION,
  CONSTANT_DEFINITION,
  AUTHOR_DEFINITION,
}

export const enum InstructionModifiers {
  EQUIPMENT_SPECIFICATION,
  PACE,
  REST,
  EXCLUDE_ALIGN,
  BREATHE,
  UNDERWATER,
  INSTRUCTION_DESCRIPTION,
}

export const enum StrokeModifiers {
  STANDARD = "standardStroke",
  KICK = "kicking",
  PULL = "pulling",
  DRILL = "drill",
}

export interface ExcludeAlign {
  modifier: InstructionModifiers.EXCLUDE_ALIGN;
}

export interface Programme {
  statements: Statement[];
}

export type Instruction = SwimInstruction | Message;

export interface ConstantDefinition {
  statement: Statements.CONSTANT_DEFINITION;
  constantName: string;
  value: string;
}

export interface AuthorDefintion {
  statement: Statements.AUTHOR_DEFINITION;
  firstName: string;
  lastName: string;
  emailAddress?: string | undefined;
}

export type Statement =
  | Instruction
  | PaceDefinition
  | ConstantDefinition
  | AuthorDefintion;

export interface EquipmentSpecification {
  modifier: InstructionModifiers.EQUIPMENT_SPECIFICATION;
  equipment: string[];
}

export interface InstructionDescription {
  modifier: InstructionModifiers.INSTRUCTION_DESCRIPTION;
  description: string;
}

export type Rest = RestSinceStart | RestAfterStop | RestInOut;

export interface RestSinceStart {
  modifier: InstructionModifiers.REST;
  type: "SinceStart";
  minutes: string;
  seconds: string;
}

export interface RestAfterStop {
  modifier: InstructionModifiers.REST;
  type: "AfterStop";
  minutes: string;
  seconds: string;
}

export interface RestInOut {
  modifier: InstructionModifiers.REST;
  type: "InOut";
  swimmersIn: string;
}

export interface Underwater {
  modifier: InstructionModifiers.UNDERWATER;
  isTrue: boolean;
}

export type InstructionModifier =
  | EquipmentSpecification
  | Pace
  | Rest
  | Underwater
  | Breathe
  | InstructionDescription
  | ExcludeAlign;

export interface SwimInstruction {
  statement: Statements.SWIM_INSTRUCTION;
  repetitions: number;
  instruction: SingleInstruction | BlockInstruction;
  strokeModifier?: StrokeModifiers | undefined;
  instructionModifiers: InstructionModifier[];
}

export type Length =
  | { kind: "distance"; value: string }
  | { kind: "laps"; value: string };

export interface SingleInstruction {
  isBlock: false;
  length: Length;
  stroke: string;
}

export interface BlockInstruction {
  isBlock: true;
  instructions: Instruction[];
}

export interface Intensity {
  isAlias: boolean;
  value: string;
}

export interface Pace {
  modifier: InstructionModifiers.PACE;
  startIntensity: Intensity;
  stopIntensity?: Intensity | undefined;
}

export interface PaceDefinition {
  statement: Statements.PACE_DEFINITION;
  name: string;
  pace: Pace;
}

export interface Message {
  statement: Statements.MESSAGE;
  message: string;
}

export interface Breathe {
  modifier: InstructionModifiers.BREATHE;
  breatheStrokes: string;
}
