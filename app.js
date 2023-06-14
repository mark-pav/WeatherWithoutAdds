//jshint esversion:8

const express = require('express');
var bodyParser = require('body-parser');
let ejs = require('ejs');
const https = require("https");
require('dotenv').config();

const app = express();
app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  res.render('landing');
});

app.get("/about", function(req, res){
  res.render("about");
});
app.get("/support", function(req, res){
  res.render("support");
});

app.post("/cityInput", function(req, res) {
  let userInputForCity = req.body.cityInput;
  res.redirect("/locations/" + userInputForCity);
});


app.get("/locations/:location", function(req, res) {


//This function calls api with City NAME as a parameter for forecast
  async function getForecastByCityName(cityName) {
    let url = "https://api.openweathermap.org/data/2.5/forecast?q=" + cityName + "&appid=" + process.env.OWAPIKEY + "&units=imperial";
    try {
        let res = await fetch(url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
  }

  //This function calls api with City NAME as a parameter for forecast
    async function getForecastByZip(zipCode) {
      let url = "https://api.openweathermap.org/data/2.5/forecast?zip=" + zipCode + "&appid=" + process.env.OWAPIKEY + "&units=imperial";
      try {
          let res = await fetch(url);
          return await res.json();
      } catch (error) {
          console.log(error);
      }
    }

    //This function calls api with City NAME as a parameter for current weather
  async function getCurrentWeatherByCityName(cityName) {
    let url = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + process.env.OWAPIKEY + "&units=imperial";
    try {
        let res = await fetch(url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
  }
  //This function calls api with ZIPCODE as a parameter for current weather
  async function getCurrentWeatherByZip(zipCode) {
    let url = "https://api.openweathermap.org/data/2.5/weather?zip=" + zipCode + "&appid=" + process.env.OWAPIKEY + "&units=imperial";
    try {
        let res = await fetch(url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
  }


//This function renders weather view with all the data it got from API
  async function renderWeatherPage(city) {
    let currentWeatherData;
    let forecastData;
    let dailyForecastData = [];

    //check if user input was number (zip zode) or letter (city name)
    if (/^\d/.test(req.params.location)) {
      currentWeatherData = await getCurrentWeatherByZip(req.params.location);
      forecastData = await getForecastByZip(req.params.location);
      for (let i=0; i<forecastData.list.length ; i++){
        if ((forecastData.list[i].dt_txt).substring(11,13) == "21"){
          for (let j=i; j<forecastData.list.length; j+=8){
            dailyForecastData.push(forecastData.list[j]);
          }
        }
      }

    } else if (/^[a-zA-Z]/.test(req.params.location)) {
      currentWeatherData = await getCurrentWeatherByCityName(req.params.location);
      forecastData = await getForecastByCityName(req.params.location);

      for (let i=0; i< await forecastData.list.length ; i++){
        if ((forecastData.list[i].dt_txt).substring(11,13) == "21"){
          for (let j=i; j<forecastData.list.length; j+=8){
            dailyForecastData.push(forecastData.list[j]);

          }
        }
      }
    }
        var weatherDescription = currentWeatherData.weather[0].main;
        var currentTemp = Math.round(currentWeatherData.main.temp);
        var cityName = currentWeatherData.name;
        var minCurrentTemp = Math.round(currentWeatherData.main.temp_min);
        var maxCurrentTemp = Math.round(currentWeatherData.main.temp_max);
        res.render('weather', {
          cityName: cityName,
          currentTemp: currentTemp,
          weatherDescription: weatherDescription,
          minCurrentTemp: minCurrentTemp,
          maxCurrentTemp: maxCurrentTemp,
          hrefForOW: "/locations/" + cityName,
          hrefForDotGov: "/locations/dotgovapi/" +  currentWeatherData.coord.lat + "," + currentWeatherData.coord.lon,
          weatherForecast: dailyForecastData
          //weatherForecast: forecastData.list

        });
  }

  renderWeatherPage(req.params.location);
});

app.get("/locations/dotgovapi/:location", function(req, res){
  async function getDotGovFirstLink(latlon) {
    let url = "https://api.weather.gov/points/" + latlon;
    try {
        let res = await fetch(url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
  }

  //properties.forecast
  async function getDotGovWeather() {

    let url = await (getDotGovFirstLink(req.params.location));
      url = url.properties.forecast;

    try {
        let res = await fetch(url);
        return await res.json();
    } catch (error) {
        console.log(error);
    }
  }
  async function renderWeatherFromDotGovPage(){
        let currentWeatherData = await getDotGovWeather();
        let firstCall = await (getDotGovFirstLink(req.params.location));
        let dailyForecastData = [];

        for (let i=1; i<currentWeatherData.properties.periods.length ; i++){
          //if ((forecastData.list[i].dt_txt).substring(11,13) == "21")
          if ((currentWeatherData.properties.periods[i].startTime).substring(11,13) == "06"){
            for (let j = i; j < currentWeatherData.properties.periods.length ; j+=2){
              currentWeatherData.properties.periods[j].startTime =  currentWeatherData.properties.periods[j].startTime.substring(5,10);
              dailyForecastData.push(currentWeatherData.properties.periods[j]);
            }
          }
        }

        var weatherDescription = currentWeatherData.properties.periods[0].shortForecast;
        var currentTemp = currentWeatherData.properties.periods[0].temperature;
        var cityName = firstCall.properties.relativeLocation.properties.city;
        var shortForecast = currentWeatherData.properties.periods[0].detailedForecast;

        res.render('weatherFromDotGov', {
          cityName: cityName,
          currentTemp: currentTemp,
          weatherDescription: weatherDescription,
          shortForecast: shortForecast,
          hrefForOW: "/locations/" + cityName,
          hrefForDotGov: "/locations/dotgovapi/" + req.params.location,
          weatherForecast: dailyForecastData,

        });
  }
  renderWeatherFromDotGovPage();
});

app.listen(3000, function() {
  console.log("Server is running on port 3000");
});
