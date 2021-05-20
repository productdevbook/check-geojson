import { HintIssue } from './errors';
import { Node, ObjectNode } from '@humanwhocodes/momoa';

export function getObject(
  issues: HintIssue[],
  node: Node | null
): ObjectNode | null {
  if (node?.type === 'Object') return node;
  if (node) {
    issues.push({
      code: 'invalid_type',
      message: 'This must be an object.',
      loc: node.loc,
    });
  }
  return null;
}
