export interface ProductDefinition {
  id: string;
  name: string;
  price: number;
  description: string;
  dataTestId?: string;
}

export interface ProductCatalog {
  products: ProductDefinition[];
  getById(id: string): ProductDefinition | undefined;
  getByName(name: string): ProductDefinition | undefined;
}

const products: ProductDefinition[] = [
  {
    id: 'sauce-labs-backpack',
    name: 'Sauce Labs Backpack',
    price: 29.99,
    description:
      'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.',
    dataTestId: 'add-to-cart-sauce-labs-backpack',
  },
  {
    id: 'sauce-labs-bike-light',
    name: 'Sauce Labs Bike Light',
    price: 9.99,
    description:
      "A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.",
    dataTestId: 'add-to-cart-sauce-labs-bike-light',
  },
  {
    id: 'sauce-labs-bolt-t-shirt',
    name: 'Sauce Labs Bolt T-Shirt',
    price: 15.99,
    description:
      'Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.',
    dataTestId: 'add-to-cart-sauce-labs-bolt-t-shirt',
  },
  {
    id: 'sauce-labs-fleece-jacket',
    name: 'Sauce Labs Fleece Jacket',
    price: 49.99,
    description:
      "It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at work.",
    dataTestId: 'add-to-cart-sauce-labs-fleece-jacket',
  },
  {
    id: 'sauce-labs-onesie',
    name: 'Sauce Labs Onesie',
    price: 7.99,
    description:
      "Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.",
    dataTestId: 'add-to-cart-sauce-labs-onesie',
  },
  {
    id: 'test-allthethings-t-shirt-red',
    name: 'Test.allTheThings() T-Shirt (Red)',
    price: 15.99,
    description:
      'This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.',
    dataTestId: 'add-to-cart-test.allthethings()-t-shirt-(red)',
  },
];

export const productCatalog: ProductCatalog = {
  products,
  getById(id: string) {
    return products.find((product) => product.id === id);
  },
  getByName(name: string) {
    return products.find((product) => product.name === name);
  },
};
