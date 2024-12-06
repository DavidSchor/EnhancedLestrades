// ==UserScript==
// @name         Get GGDeals Prices on lestrades
// @namespace    http://tampermonkey.net/
// @version      2024-12-06
// @author       SagaciousFool
// @match        https://lestrades.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lestrades.com
// @grant        GM_xmlhttpRequest
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

(function() {
    'use strict';

      $("[href*='store.steampowered.com/app/']").get()
        .forEach((elem) => {
            let [type, id] = elem.href.match(/(sub|app)\/\d+/g)[0].split("/");
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
                    $(`[id="ggdeals_${id}_after"]`).html(` (<a href="https://gg.deals/steam/${type}/${id}" title="GG.Deals current lowest price (Official Stores / Keyshops)">${price}</a>)`);
                },
            }));
        });


    // Your code here...
})();

