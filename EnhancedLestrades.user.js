// ==UserScript==
// @name         Get GGDeals Prices on lestrades
// @namespace    http://tampermonkey.net/
// @version      2025-01-30
// @author       SagaciousFool
// @match        https://lestrades.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lestrades.com
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

function request(options) {
    if (options.onload) {
        GM_xmlhttpRequest(options);
        return;
    }

    let error = new Error("HTTP Error");
    return new Promise((res, rej) => GM_xmlhttpRequest({
        "timeout":   240000,
        ...options,
        "onload":    res,
        "onerror":   (...params) => { error.params = params; rej(error); },
        "ontimeout": (...params) => { error.params = params; rej(error); },
        "onabort":   (...params) => { error.params = params; rej(error); },
    }));
}

function getBarterItemInfo(itemid) {
    return new Promise(async(res, rej) => {
        const response = await request({
            "method": "GET",
            "url":    `https://barter.vg/i/${itemid}/json2/`,
        }).catch(rej);

        let json;
        try {
            json = JSON.parse(response.responseText);
        } catch (e) {
            e.data = response;
            rej(e);
        }

        res(json);
    });
}

(function() {
    'use strict';

    $("[href*='store.steampowered.com/app/']").get()
        .forEach((elem) => {
        let [type, id] = elem.href.match(/(sub|app)\/\d+/g)[0].split("/");
        let cachedPrice = GM_getValue ("lestrades_ggdeals_price" + id);
        if (cachedPrice)
        {
            $(elem).parent()
                .prepend(`
                <span class="tag">
                    <a style="cursor: pointer;" id="ggdeals_${id}">
                        <img src="https://bartervg.com/imgs/ico/gg.png" width="18" height="18" title="GG.Deals: Click to load price info! ${type} ${id}">
                    </a>
                    <small id="ggdeals_${id}_after">(<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${cachedPrice}</a>)</small>
                </span>`);
            $(`[id="ggdeals_${id}"]`).click(() => request({
                "method": "GET",
                "url":    `https://gg.deals/steam/${type}/${id}`,
                "onload": (response) => {
                    let parser = new DOMParser();
                    let body = parser.parseFromString(response.responseText, "text/html");
                    let price = $("#game-header-current-prices .price", body).get()
                    .map((t) => t.innerText)
                    .join(" / ");
                    GM_setValue ("lestrades_ggdeals_price" + id, price );
                    $(`[id="ggdeals_${id}_after"]`).html(` (<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${price}</a>)`);
                },
            }));
        }
        else
        {
            $(elem).parent()
                .prepend(`
                <span class="tag">
                    <a style="cursor: pointer;" id="ggdeals_${id}">
                        <img src="https://bartervg.com/imgs/ico/gg.png" width="18" height="18" title="GG.Deals: Click to load price info! ${type} ${id}">
                    </a>
                    <small id="ggdeals_${id}_after"></small>
                </span>`);
            $(`[id="ggdeals_${id}"]`).click(() => request({
                "method": "GET",
                "url":    `https://gg.deals/steam/${type}/${id}`,
                "onload": (response) => {
                    let parser = new DOMParser();
                    let body = parser.parseFromString(response.responseText, "text/html");
                    let price = $("#game-header-current-prices .price", body).get()
                    .map((t) => t.innerText)
                    .join(" / ");
                    GM_setValue ("lestrades_ggdeals_price" + id, price );
                    $(`[id="ggdeals_${id}_after"]`).html(` (<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${price}</a>)`);
                },
            }));
        }
    });


    let tempI = 0;
    $("td a[href*='/game/']").get()
        .forEach((elem) => {

        let barterId = elem.href.match(/com\/game\/\d+/g)[0].split("/")[2];
        let spanId = barterId + "_" + tempI;

        let cachedType = GM_getValue ("lestrades_ggdeals_type_barter" + barterId);
        let cachedId = GM_getValue ("lestrades_ggdeals_id_barter" + barterId);
        let cachedPrice = GM_getValue ("lestrades_ggdeals_price" + cachedId);
        if (cachedPrice)
        {
            $(`
                <span class="">
                    <a style="cursor: pointer;" id="ggdeals_${spanId}">
                        <img src="https://bartervg.com/imgs/ico/gg.png" width="18" height="18" title="GG.Deals: Click to load price info!">
                    </a>
                    <small id="ggdeals_${barterId}_after"> (<a href="https://gg.deals/steam/${cachedType}/${cachedId}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${cachedPrice}</a>)</small>
                </span>`).insertBefore(elem);
            $(`[id="ggdeals_${spanId}"]`).click(async () => {
                // inform user as this can take a bit with calls to barter
                $(`[id="ggdeals_${barterId}_after"]`).text(`Loading price, please wait`);
                // Perform calls to barter and ggdeals
                let barterItem = await getBarterItemInfo(barterId);
                let type = barterItem.source_profile.includes("app") ? "app" : "sub";
                let id = barterItem.sku;
                return request({
                    "method": "GET",
                    "url":    `https://gg.deals/steam/${type}/${id}`,
                    "onload": (response) => {

                        let parser = new DOMParser();
                        let body = parser.parseFromString(response.responseText, "text/html");
                        let price = $("#game-header-current-prices .price", body).get()
                        .map((t) => t.innerText)
                        .join(" / ");
                        GM_setValue ("lestrades_ggdeals_price" + id, price );
                        GM_setValue ("lestrades_ggdeals_type_barter" + barterId, type );
                        GM_setValue ("lestrades_ggdeals_id_barter" + barterId, id );
                        $(`[id="ggdeals_${barterId}_after"]`).html(` (<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${price}</a>)`);
                    },
                });
            });
        }
        else
        {
            $(`
                <span class="">
                    <a style="cursor: pointer;" id="ggdeals_${spanId}">
                        <img src="https://bartervg.com/imgs/ico/gg.png" width="18" height="18" title="GG.Deals: Click to load price info!">
                    </a>
                    <small id="ggdeals_${barterId}_after"></small>
                </span>`).insertBefore(elem);
            $(`[id="ggdeals_${spanId}"]`).click(async () => {
                // inform user as this can take a bit with calls to barter
                $(`[id="ggdeals_${barterId}_after"]`).text(`Loading price, please wait`);
                // Perform calls to barter and ggdeals
                let barterItem = await getBarterItemInfo(barterId);
                let type = barterItem.source_profile.includes("app") ? "app" : "sub";
                let id = barterItem.sku;
                return request({
                    "method": "GET",
                    "url":    `https://gg.deals/steam/${type}/${id}`,
                    "onload": (response) => {

                        let parser = new DOMParser();
                        let body = parser.parseFromString(response.responseText, "text/html");
                        let price = $("#game-header-current-prices .price", body).get()
                        .map((t) => t.innerText)
                        .join(" / ");
                        GM_setValue ("lestrades_ggdeals_price" + id, price );
                        GM_setValue ("lestrades_ggdeals_type_barter" + barterId, type );
                        GM_setValue ("lestrades_ggdeals_id_barter" + barterId, id );
                        $(`[id="ggdeals_${barterId}_after"]`).html(` (<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${price}</a>)`);
                    },
                });
            });
        }
        tempI++;
    });
})();

