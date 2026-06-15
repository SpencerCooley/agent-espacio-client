'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import MapDrawToolbar from './MapDrawToolbar';
import { type DrawMode } from './MapDrawToolbar';
import MultiPolygonPanel from './MultiPolygonPanel';
import MultiLinePanel from './MultiLinePanel';
import MapSettingsDialog from './MapSettingsDialog';
import MapGeometryPanel from './MapGeometryPanel';
import AssociationExplorer from './AssociationExplorer';
import { artifactService, Artifact } from '../../services/artifacts';

interface MapEditorProps {
  artifact: Artifact;
}

const CARTO_VOYAGER_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
const CARTO_DARK_MATTER_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const GOOGLE_SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: [
        'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: 'Imagery © Google',
      maxzoom: 22,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster' as const, source: 'satellite', minzoom: 0, maxzoom: 22 },
  ],
};

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'osm', type: 'raster' as const, source: 'osm', minzoom: 0, maxzoom: 19 },
  ],
};

function getStyleUrl(style: string): string | maplibregl.StyleSpecification {
  switch (style) {
    case 'google-satellite':
      return GOOGLE_SATELLITE_STYLE;
    case 'dark-matter':
      return CARTO_DARK_MATTER_URL;
    case 'osm':
      return OSM_STYLE;
    case 'carto-voyager':
    default:
      return CARTO_VOYAGER_URL;
  }
}

let idCounter = 0;
function generateFeatureId(): string {
  return `feat-${Date.now()}-${idCounter++}`;
}

function getDefaultName(type: string, index: number): string {
  switch (type) {
    case 'Point': return `Point ${index + 1}`;
    case 'LineString': return `Line ${index + 1}`;
    case 'Polygon': return `Polygon ${index + 1}`;
    case 'MultiPolygon': return `MultiPolygon ${index + 1}`;
    default: return `Feature ${index + 1}`;
  }
}

function getFeatureColor(feature: any): string {
  return feature?.properties?.style?.color || '#1976d2';
}

function getFeatureFillOpacity(feature: any): number {
  return feature?.properties?.style?.fillOpacity ?? 0.3;
}

function getFeatureStrokeWidth(feature: any): number {
  return feature?.properties?.style?.strokeWidth ?? 2;
}

export default function MapEditor({ artifact }: MapEditorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const vertexMarkersRef = useRef<{ marker: maplibregl.Marker; featureId: string; polygonIndex: number; ringIndex: number; vertexIndex: number }[]>([]);
  const [name, setName] = useState(artifact.name);
  const lastSavedName = useRef(artifact.name);
  const nameSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [description, setDescription] = useState(artifact.description || '');
  const lastSavedDescription = useRef(artifact.description || '');
  const descriptionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedViewport = useRef<string>('');
  const lastSavedStyle = useRef<string>('');
  const lastSavedGeoJSON = useRef<string>('');
  const saveRef = useRef<(viewport: any, style?: string, geojson?: any) => Promise<void>>(null!);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAssociationExplorer, setShowAssociationExplorer] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<{
    latitude: number;
    longitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  } | undefined>(undefined);
  const [drawMode, setDrawMode] = useState<DrawMode>('simple_select');
  const drawModeRef = useRef<DrawMode>('simple_select');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const selectedFeatureIdRef = useRef<string | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const hoveredFeatureIdRef = useRef<string | null>(null);

  const handleSelectFeature = useCallback((id: string | null) => {
    setSelectedFeatureId(id);
    setHoveredFeatureId(null);
  }, []);
  const [geoJSON, setGeoJSON] = useState<any>(
    (artifact.content as any)?.geojson || { type: 'FeatureCollection', features: [] }
  );
  const geoJSONRef = useRef<any>(geoJSON);
  const [style, setStyle] = useState<string>((artifact.content as any)?.style || 'carto-voyager');

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [drawingCoords, setDrawingCoords] = useState<[number, number][]>([]);
  const drawingCoordsRef = useRef<[number, number][]>([]);
  const drawingTypeRef = useRef<'line' | 'polygon' | null>(null);

  // MultiPolygon drawing state
  const [multiPolygons, setMultiPolygons] = useState<{ id: string; coords: [number, number][]; isHole: boolean }[]>([]);
  const multiPolygonsRef = useRef<{ id: string; coords: [number, number][]; isHole: boolean }[]>([]);
  const [currentPolygonId, setCurrentPolygonId] = useState<string | null>(null);
  const currentPolygonIdRef = useRef<string | null>(null);

  // MultiLine drawing state
  const [multiLines, setMultiLines] = useState<{ id: string; coords: [number, number][] }[]>([]);
  const multiLinesRef = useRef<{ id: string; coords: [number, number][] }[]>([]);
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const currentLineIdRef = useRef<string | null>(null);

  const content = artifact.content as any;
  const initialViewport = content?.viewport || {
    latitude: 20,
    longitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
    bounds: { north: 85, south: -85, east: 180, west: -180 },
  };

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { geoJSONRef.current = geoJSON; }, [geoJSON]);
  useEffect(() => { selectedFeatureIdRef.current = selectedFeatureId; }, [selectedFeatureId]);
  useEffect(() => { hoveredFeatureIdRef.current = hoveredFeatureId; }, [hoveredFeatureId]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { drawingCoordsRef.current = drawingCoords; }, [drawingCoords]);
  useEffect(() => { multiPolygonsRef.current = multiPolygons; }, [multiPolygons]);
  useEffect(() => { currentPolygonIdRef.current = currentPolygonId; }, [currentPolygonId]);
  useEffect(() => { multiLinesRef.current = multiLines; }, [multiLines]);
  useEffect(() => { currentLineIdRef.current = currentLineId; }, [currentLineId]);

  const handleSave = useCallback(async (newViewport: any, newStyle?: string, newGeoJSON?: any) => {
    const viewportStr = JSON.stringify(newViewport);
    const styleToSave = newStyle || style;
    const geoJSONToSave = newGeoJSON !== undefined ? newGeoJSON : geoJSON;
    const geoJSONStr = JSON.stringify(geoJSONToSave);

    const styleChanged = styleToSave !== lastSavedStyle.current;
    const viewportChanged = viewportStr !== lastSavedViewport.current;
    const geoJSONChanged = geoJSONStr !== lastSavedGeoJSON.current;

    if (!viewportChanged && !styleChanged && !geoJSONChanged) return;

    const newContent = {
      ...content,
      viewport: newViewport,
      style: styleToSave,
      geojson: geoJSONToSave,
    };

    setSaving(true);
    try {
      await artifactService.updateArtifact(artifact.id, { content: newContent });
      if (viewportChanged) lastSavedViewport.current = viewportStr;
      if (styleChanged) lastSavedStyle.current = styleToSave;
      if (geoJSONChanged) lastSavedGeoJSON.current = geoJSONStr;
    } catch (err: any) {
      console.error('Failed to save map:', err);
    } finally {
      setSaving(false);
    }
  }, [artifact.id, content, style, geoJSON]);

  saveRef.current = handleSave;

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    nameSaveTimer.current = setTimeout(() => {
      if (newName !== lastSavedName.current) {
        artifactService.updateArtifact(artifact.id, { name: newName })
          .then(() => { lastSavedName.current = newName; })
          .catch((err) => console.error('Failed to save name:', err));
      }
    }, 1500);
  };

  const handleNameBlur = () => {
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    if (name !== lastSavedName.current) {
      artifactService.updateArtifact(artifact.id, { name })
        .then(() => { lastSavedName.current = name; })
        .catch((err) => console.error('Failed to save name:', err));
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    if (descriptionSaveTimer.current) clearTimeout(descriptionSaveTimer.current);
    descriptionSaveTimer.current = setTimeout(() => {
      if (newDescription !== lastSavedDescription.current) {
        artifactService.updateArtifact(artifact.id, { description: newDescription })
          .then(() => { lastSavedDescription.current = newDescription; })
          .catch((err) => console.error('Failed to save description:', err));
      }
    }, 1500);
  };

  const handleDescriptionBlur = () => {
    if (descriptionSaveTimer.current) clearTimeout(descriptionSaveTimer.current);
    if (description !== lastSavedDescription.current) {
      artifactService.updateArtifact(artifact.id, { description })
        .then(() => { lastSavedDescription.current = description; })
        .catch((err) => console.error('Failed to save description:', err));
    }
  };

  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle);
    const map = mapRef.current;
    if (!map) return;

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentPitch = map.getPitch();
    const currentBearing = map.getBearing();

    map.once('style.load', () => {
      const deckOverlay = new MapboxOverlay({
        layers: [],
      });
      map.addControl(deckOverlay);

      addGeoJSONLayers(map);
      syncMarkers(map);
      syncVertexMarkers(map);

      map.setZoom(currentZoom);
      map.setCenter(currentCenter);
      map.setPitch(currentPitch);
      map.setBearing(currentBearing);
    });
    map.setStyle(getStyleUrl(newStyle));

    const bounds = map.getBounds();
    const newViewport = {
      latitude: currentCenter.lat,
      longitude: currentCenter.lng,
      zoom: currentZoom,
      pitch: currentPitch,
      bearing: currentBearing,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    };

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveRef.current(newViewport, newStyle);
    }, 1500);
  };

  const addGeoJSONLayers = useCallback((map: maplibregl.Map) => {
    if (map.getSource('geojson-features')) {
      map.removeLayer('geojson-lines');
      map.removeLayer('geojson-polygons-fill');
      map.removeLayer('geojson-polygons-outline');
      map.removeLayer('geojson-points');
      map.removeSource('geojson-features');
    }

    const currentGeoJSON = geoJSONRef.current;
    map.addSource('geojson-features', {
      type: 'geojson',
      data: currentGeoJSON,
    });

    // Point layer - uses feature color
    map.addLayer({
      id: 'geojson-points',
      type: 'circle',
      source: 'geojson-features',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 6,
        'circle-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    // Line layer
    map.addLayer({
      id: 'geojson-lines',
      type: 'line',
      source: 'geojson-features',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
        'line-width': ['coalesce', ['get', 'strokeWidth', ['get', 'style']], 3],
      },
    });

    // Polygon fill (also matches MultiPolygon)
    map.addLayer({
      id: 'geojson-polygons-fill',
      type: 'fill',
      source: 'geojson-features',
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'fill-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
        'fill-opacity': ['coalesce', ['get', 'fillOpacity', ['get', 'style']], 0.3],
      },
    });

    // Polygon outline (also matches MultiPolygon)
    map.addLayer({
      id: 'geojson-polygons-outline',
      type: 'line',
      source: 'geojson-features',
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'line-color': ['coalesce', ['get', 'color', ['get', 'style']], '#1976d2'],
        'line-width': ['coalesce', ['get', 'strokeWidth', ['get', 'style']], 2],
      },
    });

    // Extract hole rings from Polygon and MultiPolygon features
    // and render them as yellow filled polygons in the editor
    if (map.getSource('geojson-holes')) {
      map.removeLayer('geojson-holes-fill');
      map.removeSource('geojson-holes');
    }

    const holeFeatures: any[] = [];
    currentGeoJSON.features.forEach((feature: any) => {
      if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: number[][][]) => {
          (polygon as unknown as [number, number][][]).forEach((ring, ringIndex) => {
            if (ringIndex > 0) {
              holeFeatures.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [ring] },
                properties: { parentId: feature.id },
              });
            }
          });
        });
      } else if (feature.geometry.type === 'Polygon') {
        (feature.geometry.coordinates as unknown as [number, number][][]).forEach((ring, ringIndex) => {
          if (ringIndex > 0) {
            holeFeatures.push({
              type: 'Feature',
              geometry: { type: 'Polygon', coordinates: [ring] },
              properties: { parentId: feature.id },
            });
          }
        });
      }
    });

    if (holeFeatures.length > 0) {
      map.addSource('geojson-holes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: holeFeatures },
      });
      map.addLayer({
        id: 'geojson-holes-fill',
        type: 'fill',
        source: 'geojson-holes',
        paint: {
          'fill-color': '#fdd835',
          'fill-opacity': 0.4,
        },
      });
    }

    // Highlight layers (drawn on top, initially empty)
    if (map.getSource('highlighted-features')) {
      map.removeLayer('highlighted-points');
      map.removeLayer('highlighted-polygons-outline');
      map.removeSource('highlighted-features');
    }

    map.addSource('highlighted-features', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id: 'highlighted-points',
      type: 'circle',
      source: 'highlighted-features',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 10,
        'circle-color': '#f44336',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#fff',
      },
    });

    map.addLayer({
      id: 'highlighted-polygons-outline',
      type: 'line',
      source: 'highlighted-features',
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'line-color': '#f44336',
        'line-width': 4,
      },
    });
  }, []);

  const syncMarkers = useCallback((map: maplibregl.Map) => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const currentGeoJSON = geoJSONRef.current;
    const currentSelectedId = selectedFeatureIdRef.current;
    const currentHoveredId = hoveredFeatureIdRef.current;
    const points = currentGeoJSON.features.filter((f: any) => f.geometry?.type === 'Point');

    points.forEach((feature: any) => {
      const coords = feature.geometry.coordinates;
      const color = getFeatureColor(feature);
      const isActive = currentSelectedId === feature.id || currentHoveredId === feature.id;
      const el = document.createElement('div');
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundColor = color;
      el.style.borderRadius = '50%';
      el.style.border = isActive ? '4px solid #f44336' : '3px solid #fff';
      el.style.boxShadow = isActive ? '0 0 0 2px rgba(244, 67, 54, 0.4)' : '0 2px 6px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat(coords)
        .addTo(map);

      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        const newGeoJSON = {
          ...geoJSONRef.current,
          features: geoJSONRef.current.features.map((f: any) => {
            if (f.id === feature.id) {
              return {
                ...f,
                geometry: {
                  ...f.geometry,
                  coordinates: [newLngLat.lng, newLngLat.lat],
                },
              };
            }
            return f;
          }),
        };
        setGeoJSON(newGeoJSON);
        triggerGeoJSONSave(newGeoJSON);
      });

      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[Marker click] selecting feature:', feature.id, feature.properties?.name);
        handleSelectFeature(feature.id);
      });

      markersRef.current.push(marker);
    });
  }, []);

  const syncVertexMarkers = useCallback((map: maplibregl.Map) => {
    vertexMarkersRef.current.forEach((v) => v.marker.remove());
    vertexMarkersRef.current = [];

    const currentGeoJSON = geoJSONRef.current;
    const currentSelectedId = selectedFeatureIdRef.current;
    const currentHoveredId = hoveredFeatureIdRef.current;

    const isLargeDataset = currentGeoJSON.features.length >= 15;

    currentGeoJSON.features.forEach((feature: any) => {
      const isActive = currentSelectedId === feature.id || currentHoveredId === feature.id;
      // For large datasets, only render vertex markers for the selected feature
      if (isLargeDataset && currentSelectedId !== feature.id) return;

      if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach((coord: [number, number], index: number) => {
          const el = createVertexElement(isActive);
          const marker = new maplibregl.Marker({
            element: el,
            draggable: true,
          })
            .setLngLat(coord)
            .addTo(map);

          marker.on('dragend', () => {
            const newLngLat = marker.getLngLat();
            const newGeoJSON = {
              ...geoJSONRef.current,
              features: geoJSONRef.current.features.map((f: any) => {
                if (f.id === feature.id) {
                  const newCoords = [...f.geometry.coordinates];
                  newCoords[index] = [newLngLat.lng, newLngLat.lat];
                  return {
                    ...f,
                    geometry: {
                      ...f.geometry,
                      coordinates: newCoords,
                    },
                  };
                }
                return f;
              }),
            };
            setGeoJSON(newGeoJSON);
            triggerGeoJSONSave(newGeoJSON);
          });

          vertexMarkersRef.current.push({ marker, featureId: feature.id, polygonIndex: 0, ringIndex: 0, vertexIndex: index });
        });
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach((ring: number[][], ringIndex: number) => {
          (ring as [number, number][]).slice(0, -1).forEach((coord: [number, number], index: number) => {
            const el = createVertexElement(isActive);
            const marker = new maplibregl.Marker({
              element: el,
              draggable: true,
            })
              .setLngLat(coord)
              .addTo(map);

            marker.on('dragend', () => {
              const newLngLat = marker.getLngLat();
              const newGeoJSON = {
                ...geoJSONRef.current,
                features: geoJSONRef.current.features.map((f: any) => {
                  if (f.id === feature.id) {
                    const newCoords = [...f.geometry.coordinates];
                    const newRing = [...newCoords[ringIndex]];
                    newRing[index] = [newLngLat.lng, newLngLat.lat];
                    newRing[newRing.length - 1] = newRing[0];
                    newCoords[ringIndex] = newRing;
                    return {
                      ...f,
                      geometry: {
                        ...f.geometry,
                        coordinates: newCoords,
                      },
                    };
                  }
                  return f;
                }),
              };
              setGeoJSON(newGeoJSON);
              triggerGeoJSONSave(newGeoJSON);
            });

            vertexMarkersRef.current.push({ marker, featureId: feature.id, polygonIndex: 0, ringIndex, vertexIndex: index });
          });
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: number[][][][], polygonIndex: number) => {
          polygon.forEach((ring: number[][][], ringIndex: number) => {
            (ring as unknown as [number, number][]).slice(0, -1).forEach((coord: [number, number], index: number) => {
              const el = createVertexElement(isActive);
              const marker = new maplibregl.Marker({
                element: el,
                draggable: true,
              })
                .setLngLat(coord)
                .addTo(map);

              marker.on('dragend', () => {
                const newLngLat = marker.getLngLat();
                const newGeoJSON = {
                  ...geoJSONRef.current,
                  features: geoJSONRef.current.features.map((f: any) => {
                    if (f.id === feature.id) {
                      const newPolygons = [...f.geometry.coordinates];
                      const newPolygon = [...newPolygons[polygonIndex]];
                      const newRing = [...newPolygon[ringIndex]];
                      newRing[index] = [newLngLat.lng, newLngLat.lat];
                      newRing[newRing.length - 1] = newRing[0];
                      newPolygon[ringIndex] = newRing;
                      newPolygons[polygonIndex] = newPolygon;
                      return {
                        ...f,
                        geometry: {
                          ...f.geometry,
                          coordinates: newPolygons,
                        },
                      };
                    }
                    return f;
                  }),
                };
                setGeoJSON(newGeoJSON);
                triggerGeoJSONSave(newGeoJSON);
              });

              vertexMarkersRef.current.push({ marker, featureId: feature.id, polygonIndex, ringIndex, vertexIndex: index });
            });
          });
        });
      }
    });
  }, []);

  const createVertexElement = (isActive: boolean) => {
    const el = document.createElement('div');
    el.style.width = isActive ? '18px' : '14px';
    el.style.height = isActive ? '18px' : '14px';
    el.style.backgroundColor = '#fff';
    el.style.borderRadius = '50%';
    el.style.border = isActive ? '3px solid #f44336' : '2px solid #1976d2';
    el.style.boxShadow = isActive ? '0 0 0 2px rgba(244, 67, 54, 0.4)' : '0 1px 4px rgba(0,0,0,0.3)';
    el.style.cursor = 'move';
    el.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
    return el;
  };

  const updatePreview = useCallback((map: maplibregl.Map, coords: [number, number][]) => {
    if (map.getSource('drawing-preview')) {
      map.removeLayer('drawing-preview-line');
      map.removeLayer('drawing-preview-points');
      map.removeSource('drawing-preview');
    }

    if (coords.length === 0) return;

    const type = drawingTypeRef.current;
    const geometry = type === 'polygon'
      ? { type: 'Polygon', coordinates: coords.length >= 3 ? [[...coords, coords[0]]] : [coords] }
      : { type: 'LineString', coordinates: coords };

    // Add Point features for each vertex so the circle layer can render them
    const pointFeatures = coords.map((coord, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coord },
      properties: { index: i },
    }));

    const previewGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry,
          properties: {},
        },
        ...pointFeatures,
      ],
    };

    map.addSource('drawing-preview', {
      type: 'geojson',
      data: previewGeoJSON as any,
    });

    if (type === 'polygon') {
      map.addLayer({
        id: 'drawing-preview-line',
        type: 'fill',
        source: 'drawing-preview',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#1976d2',
          'fill-opacity': 0.2,
        },
      });
      map.addLayer({
        id: 'drawing-preview-points',
        type: 'circle',
        source: 'drawing-preview',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#1976d2',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    } else {
      map.addLayer({
        id: 'drawing-preview-line',
        type: 'line',
        source: 'drawing-preview',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#1976d2',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });
      map.addLayer({
        id: 'drawing-preview-points',
        type: 'circle',
        source: 'drawing-preview',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#1976d2',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    }
  }, []);

  const clearPreview = useCallback((map: maplibregl.Map) => {
    if (map.getSource('drawing-preview')) {
      try { map.removeLayer('drawing-preview-line'); } catch (e) {}
      try { map.removeLayer('drawing-preview-line-string'); } catch (e) {}
      try { map.removeLayer('drawing-preview-points'); } catch (e) {}
      map.removeSource('drawing-preview');
    }
  }, []);

  const updatePreviewForMultiPolygon = useCallback((map: maplibregl.Map) => {
    if (map.getSource('drawing-preview')) {
      try { map.removeLayer('drawing-preview-line'); } catch (e) {}
      try { map.removeLayer('drawing-preview-line-string'); } catch (e) {}
      try { map.removeLayer('drawing-preview-points'); } catch (e) {}
      map.removeSource('drawing-preview');
    }

    const currentPolygons = multiPolygonsRef.current;
    const currentPolygonId = currentPolygonIdRef.current;
    const currentPolygon = currentPolygons.find((p) => p.id === currentPolygonId);

    if (currentPolygons.length === 0 && (!currentPolygon || currentPolygon.coords.length === 0)) return;

    // Build all completed polygons + current one
    const features: any[] = [];
    const pointFeatures: any[] = [];
    
    for (const polygon of currentPolygons) {
      if (polygon.coords.length === 0) continue;
      
      const isCurrent = polygon.id === currentPolygonId;
      const coords = polygon.coords;
      
      // Add point features for each vertex
      coords.forEach((coord, i) => {
        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
          properties: { index: i },
        });
      });
      
      if (coords.length >= 3) {
        const closed = [...coords, coords[0]];
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [closed] },
          properties: { isCurrent, isHole: polygon.isHole },
        });
      } else if (coords.length > 0) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { isCurrent },
        });
      }
    }

    if (features.length === 0 && pointFeatures.length === 0) return;

    const previewGeoJSON = {
      type: 'FeatureCollection',
      features: [...features, ...pointFeatures],
    };

    map.addSource('drawing-preview', {
      type: 'geojson',
      data: previewGeoJSON as any,
    });

    map.addLayer({
      id: 'drawing-preview-line',
      type: 'fill',
      source: 'drawing-preview',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': ['case', ['get', 'isHole'], '#fdd835', '#1976d2'],
        'fill-opacity': ['case', ['get', 'isHole'], 0.35, 0.2],
      },
    });
    map.addLayer({
      id: 'drawing-preview-line-string',
      type: 'line',
      source: 'drawing-preview',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#1976d2',
        'line-width': 3,
        'line-dasharray': [2, 2],
      },
    });
    map.addLayer({
      id: 'drawing-preview-points',
      type: 'circle',
      source: 'drawing-preview',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': '#1976d2',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }, []);

  const updatePreviewForMultiLine = useCallback((map: maplibregl.Map) => {
    if (map.getSource('drawing-preview')) {
      try { map.removeLayer('drawing-preview-line'); } catch (e) {}
      try { map.removeLayer('drawing-preview-points'); } catch (e) {}
      map.removeSource('drawing-preview');
    }

    const currentLines = multiLinesRef.current;
    const currentLineId = currentLineIdRef.current;

    if (currentLines.length === 0) return;

    const features: any[] = [];
    const pointFeatures: any[] = [];

    for (const line of currentLines) {
      if (line.coords.length === 0) continue;

      const isCurrent = line.id === currentLineId;

      // Add point features for each vertex
      line.coords.forEach((coord, i) => {
        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
          properties: { index: i },
        });
      });

      if (line.coords.length >= 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: line.coords },
          properties: { isCurrent },
        });
      }
    }

    if (features.length === 0 && pointFeatures.length === 0) return;

    const previewGeoJSON = {
      type: 'FeatureCollection',
      features: [...features, ...pointFeatures],
    };

    map.addSource('drawing-preview', {
      type: 'geojson',
      data: previewGeoJSON as any,
    });

    map.addLayer({
      id: 'drawing-preview-line',
      type: 'line',
      source: 'drawing-preview',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#1976d2',
        'line-width': 3,
        'line-dasharray': [2, 2],
      },
    });
    map.addLayer({
      id: 'drawing-preview-points',
      type: 'circle',
      source: 'drawing-preview',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 5,
        'circle-color': '#1976d2',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }, []);

  const triggerGeoJSONSave = useCallback((newGeoJSON: any) => {
    const map = mapRef.current;
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();
    const bounds = map.getBounds();

    const newViewport = {
      latitude: center.lat,
      longitude: center.lng,
      zoom,
      pitch,
      bearing,
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
    };

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveRef.current(newViewport, undefined, newGeoJSON);
    }, 1500);
  }, []);

  const handleChangeDrawMode = (mode: DrawMode) => {
    const map = mapRef.current;
    if (mode === 'draw_line_string') {
      setDrawMode(mode);
      setIsDrawing(true);
      drawingTypeRef.current = 'line';
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      handleSelectFeature(null);
    } else if (mode === 'draw_polygon') {
      setDrawMode(mode);
      setIsDrawing(true);
      drawingTypeRef.current = 'polygon';
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      handleSelectFeature(null);
    } else if (mode === 'draw_point') {
      setDrawMode(mode);
      setIsDrawing(true);
      drawingTypeRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      handleSelectFeature(null);
    } else if (mode === 'draw_multi_polygon') {
      setDrawMode(mode);
      setIsDrawing(true);
      drawingTypeRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      const firstId = generateFeatureId();
      setMultiPolygons([{ id: firstId, coords: [], isHole: false }]);
      multiPolygonsRef.current = [{ id: firstId, coords: [], isHole: false }];
      setCurrentPolygonId(firstId);
      currentPolygonIdRef.current = firstId;
      handleSelectFeature(null);
    } else if (mode === 'draw_multi_line') {
      setDrawMode(mode);
      setIsDrawing(true);
      drawingTypeRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      const firstId = generateFeatureId();
      setMultiLines([{ id: firstId, coords: [] }]);
      multiLinesRef.current = [{ id: firstId, coords: [] }];
      setCurrentLineId(firstId);
      currentLineIdRef.current = firstId;
      handleSelectFeature(null);
    } else {
      // simple_select
      setDrawMode(mode);
      setIsDrawing(false);
      drawingTypeRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      setMultiPolygons([]);
      multiPolygonsRef.current = [];
      setCurrentPolygonId(null);
      currentPolygonIdRef.current = null;
      setMultiLines([]);
      multiLinesRef.current = [];
      setCurrentLineId(null);
      currentLineIdRef.current = null;
      if (map) clearPreview(map);
    }
  };

  const handleAddMultiPolygon = () => {
    const map = mapRef.current;
    const currentPolygons = multiPolygonsRef.current;
    const currentPolygonId = currentPolygonIdRef.current;
    const currentPolygon = currentPolygons.find((p) => p.id === currentPolygonId);
    
    if (!currentPolygon || currentPolygon.coords.length < 3) return;

    const newId = generateFeatureId();
    const newPolygons = [...currentPolygons, { id: newId, coords: [], isHole: false }];
    setMultiPolygons(newPolygons);
    multiPolygonsRef.current = newPolygons;
    setCurrentPolygonId(newId);
    currentPolygonIdRef.current = newId;
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    if (map) updatePreviewForMultiPolygon(map);
  };

  const handleAddHole = () => {
    const map = mapRef.current;
    const currentPolygons = multiPolygonsRef.current;
    const currentPolygonId = currentPolygonIdRef.current;
    const currentPolygon = currentPolygons.find((p) => p.id === currentPolygonId);
    
    if (!currentPolygon || currentPolygon.coords.length < 3) return;

    const newId = generateFeatureId();
    const newPolygons = [...currentPolygons, { id: newId, coords: [], isHole: true }];
    setMultiPolygons(newPolygons);
    multiPolygonsRef.current = newPolygons;
    setCurrentPolygonId(newId);
    currentPolygonIdRef.current = newId;
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    if (map) updatePreviewForMultiPolygon(map);
  };

  const handleRemoveMultiPolygon = (id: string) => {
    const map = mapRef.current;
    const currentPolygons = multiPolygonsRef.current;
    const newPolygons = currentPolygons.filter((p) => p.id !== id);
    
    if (newPolygons.length === 0) {
      setMultiPolygons([]);
      multiPolygonsRef.current = [];
      setCurrentPolygonId(null);
      currentPolygonIdRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      if (map) clearPreview(map);
      return;
    }
    
    setMultiPolygons(newPolygons);
    multiPolygonsRef.current = newPolygons;
    
    if (currentPolygonIdRef.current === id) {
      const lastPolygon = newPolygons[newPolygons.length - 1];
      setCurrentPolygonId(lastPolygon.id);
      currentPolygonIdRef.current = lastPolygon.id;
      setDrawingCoords(lastPolygon.coords);
      drawingCoordsRef.current = lastPolygon.coords;
    }
    
    if (map) {
      updatePreviewForMultiPolygon(map);
    }
  };

  const handleFinishMultiPolygon = () => {
    const map = mapRef.current;
    const currentPolygons = multiPolygonsRef.current;
    const currentGeoJSON = geoJSONRef.current;

    if (currentPolygons.length === 0) return;

    // Build MultiPolygon coordinates
    const polygons: [number, number][][][] = [];
    let currentRings: [number, number][][] = [];
    
    for (const polygon of currentPolygons) {
      if (polygon.coords.length < 3) continue;
      
      const closed = [...polygon.coords, polygon.coords[0]];
      
      if (polygon.isHole) {
        // Add as a hole to the last polygon
        if (currentRings.length > 0) {
          currentRings.push(closed);
        }
      } else {
        // If we have a previous polygon, save it
        if (currentRings.length > 0) {
          polygons.push([...currentRings]);
        }
        // Start a new polygon
        currentRings = [closed];
      }
    }
    
    // Save the last polygon
    if (currentRings.length > 0) {
      polygons.push([...currentRings]);
    }

    if (polygons.length === 0) return;

    const typeCount = currentGeoJSON.features.filter((f: any) => f.geometry.type === 'MultiPolygon').length;
    const newFeature = {
      type: 'Feature',
      id: generateFeatureId(),
      geometry: {
        type: 'MultiPolygon',
        coordinates: polygons,
      },
      properties: {
        name: getDefaultName('MultiPolygon', typeCount),
        style: { color: '#1976d2', fillOpacity: 0.3, strokeWidth: 2 },
      },
    };

    const newGeoJSON = {
      ...currentGeoJSON,
      features: [...currentGeoJSON.features, newFeature],
    };
    geoJSONRef.current = newGeoJSON;
    setGeoJSON(newGeoJSON);
    triggerGeoJSONSave(newGeoJSON);

    if (map) {
      const source = map.getSource('geojson-features') as maplibregl.GeoJSONSource;
      if (source) source.setData(newGeoJSON);
      addGeoJSONLayers(map);
      syncVertexMarkers(map);
    }

    if (map) clearPreview(map);
    setIsDrawing(false);
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    setMultiPolygons([]);
    multiPolygonsRef.current = [];
    setCurrentPolygonId(null);
    currentPolygonIdRef.current = null;
    setDrawMode('simple_select');
  };

  const handleAddMultiLine = () => {
    const map = mapRef.current;
    const currentLines = multiLinesRef.current;
    const currentLineId = currentLineIdRef.current;
    const currentLine = currentLines.find((l) => l.id === currentLineId);

    if (!currentLine || currentLine.coords.length < 2) return;

    const newId = generateFeatureId();
    const newLines = [...currentLines, { id: newId, coords: [] }];
    setMultiLines(newLines);
    multiLinesRef.current = newLines;
    setCurrentLineId(newId);
    currentLineIdRef.current = newId;
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    if (map) updatePreviewForMultiLine(map);
  };

  const handleRemoveMultiLine = (id: string) => {
    const map = mapRef.current;
    const currentLines = multiLinesRef.current;
    const newLines = currentLines.filter((l) => l.id !== id);

    if (newLines.length === 0) {
      setMultiLines([]);
      multiLinesRef.current = [];
      setCurrentLineId(null);
      currentLineIdRef.current = null;
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      if (map) clearPreview(map);
      return;
    }

    setMultiLines(newLines);
    multiLinesRef.current = newLines;

    if (currentLineIdRef.current === id) {
      const lastLine = newLines[newLines.length - 1];
      setCurrentLineId(lastLine.id);
      currentLineIdRef.current = lastLine.id;
      setDrawingCoords(lastLine.coords);
      drawingCoordsRef.current = lastLine.coords;
    }

    if (map) {
      updatePreviewForMultiLine(map);
    }
  };

  const handleFinishMultiLine = () => {
    const map = mapRef.current;
    const currentLines = multiLinesRef.current;
    const currentGeoJSON = geoJSONRef.current;

    if (currentLines.length === 0) return;

    const lines: [number, number][][] = [];
    for (const line of currentLines) {
      if (line.coords.length >= 2) {
        lines.push(line.coords);
      }
    }

    if (lines.length === 0) return;

    const typeCount = currentGeoJSON.features.filter((f: any) => f.geometry.type === 'MultiLineString').length;
    const newFeature = {
      type: 'Feature',
      id: generateFeatureId(),
      geometry: {
        type: 'MultiLineString',
        coordinates: lines,
      },
      properties: {
        name: getDefaultName('MultiLineString', typeCount),
        style: { color: '#1976d2', strokeWidth: 3 },
      },
    };

    const newGeoJSON = {
      ...currentGeoJSON,
      features: [...currentGeoJSON.features, newFeature],
    };
    geoJSONRef.current = newGeoJSON;
    setGeoJSON(newGeoJSON);
    triggerGeoJSONSave(newGeoJSON);

    if (map) {
      const source = map.getSource('geojson-features') as maplibregl.GeoJSONSource;
      if (source) source.setData(newGeoJSON);
      addGeoJSONLayers(map);
      syncVertexMarkers(map);
    }

    if (map) clearPreview(map);
    setIsDrawing(false);
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    setMultiLines([]);
    multiLinesRef.current = [];
    setCurrentLineId(null);
    currentLineIdRef.current = null;
    setDrawMode('simple_select');
  };

  const handleFinish = () => {
    const map = mapRef.current;
    const currentCoords = drawingCoordsRef.current;
    const currentType = drawingTypeRef.current;
    const currentGeoJSON = geoJSONRef.current;

    if (!currentType || currentCoords.length === 0) {
      if (map) clearPreview(map);
      setIsDrawing(false);
      setDrawingCoords([]);
      drawingCoordsRef.current = [];
      setDrawMode('simple_select');
      return;
    }

    let newFeature;
    const typeCount = currentGeoJSON.features.filter((f: any) => f.geometry.type === (currentType === 'line' ? 'LineString' : 'Polygon')).length;

    if (currentType === 'line' && currentCoords.length >= 2) {
      newFeature = {
        type: 'Feature',
        id: generateFeatureId(),
        geometry: {
          type: 'LineString',
          coordinates: currentCoords,
        },
        properties: {
          name: getDefaultName('LineString', typeCount),
          style: { color: '#1976d2', strokeWidth: 3 },
        },
      };
    } else if (currentType === 'polygon' && currentCoords.length >= 3) {
      const closed = [...currentCoords, currentCoords[0]];
      newFeature = {
        type: 'Feature',
        id: generateFeatureId(),
        geometry: {
          type: 'Polygon',
          coordinates: [closed],
        },
        properties: {
          name: getDefaultName('Polygon', typeCount),
          style: { color: '#1976d2', fillOpacity: 0.3, strokeWidth: 2 },
        },
      };
    }

    if (newFeature) {
      const newGeoJSON = {
        ...currentGeoJSON,
        features: [...currentGeoJSON.features, newFeature],
      };
      geoJSONRef.current = newGeoJSON;
      setGeoJSON(newGeoJSON);
      triggerGeoJSONSave(newGeoJSON);

      if (map) {
        const source = map.getSource('geojson-features') as maplibregl.GeoJSONSource;
        if (source) source.setData(newGeoJSON);
        addGeoJSONLayers(map);
        syncVertexMarkers(map);
      }
    }

    if (map) clearPreview(map);
    setIsDrawing(false);
    setDrawingCoords([]);
    drawingCoordsRef.current = [];
    drawingTypeRef.current = null;
    setDrawMode('simple_select');
  };

  const handleUpdateFeature = (updatedFeature: any) => {
    const currentGeoJSON = geoJSONRef.current;
    const newGeoJSON = {
      ...currentGeoJSON,
      features: currentGeoJSON.features.map((f: any) =>
        f.id === updatedFeature.id ? updatedFeature : f
      ),
    };
    geoJSONRef.current = newGeoJSON;
    setGeoJSON(newGeoJSON);
    triggerGeoJSONSave(newGeoJSON);

    const map = mapRef.current;
    if (map) {
      const source = map.getSource('geojson-features') as maplibregl.GeoJSONSource;
      if (source) source.setData(newGeoJSON);
      addGeoJSONLayers(map);
      syncMarkers(map);
      syncVertexMarkers(map);
    }
  };

  const handleAddAssociation = (item: { type: 'artifact' | 'asset'; id: string; name: string; kind?: string; mime_type?: string; is_image?: boolean; public_magic_id?: string | null }) => {
    const currentSelectedId = selectedFeatureIdRef.current;
    console.log('[handleAddAssociation] selectedFeatureIdRef.current:', currentSelectedId);
    if (!currentSelectedId) {
      console.log('[handleAddAssociation] returning early because selectedFeatureIdRef.current is null');
      return;
    }

    const currentGeoJSON = geoJSONRef.current;
    const targetFeature = currentGeoJSON.features.find((f: any) => f.id === currentSelectedId);
    console.log('[handleAddAssociation] targetFeature:', targetFeature?.geometry?.type, targetFeature?.properties?.name);

    const newGeoJSON = {
      ...currentGeoJSON,
      features: currentGeoJSON.features.map((f: any) => {
        if (f.id === currentSelectedId) {
          const associations = f.properties?.associations || [];
          return {
            ...f,
            properties: {
              ...f.properties,
              associations: [...associations, item],
            },
          };
        }
        return f;
      }),
    };
    setGeoJSON(newGeoJSON);
    triggerGeoJSONSave(newGeoJSON);
  };

  const handleRemoveAssociation = (featureId: string, associationId: string) => {
    const currentGeoJSON = geoJSONRef.current;
    const newGeoJSON = {
      ...currentGeoJSON,
      features: currentGeoJSON.features.map((f: any) => {
        if (f.id === featureId) {
          const associations = f.properties?.associations || [];
          return {
            ...f,
            properties: {
              ...f.properties,
              associations: associations.filter((a: any) => a.id !== associationId),
            },
          };
        }
        return f;
      }),
    };
    setGeoJSON(newGeoJSON);
    triggerGeoJSONSave(newGeoJSON);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(style),
      center: [initialViewport.longitude, initialViewport.latitude],
      zoom: initialViewport.zoom,
      pitch: initialViewport.pitch,
      bearing: initialViewport.bearing,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const deckOverlay = new MapboxOverlay({
      layers: [],
    });
    map.addControl(deckOverlay);

    map.once('style.load', () => {
      addGeoJSONLayers(map);
      syncMarkers(map);
      syncVertexMarkers(map);
    });

    map.on('click', (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      const currentMode = drawModeRef.current;
      const currentGeoJSON = geoJSONRef.current;

      if (currentMode === 'draw_point') {
        const pointCount = currentGeoJSON.features.filter((f: any) => f.geometry.type === 'Point').length;
        const newFeature = {
          type: 'Feature',
          id: generateFeatureId(),
          geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          properties: {
            name: getDefaultName('Point', pointCount),
            style: { color: '#1976d2' },
          },
        };
        const newGeoJSON = {
          ...currentGeoJSON,
          features: [...currentGeoJSON.features, newFeature],
        };
        setGeoJSON(newGeoJSON);
        setIsDrawing(false);
        setDrawMode('simple_select');
        triggerGeoJSONSave(newGeoJSON);
      } else if (currentMode === 'draw_line_string') {
        const newCoords: [number, number][] = [...drawingCoordsRef.current, [lng, lat]];
        drawingCoordsRef.current = newCoords;
        setDrawingCoords(newCoords);
        updatePreview(map, newCoords);
      } else if (currentMode === 'draw_polygon') {
        const newCoords: [number, number][] = [...drawingCoordsRef.current, [lng, lat]];
        drawingCoordsRef.current = newCoords;
        setDrawingCoords(newCoords);
        updatePreview(map, newCoords);
      } else if (currentMode === 'draw_multi_polygon') {
        const currentPolygonId = currentPolygonIdRef.current;
        const currentPolygons = multiPolygonsRef.current;
        const currentPolygon = currentPolygons.find((p) => p.id === currentPolygonId);

        if (currentPolygon) {
          const newCoords: [number, number][] = [...currentPolygon.coords, [lng, lat]];
          const newPolygons = currentPolygons.map((p) =>
            p.id === currentPolygonId ? { ...p, coords: newCoords } : p
          );
          multiPolygonsRef.current = newPolygons;
          setMultiPolygons(newPolygons);
          setDrawingCoords(newCoords);
          drawingCoordsRef.current = newCoords;
          updatePreviewForMultiPolygon(map);
        }
      } else if (currentMode === 'draw_multi_line') {
        const currentLineId = currentLineIdRef.current;
        const currentLines = multiLinesRef.current;
        const currentLine = currentLines.find((l) => l.id === currentLineId);

        if (currentLine) {
          const newCoords: [number, number][] = [...currentLine.coords, [lng, lat]];
          const newLines = currentLines.map((l) =>
            l.id === currentLineId ? { ...l, coords: newCoords } : l
          );
          multiLinesRef.current = newLines;
          setMultiLines(newLines);
          setDrawingCoords(newCoords);
          drawingCoordsRef.current = newCoords;
          updatePreviewForMultiLine(map);
        }
      } else if (currentMode === 'simple_select') {
        // Only deselect if the click was not on a marker (point geometry)
        const target = e.originalEvent?.target as HTMLElement;
        const isMarkerClick = !!target?.closest('.maplibregl-marker');
        console.log('[Map click] simple_select mode, target:', target?.className, 'isMarkerClick:', isMarkerClick);
        if (!isMarkerClick) {
          console.log('[Map click] deselecting');
          handleSelectFeature(null);
        } else {
          console.log('[Map click] ignoring marker click');
        }
      }
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const pitch = map.getPitch();
      const bearing = map.getBearing();
      const bounds = map.getBounds();

      const newViewport = {
        latitude: center.lat,
        longitude: center.lng,
        zoom,
        pitch,
        bearing,
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      };

      setCurrentViewport({
        latitude: center.lat,
        longitude: center.lng,
        zoom,
        pitch,
        bearing,
      });

      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveRef.current(newViewport);
      }, 1500);
    });

    setCurrentViewport({
      latitude: initialViewport.latitude,
      longitude: initialViewport.longitude,
      zoom: initialViewport.zoom,
      pitch: initialViewport.pitch,
      bearing: initialViewport.bearing,
    });

    lastSavedViewport.current = JSON.stringify(initialViewport);
    lastSavedStyle.current = style;
    lastSavedGeoJSON.current = JSON.stringify(geoJSON);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      vertexMarkersRef.current.forEach((v) => v.marker.remove());
      vertexMarkersRef.current = [];
      if (map.getLayer('highlighted-points')) map.removeLayer('highlighted-points');
      if (map.getLayer('highlighted-polygons-outline')) map.removeLayer('highlighted-polygons-outline');
      if (map.getSource('highlighted-features')) map.removeSource('highlighted-features');
      if (map.getLayer('geojson-holes-fill')) map.removeLayer('geojson-holes-fill');
      if (map.getSource('geojson-holes')) map.removeSource('geojson-holes');
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      syncMarkers(map);
      syncVertexMarkers(map);
      const source = map.getSource('geojson-features') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(geoJSON);
      }
    }
  }, [geoJSON, selectedFeatureId, hoveredFeatureId, syncMarkers, syncVertexMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const activeId = hoveredFeatureId || selectedFeatureId;
    const highlightSource = map.getSource('highlighted-features') as maplibregl.GeoJSONSource;
    if (!highlightSource) return;

    if (activeId) {
      const feature = geoJSONRef.current.features.find((f: any) => f.id === activeId);
      if (feature) {
        highlightSource.setData({
          type: 'FeatureCollection',
          features: [feature],
        });
      } else {
        highlightSource.setData({ type: 'FeatureCollection', features: [] });
      }
    } else {
      highlightSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [hoveredFeatureId, selectedFeatureId, geoJSON]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, px: 2, pt: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TextField
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            variant="standard"
            fullWidth
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '1.5rem',
                fontWeight: 600,
              },
            }}
          />
          <TextField
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            onBlur={handleDescriptionBlur}
            variant="standard"
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            placeholder="Map description..."
            sx={{
              mt: 0.5,
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                color: 'text.secondary',
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, pt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setShowSettingsDialog(true)}
            sx={{ transition: 'all 0.2s ease' }}
          >
            <SettingsIcon />
          </IconButton>
          {saving && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Saving...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <Box
            ref={mapContainerRef}
            sx={{ position: 'absolute', inset: 0, borderRadius: 1, overflow: 'hidden' }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
            }}
          >
            <MapDrawToolbar
              activeMode={drawMode}
              isDrawing={isDrawing}
              onChangeMode={handleChangeDrawMode}
              onFinish={handleFinish}
            />
          </Box>
          {drawMode === 'draw_multi_polygon' && (
            <Box
              sx={{
                position: 'absolute',
                left: 64,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
              }}
            >
              <MultiPolygonPanel
                polygons={multiPolygons}
                currentPolygonId={currentPolygonId}
                onAddPolygon={handleAddMultiPolygon}
                onAddHole={handleAddHole}
                onRemovePolygon={handleRemoveMultiPolygon}
                onFinish={handleFinishMultiPolygon}
                onCancel={() => {
                  const map = mapRef.current;
                  if (map) clearPreview(map);
                  setIsDrawing(false);
                  setDrawingCoords([]);
                  drawingCoordsRef.current = [];
                  setMultiPolygons([]);
                  multiPolygonsRef.current = [];
                  setCurrentPolygonId(null);
                  currentPolygonIdRef.current = null;
                  setDrawMode('simple_select');
                }}
              />
            </Box>
          )}
          {drawMode === 'draw_multi_line' && (
            <Box
              sx={{
                position: 'absolute',
                left: 64,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
              }}
            >
              <MultiLinePanel
                lines={multiLines}
                currentLineId={currentLineId}
                onAddLine={handleAddMultiLine}
                onRemoveLine={handleRemoveMultiLine}
                onFinish={handleFinishMultiLine}
                onCancel={() => {
                  const map = mapRef.current;
                  if (map) clearPreview(map);
                  setIsDrawing(false);
                  setDrawingCoords([]);
                  drawingCoordsRef.current = [];
                  setMultiLines([]);
                  multiLinesRef.current = [];
                  setCurrentLineId(null);
                  currentLineIdRef.current = null;
                  setDrawMode('simple_select');
                }}
              />
            </Box>
          )}
          {isDrawing && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {drawMode === 'draw_point' && 'Click on map to add point'}
              {drawMode === 'draw_line_string' && `Click to add points (${drawingCoords.length} placed)`}
              {drawMode === 'draw_polygon' && `Click to add points (${drawingCoords.length} placed)`}
              {drawMode === 'draw_multi_polygon' && (() => {
                const currentPolygon = multiPolygons.find((p) => p.id === currentPolygonId);
                const polygonIndex = multiPolygons.findIndex((p) => p.id === currentPolygonId);
                const pointCount = currentPolygon?.coords.length || 0;
                return currentPolygon?.isHole
                  ? `Drawing hole (Polygon ${polygonIndex + 1}) - ${pointCount} points`
                  : `Drawing Polygon ${polygonIndex + 1} - ${pointCount} points`;
              })()}
              {drawMode === 'draw_multi_line' && (() => {
                const currentLine = multiLines.find((l) => l.id === currentLineId);
                const lineIndex = multiLines.findIndex((l) => l.id === currentLineId);
                const pointCount = currentLine?.coords.length || 0;
                return `Drawing Line ${lineIndex + 1} - ${pointCount} points`;
              })()}
            </Box>
          )}
        </Box>

        {/* Geometry Sidebar */}
        {geoJSON.features.length > 0 && (
          <MapGeometryPanel
            features={geoJSON.features}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={handleSelectFeature}
            onHoverFeature={setHoveredFeatureId}
            onUpdateFeature={handleUpdateFeature}
            onDeleteFeature={(id) => {
              const currentGeoJSON = geoJSONRef.current;
              const newGeoJSON = {
                ...currentGeoJSON,
                features: currentGeoJSON.features.filter((f: any) => f.id !== id),
              };
              if (selectedFeatureId === id) handleSelectFeature(null);
              if (hoveredFeatureId === id && selectedFeatureId !== id) setHoveredFeatureId(null);
              setGeoJSON(newGeoJSON);
              triggerGeoJSONSave(newGeoJSON);
            }}
            onAddAssociation={() => setShowAssociationExplorer(true)}
            onRemoveAssociation={handleRemoveAssociation}
          />
        )}
      </Box>

      {/* Settings Dialog */}
      <MapSettingsDialog
        open={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        style={style}
        onStyleChange={handleStyleChange}
        viewport={currentViewport}
      />

      {/* Association Explorer */}
      <AssociationExplorer
        open={showAssociationExplorer}
        onClose={() => setShowAssociationExplorer(false)}
        onSelect={handleAddAssociation}
      />
    </Box>
  );
}
