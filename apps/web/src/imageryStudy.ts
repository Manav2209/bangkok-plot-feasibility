import type { Point, Ring } from '@bangkok/domain';

/** Dated visual observation, separate from a verified parcel/access claim. */
export const imageryStudy = {
  id: 'unbuilt-ground-2026-03-05',
  observedOn: '2026-03-05',
  label: '5 March 2026',
  centre: [100.61025, 13.69628] as Point,
  plot: [
    [100.61007890625, 13.696390625],
    [100.610353125, 13.6964515625],
    [100.610419140625, 13.696192578125],
    [100.610236328125, 13.696101171875],
    [100.610109375, 13.696162109375],
  ] as Ring,
  attribution: 'Esri World Imagery / Vantor Vivid Advanced, WV02',
  citationRecord: 5002983,
  providerSourceResolutionM: 0.5,
  providerSourceAccuracyFieldM: 8.47,
  citationUrl:
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/10/query?f=pjson&where=1%3D1&geometry=100.61025,13.69628&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,SRC_DATE,SRC_RES,SRC_ACC,MinMapLevel,MaxMapLevel,BlockName&returnGeometry=false',
  imageUrl:
    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=100.6095,13.6957,100.6108,13.6970&bboxSR=4326&imageSR=4326&size=256,256&format=jpg&f=image',
  observation:
    'Illustrative inner outline of visibly unbuilt ground. Buildings and parking north, excavation west and trees at the edges are excluded. Occupation, current condition, property boundaries, road access and canal restrictions are unverified.',
};
