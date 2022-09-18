import puppeteer from "puppeteer";
import path from "path";
import _ from "lodash";
import {Low} from "lowdb";
import {Catalogue, Product, Sku, Store, View} from "./catalogue.js";
import logger from "./logger.js";

const slugify = (text: string) => _.kebabCase(text);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const cancelled = false;

type Result = { ok: true, skus: Sku[] } | { ok: false, error: string }

export const scrapers = {
    [Store.Woolworths]: {
        [View.Search]: (): Result => {
            try {
                const tiles = Array.from(document.querySelectorAll('.product-grid--tile'))
                const skus = tiles.map(tile => {
                    const link = tile.querySelector('.shelfProductTile-descriptionLink')
                    const dollars = document.querySelector('.price-dollars');
                    const cents = document.querySelector('.price-cents');
                    if (link && dollars && cents) {
                        const price = Number(`${dollars.textContent}.${cents.textContent}`)
                        return {
                            name: link.textContent,
                            url: link.getAttribute('href'),
                            price,
                            at: new Date().toISOString()
                        };
                    } else {
                        throw Error('Element query failed')
                    }
                })
                return {ok: true, skus}
            } catch (e: any) {
                logger.error(e)
                return {ok: false, error: e.message || 'Unknown error'}
            }
        }
    }
}

export async function scrape(browser: puppeteer.Browser, product: Product): Promise<Result> {
    const page = await browser.newPage();
    logger.info(`Navigating to ${product.url}`)
    await page.goto(product.url);
    await page.screenshot({path: path.resolve(`./screenshots/${slugify(product.name)}.png`)})
    if (scrapers?.[product.store]?.[product.view]) {
        try {
            logger.info(`Evaluating scraper for ${product.name}`)
            return await page.evaluate(scrapers[product.store][product.view])
        } catch (e: any) {
            logger.error(`Error evaluating scraper for ${product.name}`, e)
            return {ok: false, error: e.message || 'Unknown error'}
        }
    } else {
        return {ok: false, error: `Scraper not found for ${product.store}:${product.view}`}
    }
}

function hasOneDayPassed(db: Low<Catalogue>) {
    return new Date() > new Date(`${db.data.lastScrapeDate} ${db.data.config.scrape.startTime}`)
}

export async function startScrape(db: Low<Catalogue>) {
    while (!cancelled) {
        if (hasOneDayPassed(db) && db.data.products.length > 0) {
            logger.info('Starting scrape...')
            const browser = await puppeteer.launch({headless: db.data.config.scrape.headless});
            try {
                for (const product of db.data.products) {
                    logger.info(`Scraping ${product.name}`)
                    const result = await scrape(browser, product)

                    if (result.ok === true) {
                        product.skus = result.skus
                    } else {
                        logger.error(`Error scraping ${product.name}`, result.error)
                        product.skus = []
                    }
                    await db.write()
                    await sleep(db.data.config.scrape.intervalSeconds * 1000)
                }
                logger.info('Finished scraping all products')
            } finally {
                await browser.close()
                db.data.lastScrapeDate = new Date().toLocaleDateString()
                await db.write()
            }
        } else {
            if (db.data.products.length === 0) {
                logger.info('No products is catalogue')
            }
            await sleep(60 * 1000)
        }
    }
}
