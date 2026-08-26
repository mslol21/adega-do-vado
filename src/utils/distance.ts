/**
 * Utilitário para cálculo de rotas de entrega e geocodificação de endereços/CEPs.
 */

export interface RouteResult {
  distanceKm: number;
  durationMinutes?: number;
  isRoadRoute: boolean;
}

const NOMINATIM_HEADERS = {
  'User-Agent': 'AdegaDoVadoDelivery/1.0 (delivery@adegadovado.com.br)',
  'Accept-Language': 'pt-BR'
};

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
 * Retorna estimativa por linha reta com fator de correção urbano (para compatibilidade legada síncrona).
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const straight = calculateStraightDistanceKm(lat1, lon1, lat2, lon2);
  return Number((straight * 1.3).toFixed(2));
};

/**
 * Calcula a rota de MENOR DISTÂNCIA veicular por ruas e avenidas reais (OSRM / OpenStreetMap).
 * Avalia todas as rotas alternativas disponíveis para encontrar a menor quilometragem viária.
 */
export const calculateDrivingDistanceKm = async (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<RouteResult> => {
  // Se as coordenadas forem praticamente idênticas (mesmo local/mesma rua)
  if (Math.abs(lat1 - lat2) < 0.0003 && Math.abs(lon1 - lon2) < 0.0003) {
    return { distanceKm: 0.1, durationMinutes: 1, isRoadRoute: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // OSRM com alternativas para encontrar o menor trajeto por ruas
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false&alternatives=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Seleciona a rota com a MENOR distância em metros entre as opções
        const shortestRoute = data.routes.reduce(
          (min: any, r: any) => (r.distance < min.distance ? r : min),
          data.routes[0]
        );

        const distanceKm = Math.max(0.1, Number((shortestRoute.distance / 1000).toFixed(2)));
        const durationMinutes = shortestRoute.duration ? Math.round(shortestRoute.duration / 60) : undefined;

        return {
          distanceKm,
          durationMinutes,
          isRoadRoute: true
        };
      }
    }
  } catch (err) {
    console.warn('Falha ou timeout na API de rotas OSRM, utilizando estimativa geodésica urbana:', err);
  }

  // Fallback seguro em caso de indisponibilidade da API de rotas
  const straight = calculateStraightDistanceKm(lat1, lon1, lat2, lon2);
  return {
    distanceKm: Math.max(0.1, Number((straight * 1.3).toFixed(2))),
    isRoadRoute: false
  };
};

/**
 * Calcula a taxa de entrega garantindo arredondamento limpo em reais.
 */
export const calculateDeliveryFee = (
  distanceKm: number | null | undefined,
  settings: {
    deliveryBaseFee?: number;
    deliveryFeePerKm?: number;
  }
): number => {
  if (distanceKm === null || distanceKm === undefined || distanceKm <= 0) return 0;
  const baseFee = Number(settings.deliveryBaseFee) || 0;
  const feePerKm = Number(settings.deliveryFeePerKm) || 0;
  const total = baseFee + feePerKm * distanceKm;
  return Number(total.toFixed(2));
};

/**
 * Busca coordenadas por endereço completo ou CEP com prioridade para precisão de rua.
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
        headers: NOMINATIM_HEADERS
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

  // 2. Fallback para busca precisa por CEP
  return fetchCoordinatesByCep(cep);
};

/**
 * Busca coordenadas geográficas precisas pelo CEP:
 * 1. AwesomeAPI (coordenadas reais específicas por logradouro)
 * 2. OpenStreetMap Nominatim (postalcode com User-Agent)
 * 3. BrasilAPI v2
 * 4. ViaCEP + Nominatim
 */
export const fetchCoordinatesByCep = async (cep: string): Promise<{ lat: number; lon: number } | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  // 1. Provedor Primário: AwesomeAPI CEP (muito preciso para ruas do Brasil)
  try {
    const resAwesome = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
    if (resAwesome.ok) {
      const dataAwesome = await resAwesome.json();
      if (dataAwesome.lat && dataAwesome.lng) {
        const lat = parseFloat(dataAwesome.lat);
        const lon = parseFloat(dataAwesome.lng);
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
          return { lat, lon };
        }
      }
    }
  } catch (e) {
    console.warn('AwesomeAPI falhou para o CEP, tentando provedores secundários:', e);
  }

  // 2. Provedor Secundário: OpenStreetMap Nominatim por código postal
  try {
    const resNominatim = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
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
  } catch (e) {
    console.warn('Nominatim postalcode falhou:', e);
  }

  // 3. Provedor Terciário: BrasilAPI v2
  try {
    const resBrasilApi = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
    if (resBrasilApi.ok) {
      const data = await resBrasilApi.json();
      if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
        return {
          lat: parseFloat(data.location.coordinates.latitude),
          lon: parseFloat(data.location.coordinates.longitude)
        };
      }
    }
  } catch (e) {
    console.warn('BrasilAPI v2 falhou:', e);
  }

  // 4. Fallback Final: ViaCEP + Nominatim
  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepRes.ok) {
      const viaCepData = await viaCepRes.json();
      if (!viaCepData.erro && viaCepData.localidade) {
        const logradouroStr = viaCepData.logradouro ? `${viaCepData.logradouro}, ` : '';
        const q = encodeURIComponent(`${logradouroStr}${viaCepData.localidade} - ${viaCepData.uf || 'SP'}, Brasil`);
        const resAddress = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
          { headers: NOMINATIM_HEADERS }
        );
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
