import type { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, type ResponseEnvelope } from '../base/BaseApiClient';
import type {
  DemoBlazeProduct,
  DemoBlazeProductsResponse,
  DemoBlazeCartResponse,
  DemoBlazeProductDetailResponse,
  DemoBlazeCategory,
  DemoBlazeLoginResult,
  DemoBlazeSignupResult,
} from '../types/DemoBlazeTypes';
import { step } from '../../utils/stepDecorator';

const API_BASE = 'https://api.demoblaze.com';

export class DemoBlazeApiClient extends BaseApiClient {
  constructor(request: APIRequestContext, testInfo?: TestInfo) {
    super(request);
    this.registerTestInfo(testInfo);
  }

  @step('DemoBlaze: sign up user')
  async signup(username: string, password: string): Promise<DemoBlazeSignupResult> {
    const encoded = btoa(password);
    const envelope = await this.postJson<string | null>(`${API_BASE}/signup`, {
      username,
      password: encoded,
    });

    if (envelope.body === null || envelope.body === '') {
      return { success: true, message: null };
    }
    return { success: false, message: envelope.body };
  }

  @step('DemoBlaze: log in user')
  async login(username: string, password: string): Promise<DemoBlazeLoginResult> {
    const encoded = btoa(password);
    const envelope = await this.postJson<string | null>(`${API_BASE}/login`, {
      username,
      password: encoded,
    });

    const raw = envelope.body;
    if (raw && raw.startsWith('Auth_token:')) {
      const token = raw.replace('Auth_token:', '').trim();
      return { success: true, token, message: null };
    }
    return { success: false, token: null, message: raw };
  }

  @step('DemoBlaze: fetch all products')
  async getProducts(): Promise<ResponseEnvelope<DemoBlazeProductsResponse>> {
    return this.getJson<DemoBlazeProductsResponse>(`${API_BASE}/entries`);
  }

  @step('DemoBlaze: fetch products by category')
  async getProductsByCategory(
    category: DemoBlazeCategory,
  ): Promise<ResponseEnvelope<DemoBlazeProductsResponse>> {
    return this.postJson<DemoBlazeProductsResponse>(`${API_BASE}/bycat`, { cat: category });
  }

  @step('DemoBlaze: fetch product details')
  async getProduct(id: number): Promise<ResponseEnvelope<DemoBlazeProductDetailResponse>> {
    return this.getJson<DemoBlazeProductDetailResponse>(`${API_BASE}/prod?id=${id}`);
  }

  @step('DemoBlaze: add item to cart')
  async addToCart(
    productId: number,
    token: string,
  ): Promise<ResponseEnvelope<string | null>> {
    const cartId = crypto.randomUUID();
    return this.postJson<string | null>(`${API_BASE}/addtocart`, {
      id: cartId,
      cookie: token,
      prod_id: productId,
      flag: false,
    });
  }

  @step('DemoBlaze: view cart')
  async viewCart(token: string): Promise<ResponseEnvelope<DemoBlazeCartResponse>> {
    return this.postJson<DemoBlazeCartResponse>(`${API_BASE}/viewcart`, {
      cookie: token,
      flag: false,
    });
  }

  @step('DemoBlaze: delete cart item')
  async deleteCartItem(itemId: string): Promise<ResponseEnvelope<string | null>> {
    return this.postJson<string | null>(`${API_BASE}/deleteitem`, { id: itemId });
  }

  async getProductsWithCategory(category: DemoBlazeCategory): Promise<DemoBlazeProduct[]> {
    const envelope = await this.getProductsByCategory(category);
    return envelope.body?.Items ?? [];
  }

  async getAllProducts(): Promise<DemoBlazeProduct[]> {
    const envelope = await this.getProducts();
    return envelope.body?.Items ?? [];
  }
}
