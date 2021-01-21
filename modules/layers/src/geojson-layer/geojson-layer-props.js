function createEmptyLayerProps() {
  return {
    points: {},
    lines: {},
    polygons: {},
    polygonsOutline: {}
  };
}

function getCoordinates(f) {
  return f.geometry.coordinates;
}

export function createLayerPropsFromFeatures(features, featuresDiff) {
  const layerProps = createEmptyLayerProps();
  const {pointFeatures, lineFeatures, polygonFeatures, polygonOutlineFeatures} = features;

  layerProps.points.data = pointFeatures;
  layerProps.points._dataDiff = featuresDiff.pointFeatures && (() => featuresDiff.pointFeatures);
  layerProps.points.getPosition = getCoordinates;

  layerProps.lines.data = lineFeatures;
  layerProps.lines._dataDiff = featuresDiff.lineFeatures && (() => featuresDiff.lineFeatures);
  layerProps.lines.getPath = getCoordinates;

  layerProps.polygons.data = polygonFeatures;
  layerProps.polygons._dataDiff =
    featuresDiff.polygonFeatures && (() => featuresDiff.polygonFeatures);
  layerProps.polygons.getPolygon = getCoordinates;

  layerProps.polygonsOutline.data = polygonOutlineFeatures;
  layerProps.polygonsOutline._dataDiff =
    featuresDiff.polygonOutlineFeatures && (() => featuresDiff.polygonOutlineFeatures);
  layerProps.polygonsOutline.getPath = getCoordinates;

  return layerProps;
}

export function createLayerPropsFromBinary(geojsonBinary, uniqueIdProperty, encodePickingColor) {
  const layerProps = createEmptyLayerProps();
  const {points, lines, polygons} = geojsonBinary;

  const customPickingColors = calculatePickingColors(
    geojsonBinary,
    uniqueIdProperty,
    encodePickingColor
  );

  layerProps.points.data = {
    length: points.positions.value.length / points.positions.size,
    attributes: {
      getPosition: points.positions,
      pickingColors: {
        size: 3,
        value: customPickingColors.points
      }
    },
    properties: points.properties,
    numericProps: points.numericProps,
    featureIds: points.featureIds
  };

  layerProps.lines.data = {
    length: lines.pathIndices.value.length - 1,
    startIndices: lines.pathIndices.value,
    attributes: {
      getPath: lines.positions,
      pickingColors: {
        size: 3,
        value: customPickingColors.lines
      }
    },
    properties: lines.properties,
    numericProps: lines.numericProps,
    featureIds: lines.featureIds
  };
  layerProps.lines._pathType = 'open';

  layerProps.polygons.data = {
    length: polygons.primitivePolygonIndices.value.length,
    startIndices: polygons.primitivePolygonIndices.value,
    attributes: {
      getPolygon: polygons.positions,
      pickingColors: {
        size: 3,
        value: customPickingColors.polygons
      }
    },
    properties: polygons.properties,
    numericProps: polygons.numericProps,
    featureIds: polygons.featureIds
  };
  layerProps.polygons._normalize = false;

  layerProps.polygonsOutline.data = {
    length: polygons.primitivePolygonIndices.value.length,
    startIndices: polygons.primitivePolygonIndices.value,
    attributes: {
      getPath: polygons.positions,
      instancePickingColors: {
        size: 3,
        value: customPickingColors.polygons
      }
    },
    properties: polygons.properties,
    numericProps: polygons.numericProps,
    featureIds: polygons.featureIds
  };
  layerProps.polygonsOutline._pathType = 'open';

  return layerProps;
}

// Custom picking color to keep binary indexes

function calculatePickingColors(geojsonBinary, encodePickingColor) {
  const pickingColors = {
    points: null,
    lines: null,
    polygons: null
  };
  for (const key in pickingColors) {
    pickingColors[key] = new Uint8ClampedArray(geojsonBinary[key].featureIds.value.length * 3);
    const pickingColor = [];
    for (let i = 0; i < geojsonBinary[key].featureIds.value.length; i++) {
      encodePickingColor(geojsonBinary[key].featureIds.value[i], pickingColor);
      pickingColors[key][i * 3 + 0] = pickingColor[0];
      pickingColors[key][i * 3 + 1] = pickingColor[1];
      pickingColors[key][i * 3 + 2] = pickingColor[2];
    }
  }

  return pickingColors;
}
