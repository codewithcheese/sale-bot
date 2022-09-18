import fs from "fs/promises";
import path from 'path';
import express from 'express'
import mustache from 'mustache'
import {Low, JSONFile} from 'lowdb'
import _ from "lodash";
import {startScrape} from "./scrape.js";
import {Catalogue, initCatalogue, Product, Store, View} from "./catalogue.js";
import {shoppingList} from "./view.js";
import logger from "./logger.js";

// Setup database
const adapter = new JSONFile<Catalogue>(path.resolve('catalogue.json'))
const db = new Low(adapter)
await db.read()
// to ensure changes to the default catalogue are reflected in the existing catalogue merge the two
db.data = _.merge(initCatalogue(), db.data || {})

// Setup server
const app = express()
const port = process.env.PORT || 3000

app.use(express.urlencoded({
    extended: true
}));

app.get('/', async (req, res) => {
    res.send(await render('./html/shopping-list.mustache', shoppingList(db)))
})

app.get('/new', async (req, res) => {
    const view = {
        store: Object.values(Store),
        view: Object.values(View)
    }
    res.send(await render('./html/product-form.mustache', view))
})

app.post('/new', async (req, res) => {
    const product: Product = {
        name: req.body.name,
        url: req.body.url,
        normalPrice: Number(req.body.normalPrice),
        priority: Number(req.body.priority),
        store: req.body.store,
        view: req.body.view,
        skus: []
    }
    db.data.products.push(product)
    await db.write()
    res.redirect('/')
})

// view your catalogue db to save a copy of it
app.get('/backup', async (req, res) => {
    const backup = await fs.readFile(path.resolve('catalogue.json'))
    res.type('application/json').send(backup.toString())
})

app.get('/log', async (req, res) => {
    const log = await fs.readFile(path.resolve('run.log'))
    res.type('text/plain').send(log.toString())
})

app.get('/delete', async (req, res) => {
    if (!req.query.name) {
        res.redirect('/')
    } else {
        db.data.products = db.data.products.filter(p => p.name !== req.query.name)
        await db.write()
        res.redirect('/')
    }
})

app.listen(port, async () => {
    logger.info(`Listening on http://127.0.0.1:${port}`)
    startScrape(db).catch(e => {
        logger.error(e)
        process.exit(1)
    })
})

async function render(templatePath: string, view: { [key: string]: any }) {
    const base = await fs.readFile('./html/base.mustache')
    const template = await fs.readFile(templatePath)
    return mustache.render(base.toString(), view, {content: template.toString()})
}
