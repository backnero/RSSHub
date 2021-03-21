const config = require('@/config').value;
const art = require('art-template');
const path = require('path');


module.exports = async (ctx) => {
    const keyword = ctx.params.keyword || '一';

    console.log(keyword);
    ctx.set({
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache',
    });
    const dict = require('./dict.json');
    let book = '';
    let page = '';
    let measage = "搜索成功";
    if (!dict[keyword]) {
        measage = "未收录该字";
    }
    if (typeof dict[keyword]  !== "undefined") {
        book = dict[keyword].book;
    }
    if (typeof dict[keyword]  !== "undefined") {
        page = dict[keyword].page;
    }

    ctx.body = art(path.resolve(__dirname, '../../views/shizi.art'), {
        book : book,
        page : page,
        keyword : keyword,
        measage : measage
    });
};
