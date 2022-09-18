import _ from "lodash";
import {Catalogue} from "./catalogue.js";
import {Low} from "lowdb";
import humanizeDuration from "humanize-duration";

export function shoppingList (db: Low<Catalogue>) {
    let idx = 0
    return {
        list: db.data.products.map(product => {
            const min = _.minBy(product.skus, 'price')
            const normalPrice = '$' + product.normalPrice.toFixed(2)
            const numSkus = product.skus.length
            let salePct = 0
            let price = 'Not found'
            let since = NaN
            if (min) {
                price = '$' + min.price.toFixed(2)
                salePct = (1 - (min.price / product.normalPrice)) * 100
                since = Date.now() - new Date(min.at).valueOf()
            }
            return {...product, salePct, price, normalPrice, numSkus, since: Number.isNaN(since) ? '-': humanizeDuration(since, { largest: 1 }) }
        }),
        idx: () => ++idx
    }
}
