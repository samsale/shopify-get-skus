const https = require('https');
const Papa = require('papaparse');
const fs = require('fs');

// create config for get requests to get data from multiple pages
function createOptions(pages){
  let arrayOfOptions = []
  for(let i=1; i <= pages; i++){
    var optionsObj = {
      host: 'rubysgardenboutique.myshopify.com',
      port: 443,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('504c14a434d42d87db6ad111f22fb1cb' +
        ':' + '3a83a71ec14949dc43f40fff3244e95d').toString('base64')
      }
    }
    optionsObj["path"] = `/admin/variants.json?limit=250&page=${i}&fields=sku`
    arrayOfOptions.push(optionsObj)
  }
  return arrayOfOptions
}

//calls shopify API and returns json
function getAPIData(optionsObj){

return new Promise((resolve, reject) => {
let dataArray = []
https.get(optionsObj,(result)=>{
  result.on('data', function(data) {
    dataArray.push(data);
  }).on('end', function() {
    let data   = Buffer.concat(dataArray);
    let schema = JSON.parse(data);
    resolve(schema)
  });


  result.on('error', (error)=> {
      reject(error)
      });
    });
  })
}

// uses config objects for http get request and returns array of objects
async function getVariantsSkus(optionsArray){
  let inStoreSkus = []
  for(let value of optionsArray){
    let product = await getAPIData(value)
    inStoreSkus.push(product.variants)
  }
  return [].concat.apply([], inStoreSkus)

}

//creates csv from json of all skus in store
function createCSV(arrayOfSkus){
    let csv = Papa.unparse(arrayOfSkus);
    writeFile(csv)
}

//saves a csv locally
function writeFile(data){
  fs.writeFile('currentSkus.csv', data, (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
}

async function main(){
  let optionsArray = await createOptions(2)
  let results = await getVariantsSkus(optionsArray)
  await createCSV(results)
}

main()
