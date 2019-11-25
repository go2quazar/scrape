var express = require("express");
var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var app = express();

const pSku = ["SVT2187", "SVT2188", "SVT2189"];

app.get("/scrape", function(req, res) {
  url =
    "https://www.vitalabs.com/private-label-product/vitamins-nutrition/colon-cleansers-for-sale/15-day-cleanse-30-capsules/713";

  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html, { normalizeWhitespace: true });
      var json = {
        name: "",
        description: "",
        slug: "",
        servingSize: "",
        ingredients: "",
        suggestedUse: "",
        caution: "",
        Categories: "",
        otherIngredients: "",
        Sizes: ""
      };

      $(".page-title h1").filter(function() {
        var data = $(this);
        name = data
          .text()
          .replace(/\s\s+/g, "")
          .replace(/( - ).*/, "");

        json.name = name;
        json.description = name;
      });

      $(".page-title h1").filter(function() {
        var data = $(this);
        nameRaw = data
          .text()
          .replace(/\s\s+/g, "")
          .replace(/( - ).*/, "");
        nameLow = nameRaw.toLowerCase();
        name = nameLow.replace(/\s+/g, "-");
        json.slug = name;
      });

      $(".NutrionalFactsTitle").filter(function() {
        var data = $(this);
        servingSize = data
          .siblings()
          .text()
          .replace(/\s\s+/g, "");
        json.servingSize = servingSize;
      });

      ingFilter1 = $("td.FormText").filter(function() {
        const data = $(this)
          .not(":last-child")
          .text()
          .replace(/\s\s+/g, "");
        return data;
      });
      ingArray = ingFilter1
        .map(function(i, ings) {
          ings = $(this)
            .not(":last-child")
            .text()
            .replace(/[\s]$/g, "");
          ingsArray = [ings];
          return ings;
        })
        .get();
      ing = ingArray.filter(function(el) {
        return el != "";
      });

      amountData = $(".NutritionalFactsBorder_Inside").map(function(
        i,
        amounts
      ) {
        amounts = $(this)
          .find(".FormatText")
          .not(":last-child")
          .text()
          .replace(/g/g, "g,")
          .replace(/U/g, "U,")
          .replace(/†/g, "†,")
          .replace(/0,0/g, "00")
          .replace(/[,]$/g, "");
        amountsArray = amounts.split(",");
        return amountsArray;
      });

      dvData = $(".NutritionalFactsBorder_Inside").map(function(
        i,
        dailyValueData
      ) {
        dailyValueData = $(this)
          .find(".FormatText")
          .next()
          .text()
          .replace(/\s/g, "")
          .replace(/%/g, "%,")
          .replace(/\*/g, "*,")
          .replace(/[,]$/g, "");
        dvArray = dailyValueData.split(",");
      });
      const ingredients = ing.map((item, i) => {
        const container = {
          ingredient: item,
          amount: amountData[i],
          dailyValue: dvArray[i]
        };
        return container;
      });
      json.ingredients = ingredients;

      vendorSize = $(".col-sm-12")
        .map(function(i, sizeData) {
          sizeData = $(this)
            .find("tbody")
            .children()
            .not(":first-child")
            .not(":last-child")
            .children()
            .next()
            .text()
            .replace(/\s\s+/, "")
            .replace(/\s\s+/g, ",")
            .replace(/[,]$/g, "");
          sizeArray = sizeData.split(",");
          return sizeArray;
        })
        .get();

      vendorSku = $(".col-sm-12")
        .map(function(i, skuData) {
          skuData = $(this)
            .find("tbody")
            .children()
            .not(":first-child")
            .not(":last-child")
            .children()
            .next()
            .prev()
            .text()
            .replace(/\s\s+/, "")
            .replace(/\s\s+/g, ",")
            .replace(/[,]$/g, "");
          skuArray = skuData.split(",");
          return skuArray;
        })
        .get();

      supType = $(".col-sm-12")
        .map(function(i, typeData) {
          typeData = $(this)
            .find("tbody")
            .children()
            .not(":first-child")
            .not(":last-child")
            .children()
            .next()
            .text()
            .replace(/\s\s+/, "")
            .replace(/\s\s+/g, ",")
            .replace(/[,]$/g, "");
          typeArray = typeData.split(",");
          //   return sizeArray;
          typeFilter = typeArray[0].replace(/\d/g, "").replace(/\s/, "");
          return typeFilter;
        })
        .get();

      const sizes = vendorSize.map((item, i) => {
        const container = {
          size: item,
          sku: pSku[i],
          type: supType[0],
          vendorSku: vendorSku[i]
        };
        return container;
      });
      json.Sizes = sizes;

      $("td:contains('SUGGESTED')").filter(function() {
        const suggestedUse = $(this)
          .text()
          .replace(/SUGGESTED USE: /, "")
          .replace(/\s\s+/g, "");

        json.suggestedUse = suggestedUse;
      });

      caution = $(".below-supplement-panel").filter(function() {
        const cautionData = $(this)
          .parent()
          .find(":nth-child()")
          .text()
          .replace(/\s\s+/g, "")
          .replace(/CAUTION: /, "");
        return cautionData;
      });
      console.log(caution);

      $("span.text-medium:contains('Categories')").filter(function() {
        const categoryRaw = $(this)
          .nextAll("a")
          .text()
          .replace(/\s\s+/g, "")
          .replace(/\s*,\s*/g, ",")
          .replace(/\s/, "")
          .replace(/B & C Vitamins/, "Single Vitamins")
          .replace(/E Vitamins/, "Single Vitamins")
          .replace(/Vitamin A & D/, "Single Vitamins")
          .replace(/Essential Fatty Acids \/ Lecithin/, "Essential Fatty Acids")
          .replace(/Weight Loss & Energy/, "Weight Loss")
          .replace(/Halal Certified Formulas/, "Halal Certified")
          .replace(/Herbal Formulations/, "Herbal")
          .replace(/Hot New Products!!!/, "Latest Products")
          .replace(/Special Formulations/, "Specialty")
          .replace(/Multi-Vitamin Minerals/, "Multi Vitamins")
          .replace(/!/, "")
          .replace(/[ ]$/g, "");
        categoryLow = categoryRaw.toLowerCase();
        categorySlug = categoryLow.replace(/\s+/g, "-");
        const catslug = categorySlug.split(",");

        const categoryData = $(this)
          .nextAll("a")
          .text()
          .replace(/\s\s+/g, "")
          .replace(/\s*,\s*/g, ",")
          .replace(/\s/, "")
          .replace(/B & C Vitamins/, "Single Vitamins")
          .replace(/E Vitamins/, "Single Vitamins")
          .replace(/Vitamin A & D/, "Single Vitamins")
          .replace(/Essential Fatty Acids \/ Lecithin/, "Essential Fatty Acids")
          .replace(/Weight Loss & Energy/, "Weight Loss")
          .replace(/Halal Certified Formulas/, "Halal Certified")
          .replace(/Herbal Formulations/, "Herbal")
          .replace(/Hot New Products!!!/, "Latest Products")
          .replace(/Special Formulations/, "Specialty")
          .replace(/Multi-Vitamin Minerals/, "Multi Vitamins")
          .replace(/!/, "")
          .replace(/[ ]$/g, "");
        const catname = categoryData.split(",");
        const categories = catname.map((item, i) => {
          const container = { name: item, slug: catslug[i] };
          return container;
        });
        json.Categories = categories;
      });

      $("td.FormText:contains('Other ingredients:')").filter(function() {
        const otherIngredients = $(this)
          .text()
          .replace(/\s\s+/g, "")
          .replace(/Other ingredients: /, "");

        json.otherIngredients = otherIngredients;
      });
    }

    // To write to the system we will use the built in 'fs' library.
    // In this example we will pass 3 parameters to the writeFile function
    // Parameter 1 :  output.json - this is what the created filename will be called
    // Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
    // Parameter 3 :  callback function - a callback function to let us know the status of our function

    const dataJson = JSON.stringify(json, null, 4);
    const dataParsed = JSON.parse(dataJson);
    console.log(dataParsed);

    fs.writeFile("output.json", JSON.stringify(json, null, 4), function(err) {
      console.log(
        "File successfully written! - Check your project directory for the output.json file"
      );
    });

    // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
    res.send("Check your console!");
  });
});

app.listen("8081");
console.log("Magic happens on port 8081");
exports = module.exports = app;
