const got = require('@/utils/got');
const cheerio = require('cheerio');


const baseUrl = 'http://www.395xe.com/';
const siteTitle = '--395xe';

const catrgoryMap = {
    tse: { title: '偷拍自拍', suffix: '395xe-tupianqu/TSE/' },
    yse: { title: '亚洲色图', suffix: '395xe-tupianqu/YSE/' },
    ose: { title: '亚洲色图', suffix: '395xe-tupianqu/OSE/' },
    qse: { title: '亚洲色图', suffix: '395xe-tupianqu/QSE/' },
    mse: { title: '亚洲色图', suffix: '395xe-tupianqu/MSE/' }
};

// 专门定义一个function用于加载文章内容
async function load(link) {
    // 异步请求文章
    const response = await got.get(link);
    // 加载文章内容
    const $ = cheerio.load(response.data);
    // 提取文章内容
    const description = $('.main-content').html();
    // 返回解析的结果
    return { description };
}

module.exports = async (ctx) => {
    // 默认 正常规定 然后获取列表页面
    const type = ctx.params.type || 'tse';
    const listPageUrl = baseUrl + catrgoryMap[type].suffix;
    const response = await got({
        method: 'get',
        url: listPageUrl,
        // headers: {
        //     Referer: baseUrl,
        // },
    });
    const $ = cheerio.load(response.data);

    // console.log(type+":"+listPageUrl);
    // 获取当前页面的 list
    const list = $('#colList>ul>li');

    const result = await Promise.all(
        // 遍历每一篇文章
        list
            .map(async (item) => {
                const $ = cheerio.load(list[item]); // 将列表项加载成 html
                const $rel_url = $('a').attr('href'); // 获取 每一项的url

                // 获取绝对路径
                // console.log(/(http|https):\/\/([\w.]+\/?)\S*/.test($rel_url))
                const $item_url = /(http|https):\/\/([\w.]+\/?)\S*/.test($rel_url) ? $rel_url : baseUrl + $rel_url;

                const $title = $('h2').text(); // 获取每个的标题

                const date_txt = $('span').text().match(/[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/); // 匹配 yyyy-mm-dd格式时间
                const $pubdate = new Date(date_txt.input).toUTCString(); // 正则匹配发布时间 然后转换成时间
                console.log(item + ":" + $item_url + ":" + $title + ":" + date_txt);
                // 列表上提取到的信息
                // 标题 链接
                const single = {
                    title: $title,
                    pubDate: $pubdate,
                    link: $item_url,
                    guid: $item_url,
                };

                // 对于列表的每一项, 单独获取 时间与详细内容
                const other = await ctx.cache.tryGet($item_url, async () => await load($item_url));
                // console.log('DONE'+$title +":"+$item_url)

                // 合并解析后的结果集作为该篇文章最终的输出结果
                return Promise.resolve(Object.assign({}, single, other));
            })
            .get()
    );

    ctx.state.data = {
        title: catrgoryMap[type].title + siteTitle,
        link: baseUrl,
        description: catrgoryMap[type].title + siteTitle,
        item: result,
    };
};
