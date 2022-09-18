// Setup database

export interface Catalogue {
    products: Product[]
    config: Config
    lastScrapeDate: string;
}

export interface Config {
    scrape: {
        intervalSeconds: number
        startTime: string;
        headless: boolean;
    }
}

export interface Product {
    name: string;
    url: string;
    store: Store;
    view: View;
    normalPrice: number;
    priority: number;
    skus: Sku[]
}

export interface Sku {
    name: string;
    url: string;
    price: number;
    at: string
}

export enum Store {
    Woolworths = 'Woolworths',
}

export enum View {
    Search = 'Search',
}

export function initCatalogue (): Catalogue {
    return {
        products: [],
        config: {
            scrape: {
                intervalSeconds: 60,
                startTime: '10:00',
                headless: false
            }
        },
        lastScrapeDate: '1/1/1970'
    }
}
