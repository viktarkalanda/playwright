export interface SecondShopConfig {
  getBaseUrl(): string;
}

export const secondShopConfig: SecondShopConfig = {
  getBaseUrl(): string {
    const fromEnv = process.env.SECOND_SHOP_BASE_URL;
    if (fromEnv && fromEnv.trim().length > 0) {
      return fromEnv.trim().replace(/\/+$/, '');
    }
    return 'https://www.demoblaze.com';
  },
};
