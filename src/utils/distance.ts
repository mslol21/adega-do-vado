export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const distance = R * c;
  
  // Multiplicamos por 1.3 para estimar a distância real de ruas (fator de rota), em vez de linha reta
  return distance * 1.3;
};

export const fetchCoordinatesByCep = async (cep: string): Promise<{ lat: number, lon: number } | null> => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    // Usar BrasilAPI (v2) que retorna coordenadas
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

    // Fallback para OpenStreetMap Nominatim buscando pelo CEP
    const resNominatim = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=Brazil&format=json`);
    if (resNominatim.ok) {
      const dataNominatim = await resNominatim.json();
      if (dataNominatim && dataNominatim.length > 0) {
        return {
          lat: parseFloat(dataNominatim[0].lat),
          lon: parseFloat(dataNominatim[0].lon)
        };
      }
    }

    // Último recurso: Buscar logradouro via ViaCEP e depois buscar coordenada pelo endereço no Nominatim
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (viaCepRes.ok) {
      const viaCepData = await viaCepRes.json();
      if (!viaCepData.erro && viaCepData.localidade) {
        const logradouroStr = viaCepData.logradouro ? `${viaCepData.logradouro}, ` : '';
        const q = encodeURIComponent(`${logradouroStr}${viaCepData.localidade}, Brazil`);
        const resAddress = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json`);
        if (resAddress.ok) {
          const dataAddress = await resAddress.json();
          if (dataAddress && dataAddress.length > 0) {
            return {
              lat: parseFloat(dataAddress[0].lat),
              lon: parseFloat(dataAddress[0].lon)
            };
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching coordinates for CEP:", err);
  }

  return null;
};
