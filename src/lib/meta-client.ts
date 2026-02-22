/**
 * Meta Marketing API Client
 * 
 * Wrapper para a Graph API v21.0 do Meta (Facebook/Instagram Ads)
 * 
 * Documentação oficial:
 * - Graph API: https://developers.facebook.com/docs/graph-api
 * - Marketing API: https://developers.facebook.com/docs/marketing-api
 * - Configuração: https://developers.facebook.com/apps
 * 
 * Campos disponíveis nas métricas (insights):
 * - impressions, reach, clicks
 * - spend, cpm, cpc, ctr
 * - actions (conversões, leads, etc.)
 * 
 * @author Painel Tráfego Pago
 */

const META_API_VERSION = 'v21.0';
const META_API_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ============================================
// Tipos
// ============================================

export interface MetaCredentials {
  accessToken: string;
  adAccountId: string;  // formato: "act_123456789"
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  updated_time: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  targeting?: {
    age_min?: number;
    age_max?: number;
    genders?: number[];
    geo_locations?: {
      countries?: string[];
      cities?: Array<{ key: string; name: string }>;
    };
  };
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  creative?: {
    id: string;
    name?: string;
    thumbnail_url?: string;
    image_url?: string;
  };
  created_time: string;
}

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpm: string;
  cpc: string;
  ctr: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  fbtrace_id?: string;
}

// ============================================
// Cliente API
// ============================================

export class MetaClient {
  private accessToken: string;
  private adAccountId: string;

  constructor(credentials: MetaCredentials) {
    this.accessToken = credentials.accessToken;
    this.adAccountId = credentials.adAccountId;
    
    // Garantir formato correto do ad_account_id
    if (!this.adAccountId.startsWith('act_')) {
      this.adAccountId = `act_${this.adAccountId}`;
    }
  }

  /**
   * Faz requisição genérica para a Graph API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<MetaApiResponse<T>> {
    const url = new URL(`${META_API_BASE_URL}/${endpoint}`);
    url.searchParams.set('access_token', this.accessToken);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      throw new MetaApiErrorClass(data.error);
    }

    return data;
  }

  /**
   * Busca todas as páginas de uma requisição paginada
   */
  private async requestAllPages<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T[]> {
    const allData: T[] = [];
    let nextUrl: string | null = null;

    // Primeira requisição
    const firstResponse = await this.request<T>(endpoint, params);
    allData.push(...firstResponse.data);
    nextUrl = firstResponse.paging?.next || null;

    // Buscar páginas seguintes
    while (nextUrl) {
      const response = await fetch(nextUrl);
      const data: MetaApiResponse<T> = await response.json();
      
      if (data.error) {
        throw new MetaApiErrorClass(data.error);
      }
      
      allData.push(...data.data);
      nextUrl = data.paging?.next || null;
    }

    return allData;
  }

  // ============================================
  // Campanhas
  // ============================================

  /**
   * Busca todas as campanhas da conta de anúncios
   * 
   * Campos disponíveis: id, name, status, objective, created_time,
   * updated_time, daily_budget, lifetime_budget, etc.
   */
  async getCampaigns(fields?: string[]): Promise<MetaCampaign[]> {
    const defaultFields = [
      'id',
      'name',
      'status',
      'objective',
      'created_time',
      'updated_time',
      'daily_budget',
      'lifetime_budget'
    ];

    return this.requestAllPages<MetaCampaign>(
      `${this.adAccountId}/campaigns`,
      {
        fields: (fields || defaultFields).join(','),
        limit: '500'
      }
    );
  }

  /**
   * Busca uma campanha específica
   */
  async getCampaign(campaignId: string, fields?: string[]): Promise<MetaCampaign> {
    const defaultFields = ['id', 'name', 'status', 'objective'];
    const response = await this.request<MetaCampaign>(
      campaignId,
      { fields: (fields || defaultFields).join(',') }
    );
    return response.data[0] || (response as unknown as MetaCampaign);
  }

  // ============================================
  // Conjuntos de Anúncios (Ad Sets)
  // ============================================

  /**
   * Busca todos os conjuntos de anúncios da conta
   */
  async getAdSets(fields?: string[]): Promise<MetaAdSet[]> {
    const defaultFields = [
      'id',
      'name',
      'campaign_id',
      'status',
      'targeting',
      'daily_budget',
      'lifetime_budget',
      'created_time'
    ];

    return this.requestAllPages<MetaAdSet>(
      `${this.adAccountId}/adsets`,
      {
        fields: (fields || defaultFields).join(','),
        limit: '500'
      }
    );
  }

  /**
   * Busca conjuntos de anúncios de uma campanha específica
   */
  async getAdSetsByCampaign(campaignId: string, fields?: string[]): Promise<MetaAdSet[]> {
    const defaultFields = ['id', 'name', 'campaign_id', 'status', 'targeting'];
    
    return this.requestAllPages<MetaAdSet>(
      `${campaignId}/adsets`,
      {
        fields: (fields || defaultFields).join(','),
        limit: '500'
      }
    );
  }

  // ============================================
  // Anúncios
  // ============================================

  /**
   * Busca todos os anúncios da conta
   */
  async getAds(fields?: string[]): Promise<MetaAd[]> {
    const defaultFields = [
      'id',
      'name',
      'adset_id',
      'campaign_id',
      'status',
      'creative{id,name,thumbnail_url,image_url}',
      'created_time'
    ];

    return this.requestAllPages<MetaAd>(
      `${this.adAccountId}/ads`,
      {
        fields: (fields || defaultFields).join(','),
        limit: '500'
      }
    );
  }

  /**
   * Busca anúncios de um conjunto específico
   */
  async getAdsByAdSet(adSetId: string, fields?: string[]): Promise<MetaAd[]> {
    const defaultFields = ['id', 'name', 'adset_id', 'campaign_id', 'status'];
    
    return this.requestAllPages<MetaAd>(
      `${adSetId}/ads`,
      {
        fields: (fields || defaultFields).join(','),
        limit: '500'
      }
    );
  }

  // ============================================
  // Insights (Métricas)
  // ============================================

  /**
   * Busca métricas agregadas da conta de anúncios
   * 
   * @param datePreset - Período predefinido (today, yesterday, this_week, last_7d, last_30d, etc.)
   * @param timeRange - Período customizado { since: 'YYYY-MM-DD', until: 'YYYY-MM-DD' }
   * @param level - Nível de agrupamento: account, campaign, adset, ad
   */
  async getInsights(options: {
    datePreset?: string;
    timeRange?: { since: string; until: string };
    level?: 'account' | 'campaign' | 'adset' | 'ad';
    fields?: string[];
    dailyBreakdown?: boolean;
  }): Promise<MetaInsight[]> {
    // Campos base + IDs de cada nível para mapeamento
    const defaultFields = [
      'date_start',
      'date_stop',
      'campaign_id',
      'adset_id',
      'ad_id',
      'impressions',
      'reach',
      'clicks',
      'spend',
      'cpm',
      'cpc',
      'ctr',
      'actions'
    ];

    const params: Record<string, string> = {
      fields: (options.fields || defaultFields).join(','),
      level: options.level || 'campaign',
      limit: '500'
    };

    // Breakdown diário para série temporal
    if (options.dailyBreakdown) {
      params.time_increment = '1';
    }

    if (options.timeRange) {
      params.time_range = JSON.stringify(options.timeRange);
    } else if (options.datePreset) {
      params.date_preset = options.datePreset;
    } else {
      params.date_preset = 'last_30d';
    }

    return this.requestAllPages<MetaInsight>(
      `${this.adAccountId}/insights`,
      params
    );
  }

  /**
   * Busca métricas de uma campanha específica
   */
  async getCampaignInsights(
    campaignId: string,
    options: {
      datePreset?: string;
      timeRange?: { since: string; until: string };
      breakdown?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<MetaInsight[]> {
    const params: Record<string, string> = {
      fields: 'date_start,date_stop,impressions,reach,clicks,spend,cpm,cpc,ctr,actions',
      limit: '500'
    };

    if (options.timeRange) {
      params.time_range = JSON.stringify(options.timeRange);
    } else {
      params.date_preset = options.datePreset || 'last_30d';
    }

    if (options.breakdown) {
      params.time_increment = options.breakdown === 'day' ? '1' : 
                              options.breakdown === 'week' ? '7' : '28';
    }

    return this.requestAllPages<MetaInsight>(
      `${campaignId}/insights`,
      params
    );
  }

  /**
   * Busca métricas de um conjunto de anúncios
   */
  async getAdSetInsights(
    adSetId: string,
    options: {
      datePreset?: string;
      timeRange?: { since: string; until: string };
    } = {}
  ): Promise<MetaInsight[]> {
    const params: Record<string, string> = {
      fields: 'date_start,date_stop,impressions,reach,clicks,spend,cpm,cpc,ctr,actions',
      limit: '500'
    };

    if (options.timeRange) {
      params.time_range = JSON.stringify(options.timeRange);
    } else {
      params.date_preset = options.datePreset || 'last_30d';
    }

    return this.requestAllPages<MetaInsight>(`${adSetId}/insights`, params);
  }

  // ============================================
  // Utilitários
  // ============================================

  /**
   * Verifica se o token de acesso é válido
   */
  async validateToken(): Promise<{
    isValid: boolean;
    expiresAt?: Date;
    scopes?: string[];
  }> {
    try {
      const url = new URL(`${META_API_BASE_URL}/debug_token`);
      url.searchParams.set('input_token', this.accessToken);
      url.searchParams.set('access_token', this.accessToken);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.data) {
        return {
          isValid: data.data.is_valid,
          expiresAt: data.data.expires_at ? new Date(data.data.expires_at * 1000) : undefined,
          scopes: data.data.scopes
        };
      }

      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Busca informações da conta de anúncios
   */
  async getAdAccountInfo(): Promise<{
    id: string;
    name: string;
    currency: string;
    timezone_name: string;
    account_status: number;
  }> {
    const response = await this.request<{
      id: string;
      name: string;
      currency: string;
      timezone_name: string;
      account_status: number;
    }>(
      this.adAccountId,
      { fields: 'id,name,currency,timezone_name,account_status' }
    );
    // The response for a single object fetch returns the object directly, not in data array
    const result = response.data?.[0] || (response as unknown as {
      id: string;
      name: string;
      currency: string;
      timezone_name: string;
      account_status: number;
    });
    return result;
  }
}

// ============================================
// Classe de Erro customizada
// ============================================

export class MetaApiErrorClass extends Error {
  code: number;
  type: string;
  fbtrace_id?: string;

  constructor(error: MetaApiError) {
    super(error.message);
    this.name = 'MetaApiError';
    this.code = error.code;
    this.type = error.type;
    this.fbtrace_id = error.fbtrace_id;
  }
}

// ============================================
// Helpers para extrair métricas de actions
// ============================================

export function extractLeadsFromActions(actions?: MetaInsight['actions']): number {
  if (!actions) return 0;
  
  const leadAction = actions.find(a => 
    a.action_type === 'lead' || 
    a.action_type === 'onsite_conversion.lead_grouped' ||
    a.action_type === 'offsite_conversion.fb_pixel_lead'
  );
  
  return leadAction ? parseInt(leadAction.value, 10) : 0;
}

export function extractPurchasesFromActions(actions?: MetaInsight['actions']): number {
  if (!actions) return 0;
  
  const purchaseAction = actions.find(a => 
    a.action_type === 'purchase' || 
    a.action_type === 'onsite_conversion.purchase' ||
    a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  
  return purchaseAction ? parseInt(purchaseAction.value, 10) : 0;
}

export function extractLinkClicksFromActions(actions?: MetaInsight['actions']): number {
  if (!actions) return 0;
  
  const clickAction = actions.find(a => 
    a.action_type === 'link_click'
  );
  
  return clickAction ? parseInt(clickAction.value, 10) : 0;
}

export function extractPageViewsFromActions(actions?: MetaInsight['actions']): number {
  if (!actions) return 0;
  
  const viewAction = actions.find(a => 
    a.action_type === 'landing_page_view' ||
    a.action_type === 'offsite_conversion.fb_pixel_view_content'
  );
  
  return viewAction ? parseInt(viewAction.value, 10) : 0;
}
