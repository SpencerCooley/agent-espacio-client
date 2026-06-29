'use client';

import React, { useEffect, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ComposerViewMapProps {
  content: any;
  name: string;
  publicMagicId?: string;
  isPreview?: boolean;
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
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'osm', type: 'raster' as const, source: 'osm', minzoom: 0, maxzoom: 19 },
  ],
};

function getStyleUrl(mapStyle: string) {
  switch (mapStyle) {
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

function getFeatureColor(feature: any): string {
  return feature?.properties?.style?.color || '#1976d2';
}

function getFeatureFillOpacity(feature: any): number {
  return feature?.properties?.style?.fillOpacity ?? 0.3;
}

function getFeatureStrokeWidth(feature: any): number {
  return feature?.properties?.style?.strokeWidth ?? 2;
}

export default function ComposerViewMap({ content, name, publicMagicId, isPreview }: ComposerViewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const viewport = content?.viewport || {
    latitude: 20,
    longitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  };
  const style = content?.style || 'carto-voyager';

  const viewUrl = publicMagicId
    ? `/public/view/${publicMagicId}`
    : (isPreview ? window.location.pathname.replace('/preview', '') : undefined);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(style),
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
      // Disable zoom interactions
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      // Keep pan but restrict it
      dragPan: true,
      dragRotate: false,
      keyboard: false,
      // No attribution control (it takes space)
      attributionControl: false,
    });

    mapRef.current = map;

    const geojson = content?.geojson;
    if (geojson && geojson.features && geojson.features.length > 0) {
      const points = geojson.features.filter((f: any) => f.geometry?.type === 'Point');
      const linesAndPolygons = geojson.features.filter(
        (f: any) =>
          f.geometry?.type === 'LineString' ||
          f.geometry?.type === 'MultiLineString' ||
          f.geometry?.type === 'Polygon' ||
          f.geometry?.type === 'MultiPolygon'
      );

      map.once('style.load', () => {
        // Render points (simple circles, no interactivity)
        points.forEach((feature: any) => {
          const coords = feature.geometry.coordinates;
          const color = getFeatureColor(feature);

          const el = document.createElement('div');
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

          new maplibregl.Marker({ element: el })
            .setLngLat([coords[0], coords[1]])
            .addTo(map);
        });

        // Render lines and polygons (no interactivity)
        linesAndPolygons.forEach((feature: any) => {
          const id = `feature-${feature.id || Math.random().toString(36).substr(2, 9)}`;
          const sourceId = `${id}-source`;

          map.addSource(sourceId, {
            type: 'geojson',
            data: feature,
          });

          const geometryType = feature.geometry?.type;
          const color = getFeatureColor(feature);
          const fillOpacity = getFeatureFillOpacity(feature);
          const strokeWidth = getFeatureStrokeWidth(feature);

          if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
            map.addLayer({
              id: `${id}-fill`,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': color,
                'fill-opacity': fillOpacity,
              },
            });

            map.addLayer({
              id: `${id}-outline`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': strokeWidth,
              },
            });
          } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            map.addLayer({
              id: `${id}-line`,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': color,
                'line-width': strokeWidth,
              },
            });
          }
        });
      });
    }

    return () => {
      map.remove();
    };
  }, [content, viewport, style]);

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
        {name}
      </Typography>
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: 400,
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
      {viewUrl && (
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button
            size="small"
            endIcon={<OpenInNewIcon />}
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View full map
          </Button>
        </Box>
      )}
    </Box>
  );
}
