/**
 * 项目介绍 - 拉勾网自动化爬虫
 * 项目功能 - 输入关键字自动打开拉勾网爬取全国相关的职位信息
 * 项目原理 - 主要是利用selenium去自动化模拟用户的操作，比如点击下一页的click事件，
 *           利用模拟操作来不断的获取页面数据，然后利用DOM操作获取数据
 *           最后利用fs文件库和json2xls把获取的数据存储到创建的excel文件中
 */

// 引入库文件
const { Builder, By, Key, until } = require('selenium-webdriver');
const fs = require('fs');
const readline = require('readline');
var xlsx = require('node-xlsx');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 当前页码
let currentPage = 1;
let maxPage;
let jobName = ['职位名称','工作地点','发布时间','职位链接','薪酬待遇','工作要求','公司名称','公司背景','公司地址','职位标签','职位福利'];
// 主函数 - 打开浏览器搜索关键字
(async function start(){
    rl.question('请输入你想在拉勾网爬取的职位关键字 - 例如前端:', (answer) => {
        // 对答案进行处理
        console.log(`开始进行搜索`);
        rl.close();
        openChorm(answer)
      });
})();

// 打开浏览器
async function openChorm(answer){
    // 创建一个无头浏览器用来打开网页
    let driver = await new Builder().forBrowser('chrome').build();
    // 打开拉勾网
    await driver.get('https://www.lagou.com');
    // 开始爬取数据之前获取当前搜索关键字总页数
    await driver.findElement(By.css('#changeCityBox .checkTips > .tab.focus')).click();
    await driver.findElement(By.id('search_input')).sendKeys(`${answer}`,Key.ENTER);
    maxPage = await driver.findElement(By.className('totalNum')).getText()
    getData(driver)
}

// 调取数据的函数 - 返回一个爬取数组
async function getData(driver){
    // 存在DOM挂载问题，但是我暴力轮询一直询问一但没有错误就执行，有错误就继续等待
    console.log(`-----------共${maxPage}页数据，当前正在获取第${currentPage}页的数据中-----------`)
    while(true){
        let notError = true
        try{
            let items = await driver.findElements(By.css('.item_con_list .con_list_item'));
            for(let i=0;i<items.length;i++){
                let item = items[i]
                // 职位名称
                let title = await item.findElement(By.css('.position h3')).getText()
                // 工作地点
                let address =  await item.findElement(By.css('.position .add em')).getText()
                // 发布时间
                let time = await item.findElement(By.css('.position .format-time')).getText()
                // 职位链接
                let jdLink = await item.findElement(By.css('.position .money')).getText()
                // 薪酬待遇
                let money = await item.findElement(By.css('.position .position_link')).getText()
                // 工作要求
                let background =  await item.findElement(By.css('.position .li_b_l')).getText()
                background = background.replace(money, '')
                // 公司名称
                let companyName = await item.findElement(By.css('.company .company_name')).getText()
                // 公司背景
                let industry = await item.findElement(By.css('.company .company_name a')).getText()
                // 公司地址
                let companyLink = await item.findElement(By.css('.company .industry')).getText()
                // 职位标签
                let tag = await item.findElement(By.css('.list_item_bot .li_b_l')).getText()
                // 职位福利
                let welfare = await item.findElement(By.css('.list_item_bot .li_b_r')).getText()
                let itemData = [title,address,time,jdLink,money,background,companyName,industry,companyLink,tag,welfare]
                await addData(itemData)
            }
            // 页码加一页
            // 如果当前页码小于等于最大爬取页码就执行下一页的操作
            if(currentPage <= maxPage){
                ++currentPage
                console.log('读取完毕!')
                // 找到下一页的按钮 然后点击
                await driver.findElement(By.className('pager_next')).click()
                // 递归继续执行
                getData(driver);
            }else{
                // 项目完成
                createFile();
            }
        } catch(e){
            if(e) notError = false;
        } finally {
            if(notError) break
        }
    }
}

// 汇总数据
async function addData(data){
    jobName.push(data)
    return false;
}

// 添加到excel文件中
function createFile(){
    // let buffer = xlsx.build([{name: "data", data: jobName}]); 
	// fs.writeFileSync('1.xlsx',buffer,function(){
    //     process.exit();
    // });
    fs.writeFile("./11.txt", jobName, error => {
        console.log('--------------数据爬取完毕-------------------')
    });
}