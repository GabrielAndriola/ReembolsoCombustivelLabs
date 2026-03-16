export interface StateOption {
  id: number;
  abbreviation: string;
  name: string;
}

export interface CityOption {
  id: number;
  name: string;
}

export interface CepLookupResult {
  zipCode: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const IBGE_API_BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';
const VIACEP_API_BASE_URL = 'https://viacep.com.br/ws';

const statesCache = new Map<string, StateOption[]>();
const citiesCache = new Map<string, CityOption[]>();
const neighborhoodsCache = new Map<string, string[]>();

export const sanitizeCep = (value: string) => value.replace(/\D/g, '').slice(0, 8);

export const buildFormattedAddress = (address: {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}) => {
  const streetLine = [address.street, address.number].filter(Boolean).join(', ');
  const districtLine = [address.neighborhood, `${address.city}/${address.state}`].filter(Boolean).join(', ');
  return [streetLine, districtLine].filter(Boolean).join(' - ');
};

const ensureResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error('Nao foi possivel consultar o servico de enderecos.');
  }

  return response.json() as Promise<T>;
};

export const fetchStates = async () => {
  const cached = statesCache.get('all');

  if (cached) {
    return cached;
  }

  const response = await fetch(`${IBGE_API_BASE_URL}/estados?orderBy=nome`);
  const data = await ensureResponse<Array<{ id: number; sigla: string; nome: string }>>(response);
  const states = data.map((state) => ({
    id: state.id,
    abbreviation: state.sigla,
    name: state.nome
  }));

  statesCache.set('all', states);
  return states;
};

export const fetchCitiesByState = async (state: string) => {
  if (!state) {
    return [];
  }

  const stateKey = state.toUpperCase();
  const cached = citiesCache.get(stateKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(`${IBGE_API_BASE_URL}/estados/${stateKey}/municipios?orderBy=nome`);
  const data = await ensureResponse<Array<{ id: number; nome: string }>>(response);
  const cities = data.map((city) => ({
    id: city.id,
    name: city.nome
  }));

  citiesCache.set(stateKey, cities);
  return cities;
};

export const fetchAddressByCep = async (cep: string) => {
  const sanitizedCep = sanitizeCep(cep);

  if (sanitizedCep.length !== 8) {
    throw new Error('Informe um CEP com 8 digitos.');
  }

  const response = await fetch(`${VIACEP_API_BASE_URL}/${sanitizedCep}/json/`);
  const data = await ensureResponse<{
    cep?: string;
    logradouro?: string;
    complemento?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean;
  }>(response);

  if (data.erro) {
    throw new Error('CEP nao encontrado.');
  }

  return {
    zipCode: data.cep ?? sanitizedCep,
    street: data.logradouro ?? '',
    complement: data.complemento ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? ''
  } satisfies CepLookupResult;
};

export const fetchNeighborhoodsByAddress = async (params: {
  state: string;
  city: string;
  street: string;
}) => {
  const state = params.state.trim().toUpperCase();
  const city = params.city.trim();
  const street = params.street.trim();

  if (!state || city.length < 3 || street.length < 3) {
    return [];
  }

  const cacheKey = `${state}:${city.toLowerCase()}:${street.toLowerCase()}`;
  const cached = neighborhoodsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(`${VIACEP_API_BASE_URL}/${state}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`);
  const data = await ensureResponse<Array<{ bairro?: string }>>(response);
  const neighborhoods = [...new Set(
    data
      .map((item) => item.bairro?.trim() ?? '')
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, 'pt-BR'));

  neighborhoodsCache.set(cacheKey, neighborhoods);
  return neighborhoods;
};

export const mergeUniqueStrings = (values: Array<string | null | undefined>) =>
  [...new Set(values.map((value) => value?.trim() ?? '').filter(Boolean))];
