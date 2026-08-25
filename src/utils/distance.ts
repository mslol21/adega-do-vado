/**
 * Utilitário para cálculo de rotas de entrega e geocodificação de endereços/CEPs.
 */

export interface RouteResult {
  distanceKm: number;
  durationMinutes?: number;
  isRoadRoute: boolean;
}

/**
 * Calcula a distância geodésica em linha reta (fórmula de Haversine).
 */
export const calculateStraightDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio médio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Retorna estimativa por linha reta com fator de correção (para compatibilidade legada síncrona).
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const straight = calculateStraightDistanceKm(lat1, lon1, lat2, lon2);
  return Number((straight * 1.35).toFixed(2));
};

/**
 * Calcula a distância real de condução veicular por rotas de trânsito (OSRM / OpenStreetMap).
 * Retorna a distância exata em km e a duração estimada em minutos.
 */
export const calculateDrivingDistanceKm = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<RouteResult> => {
  // Se as coordenadas forem praticamente idênticas
  if (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001) {
    return { distanceKm: 0.1, durationMinutes: 1, isRoadRoute: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // OSRM espera formato lon,lat;lon,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Distância retornada pelo OSRM é em metros
        const distanceKm = Math.max(0.1, Number((route.distance / 1000).toFixed(2)));
        const durationMinutes = route.duration ? Math.round(route.duration / 60) : undefined;

        return {
          distanceKm,
          durationMinutes,
          isRoadRoute: true
        };
      }
    }
  } catch (err) {
    console.warn('Falha na API de rota OSRM, utilizando estimativa geodésica urbana:', err);
  }

  // Fallback seguro em caso de indisponibilidade da API de rotas
  const straight = calculateStraightDistanceKm(lat1, lon1, lat2, lon2);
  return {
    distanceKm: Math.max(0.1, Number((straight * 1.35).toFixed(2))),
    isRoadRoute: false
  };
};

/**
 * Busca coordenadas por endereço completo ou CEP, consultando múltiplos provedores.
 */
export const fetchCoordinatesByAddress = async (params: {
  cep: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): Promise<{ lat: number; lon: number } | null> => {
  const { cep, street, number, neighborhood, city, state } = params;

  // 1. Se tiver logradouro e cidade, tenta geocodificação precisa de endereço no Nominatim
  if (street && city) {
    try {
      const numberStr = number ? `${number}, ` : '';
      const neighborhoodStr = neighborhood ? `${neighborhood}, ` : '';
      const query = encodeURIComponent(`${street}, ${numberStr}${neighborhoodStr}${city} - ${state || 'SP'}, Brasil`);
      
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].lat && data[0].lon) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar coordenadas por logradouro:', e);
    }
  }

  // 2. Fallback para busca por CEP
  return fetchCoordinatesByCep(cep);
};

/**
 * Busca coordenadas geográficas pelo CEP (BrasilAPI v2 -> Nominatim -> ViaCEP).
 */
export const fetchCoordinatesByCep = async (cep: string): Promise<{ lat: number; lon: number } | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    // 1. Provedor principal: BrasilAPI v2
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (res.ok) {
      const data = await res.json();
      if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
        return {
          lat: parseFloat(data.location.coordinates.latitude),
          lon: parseFloat(data.location.coordinates.longitude)
        };
      }
    }

    // 2. Fallback OpenStreetMap Nominatim pelo código postal
    const resNominatim = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json&limit=1`
    );
    if (resNominatim.ok) {
      const dataNominatim = await resNominatim.json();
      if (dataNominatim && dataNominatim.length > 0 && dataNominatim[0].lat && dataNominatim[0].lon) {
        return {
          lat: parseFloat(dataNominatim[0].lat),
          lon: parseFloat(dataNominatim[0].lon)
        };
      }
    }

    // 3. Fallback ViaCEP + Nominatim por nome do logradouro
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepRes.ok) {
      const viaCepData = await viaCepRes.json();
      if (!viaCepData.erro && viaCepData.localidade) {
        const logradouroStr = viaCepData.logradouro ? `${viaCepData.logradouro}, ` : '';
        const q = encodeURIComponent(`${logradouroStr}${viaCepData.localidade} - ${viaCepData.uf || 'SP'}, Brasil`);
        const resAddress = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
        if (resAddress.ok) {
          const dataAddress = await resAddress.json();
          if (dataAddress && dataAddress.length > 0 && dataAddress[0].lat && dataAddress[0].lon) {
            return {
              lat: parseFloat(dataAddress[0].lat),
              lon: parseFloat(dataAddress[0].lon)
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao buscar coordenadas para o CEP:', err);
  }

  return null;
};
