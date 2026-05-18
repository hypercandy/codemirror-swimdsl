import { Diagnostic } from "@codemirror/lint";
import { SyntaxNodeRef } from "@lezer/common";

import {
  undefinedPaceNameActions,
  duplicatePaceNameDefinitionActions,
  invalidNodeValueActions,
} from "./actions";
import type { ReadonlyNonEmptyArray } from "./types";

/**
 * Provides the user with an error message and resolution actions when they
 * define a pace name multiple times.
 *
 * @param duplicatedName - The pace name which has been defined twice.
 * @param paceDefinitionNameNode - The syntax tree node for the pace definition name.
 * @param paceDefinitionNode - The syntax tree node for the pace definition.
 *
 * @returns An editor diagnostic for a duplicated pace name.
 */
export function duplicatePaceNameDefinitionDiagnostic(
  duplicatedName: string,
  paceDefinitionNameNode: SyntaxNodeRef,
  paceDefinitionNode: SyntaxNodeRef,
): Diagnostic {
  return {
    from: paceDefinitionNameNode.from,
    to: paceDefinitionNameNode.to,
    severity: "error",
    message: `A pace named '${duplicatedName}' has already been defined`,
    actions: duplicatePaceNameDefinitionActions(paceDefinitionNode),
  };
}

/**
 * Provides the user with an error message ang resolution actions when they
 * attempt to reference an undefined pace name.
 *
 * @param paceAliasNode - The syntax tree node for the pace alias.
 * @param undefinedName - The undefined pace name the user attempted to use.
 * @param definedPaceNames - The list of all currently defined pace names.
 *
 * @returns An editor diagnostic for an undefined pace name.
 */
export function undefinedPaceNameDiagnostic(
  paceAliasNode: SyntaxNodeRef,
  undefinedName: string,
  definedPaceNames: Set<string>,
): Diagnostic {
  return {
    from: paceAliasNode.from,
    to: paceAliasNode.to,
    severity: "error",
    actions: undefinedPaceNameActions(undefinedName, definedPaceNames),
    message: `'${undefinedName}' is not a defined pace name.
If you wish to be able to use '${undefinedName}' in the place of a pace percentage, please define it with the following line:
Pace ${undefinedName} = _%`,
  };
}

/**
 * Provide the user with an error message when they introduce a syntax error.
 *
 * @param errorNode - The syntax tree node containing the syntax error.
 *
 * @returns An editor diagnostic for a syntax error.
 */
export function syntaxErrorDiagnostic(errorNode: SyntaxNodeRef): Diagnostic {
  return {
    from: errorNode.from,
    to: errorNode.to,
    severity: "error",
    message: "Syntax error",
  };
}

/**
 * Provides the user with an error message when they reference a particular
 * piece of equipment multiple times within the same instruction.
 *
 * @param from - The position of the first character to include in the error.
 * @param to - The position of the last character to include in the error.
 *
 * @returns An editor diagnostic for a duplicated equipment specification.
 */
export function duplicateEquipmentDiagnostic(
  from: number,
  to: number,
): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message:
      "Duplicate equipment specified. Please do not use the same equipment multiple times",
  };
}

/**
 * Provide the user with an error message when they attempt to mix a piece of
 * swimming equipment with a stroke type which that equipment cannont be used with.
 *
 * @param from - The position of the first character to include in the error.
 * @param to - The position of the last character to include in the error.
 * @param equipmentName - The name of the piece of equipment the user specified.
 * @param strokeType - The name of the stroke type the user specified.
 *
 * @returns An editor diagnostic for incompatible equipment.
 */
export function incompatibleEquipmentDiagnostic(
  from: number,
  to: number,
  equipmentName: string,
  strokeType: string,
): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message: `'${equipmentName}' is not compatible with stroke type '${strokeType}'`,
  };
}

/**
 * Provide the user with an error message when they attempt to specify multiple rest
 * times for one swim instruction.
 *
 * @param from - The position of the first character to include in the error.
 * @param to - The position of the last character to include in the error.
 *
 * @returns An editor diagnostic for incompatible equipment.
 */
export function multipleRestDiagnostic(from: number, to: number): Diagnostic {
  return {
    from,
    to,
    severity: "error",
    message:
      "Multiple rest times specified. Please only specify at most one rest time per instruction.",
  };
}

/**
 * Convert a string from "PascalCase" to "sentence case".
 *
 * @param pascalCase - The string written in Pascal case.
 *
 * @returns The input string converted to sentence case.
 */
function pascalCaseToSentence(pascalCase: string): string {
  // Insert a space before all caps that follow a lowercase letter.
  const sentenceWithSpaces = pascalCase.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Lowercase the entire sentence.
  return sentenceWithSpaces.toLowerCase();
}

/**
 * Provide the user with an error message and resolution actions when they
 * use an invalid value for a specific node.
 *
 * @param node - The syntax tree node who's value is invalid.
 * @param nodeValue - The node's string value.
 * @param nodeName - The nodes name in the syntax tree.
 * @param validValues - A list of values which would be valid in place of the
 *    invalid value.
 *
 * @returns An editor diagnostic for an invalid node value.
 */
export function invalidNodeValueDiagnostic(
  node: SyntaxNodeRef,
  nodeValue: string,
  nodeName: string,
  validValues: ReadonlyNonEmptyArray<string>,
): Diagnostic {
  return {
    from: node.from,
    to: node.to,
    severity: "error",
    message: `${nodeValue} is not a valid ${pascalCaseToSentence(nodeName)}.`,
    actions: invalidNodeValueActions(nodeValue, validValues),
  };
}

/**
 * Provide the user with an error message when they introduce a malformed
 * time duration.
 *
 * @param numberNode - THe syntax tree node for the number within the duration
 *    that is invalid.
 *
 * @returns An editor diagnostic for an invalid duration.
 */
export function invalidDurationDiagnostic(
  numberNode: SyntaxNodeRef,
): Diagnostic {
  return {
    from: numberNode.from,
    to: numberNode.to,
    severity: "error",
    message: `Number too large for duration`,
  };
}
