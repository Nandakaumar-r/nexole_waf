import React, { memo } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  ZoomableGroup
} from 'react-simple-maps';

// World map topography data - using a simplified world map
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

interface WorldMapProps {
  blockedCountries: string[];
  onCountryClick?: (countryCode: string) => void;
}

const WorldMap = ({ blockedCountries, onCountryClick }: WorldMapProps) => {
  return (
    <div className="w-full h-80 md:h-96 rounded-md overflow-hidden bg-slate-50 border">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
        }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => {
                const countryCode = geo.properties.iso_a2;
                const isBlocked = blockedCountries.includes(countryCode);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onCountryClick && onCountryClick(countryCode)}
                    style={{
                      default: {
                        fill: isBlocked ? '#ef4444' : '#D6D6DA',
                        outline: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 0.5,
                      },
                      hover: {
                        fill: isBlocked ? '#b91c1c' : '#99A1AC',
                        outline: 'none',
                        cursor: 'pointer',
                        stroke: '#FFFFFF',
                        strokeWidth: 0.5,
                      },
                      pressed: {
                        fill: isBlocked ? '#991b1b' : '#7D8797',
                        outline: 'none',
                        stroke: '#FFFFFF',
                        strokeWidth: 0.5,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(WorldMap);