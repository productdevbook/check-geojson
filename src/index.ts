import { parse, evaluate, Node, ObjectNode } from '@humanwhocodes/momoa';
import { GeoJSON } from 'geojson';
import { HintIssue, HintError } from './errors';
import { GEOJSON_TYPES } from './types';
import { getType } from './get_type';
import { getMember } from './get_member';
import { getArray } from './get_array';
import { getCoordinates } from './get_coordinates';
import { enforcePosition } from './enforce_position';
import {
  enforcePositionArray,
  enforcePositionArray2,
  enforcePositionArray3,
} from './enforce_position_array';
import { forbidConfusingProperties } from './forbid_confusing_properties';

function checkLineString(issues: HintIssue[], node: ObjectNode) {
  enforcePositionArray(issues, getCoordinates(issues, node), 'linestring');
  forbidConfusingProperties(issues, node);
}

function checkMultiLineString(issues: HintIssue[], node: ObjectNode) {
  enforcePositionArray2(issues, getCoordinates(issues, node), 'linestring');
  forbidConfusingProperties(issues, node);
}

function checkPolygon(issues: HintIssue[], node: ObjectNode) {
  enforcePositionArray2(issues, getCoordinates(issues, node), 'polygon');
  forbidConfusingProperties(issues, node);
}

function checkMultiPolygon(issues: HintIssue[], node: ObjectNode) {
  enforcePositionArray3(issues, getCoordinates(issues, node), 'polygon');
  forbidConfusingProperties(issues, node);
}

function checkPoint(issues: HintIssue[], node: ObjectNode) {
  enforcePosition(issues, getCoordinates(issues, node));
  forbidConfusingProperties(issues, node);
}

function checkMultiPoint(issues: HintIssue[], node: ObjectNode) {
  enforcePositionArray(issues, getCoordinates(issues, node));
  forbidConfusingProperties(issues, node);
}

function checkGeometryCollection(issues: HintIssue[], node: ObjectNode) {
  forbidConfusingProperties(issues, node);
  const geometriesMember = getArray(
    issues,
    getMember(issues, node, 'geometries')
  );
  if (!geometriesMember) return;
  for (let element of geometriesMember.elements) {
    checkObject(issues, element);
  }
}

function checkFeature(issues: HintIssue[], node: ObjectNode) {
  const geometry = getMember(issues, node, 'geometry');
  checkObject(issues, geometry);
}
function checkFeatureCollection(issues: HintIssue[], node: ObjectNode) {
  const featuresMember = getArray(issues, getMember(issues, node, 'features'));
  if (!featuresMember) return;
  for (let feature of featuresMember.elements) {
    checkFeature(issues, feature);
  }
}

const CHECKERS: Record<
  GeoJSON['type'],
  (arg0: HintIssue[], arg1: ObjectNode) => void
> = {
  LineString: checkLineString,
  MultiLineString: checkMultiLineString,

  Polygon: checkPolygon,
  MultiPolygon: checkMultiPolygon,

  Point: checkPoint,
  MultiPoint: checkMultiPoint,

  GeometryCollection: checkGeometryCollection,

  Feature: checkFeature,
  FeatureCollection: checkFeatureCollection,
};

function checkObject(issues: HintIssue[], node: Node) {
  const { type, objectNode } = getType(issues, node, GEOJSON_TYPES);
  if (!(type && objectNode)) return;
  CHECKERS[type](issues, objectNode);
}

export const check = (jsonStr: string): GeoJSON => {
  const ast = parse(jsonStr, {
    ranges: true,
  });
  const issues: HintIssue[] = [];
  checkObject(issues, ast.body);
  if (issues.length) throw new HintError(issues);
  return evaluate(ast);
};

export { HintError };
