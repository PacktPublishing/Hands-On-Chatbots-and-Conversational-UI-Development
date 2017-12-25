package weatherman.weather;

import java.io.IOException;
import java.util.HashMap;

import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;

public class Weather {

	String apiKey = "YOUR-API-KEY";
	HashMap<String,String> cityCodes;
	
	
	public static void main(String[] args) {
		try {
			(new Weather()).getWeatherReport("2643743", 0);
		} catch (ClientProtocolException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public Weather(){
		loadCityCodes();
	}
	
	
	public void loadCityCodes(){
		cityCodes = new HashMap<String,String>();
		cityCodes.put("London,GB", "2643743");
		cityCodes.put("London,US","4119617");
		cityCodes.put("Paris", "2988507");
	}
	
	public JsonObject getCityCode(String cityName){
		JsonObject out = new JsonObject();
		out.add("cityCode", null);
		
		if (cityCodes.containsKey(cityName)){
			out.add("cityCode", new JsonPrimitive(cityCodes.get(cityName)));
			out.add("cityName", new JsonPrimitive(cityName));
		}
		
		return out;
	}
	
	public String getWeatherReport(String cityCode, Integer i) 
			throws ClientProtocolException, IOException{
		
		JsonObject currentWeather = null;
		if (cityCode != null){ 
			currentWeather = getWeatherAtTime(cityCode, i);
		}
		
		
		String weatherReport = null;
		if (currentWeather != null){
			JsonObject weather = currentWeather.get("weather")
									.getAsJsonArray().get(0).getAsJsonObject();
			Double avgTemp = Double.valueOf(currentWeather.get("main").getAsJsonObject().get("temp").getAsString()) - 273.15;
			String avgTempSt = String.valueOf(avgTemp).split("\\.")[0];
			
			weatherReport = "The temperature is " + avgTempSt + " degrees Celsius. " 
					+ weather.get("description").getAsString() + ".";
		}
		//System.out.println(weatherReport);
		return weatherReport;
	}

	public JsonObject getWeatherAtTime(String cityCode, Integer i) 
			throws ClientProtocolException, IOException{
		
		JsonObject json = getWeather(cityCode);
		JsonArray list = json.get("list").getAsJsonArray();
		JsonObject weatherAtTime = list.get(i).getAsJsonObject();
		return weatherAtTime;
	}
	
	public JsonObject getWeather(String cityCode) 
			throws ClientProtocolException, IOException{
		
		//step 1: Prepare the url
		String url = "http://api.openweathermap.org/data/2.5/forecast?id=" 
					+ cityCode + "&APPID=" + apiKey ;
		
		//step 2: Create a HTTP client
		HttpClient httpclient = HttpClientBuilder.create().build();
		
		//step 3: Create a HTTPGet object and execute the url
		HttpGet httpGet = new HttpGet(url);
		HttpResponse response = httpclient.execute(httpGet);

        //step 4: Process the result
		JsonObject json = null;
        int statusCode = response.getStatusLine().getStatusCode();
        if (statusCode == 200) {
            String response_string = EntityUtils.toString(response.getEntity());
            json = (new JsonParser()).parse(response_string)
            						.getAsJsonObject();
            Gson gson = new GsonBuilder().setPrettyPrinting().create();
            String prettyJson = gson.toJson(json);
            System.out.println(prettyJson);
        }
		
		return json;
	}
	
}
