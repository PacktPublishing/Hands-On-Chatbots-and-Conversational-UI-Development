package weatherman.chatbot;

import java.io.IOException;
import java.util.Scanner;

import org.apache.http.client.ClientProtocolException;

import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import weatherman.weather.Weather;

public class Chatbot {

	JsonObject context;
	Weather weather;
	
	public static void main(String[] args){
		Chatbot c = new Chatbot();
		Scanner scanner = new Scanner(System.in);
		String userUtterance;
		
		do {
			System.out.print("User:");
			userUtterance = scanner.nextLine();
			
			JsonObject userInput = new JsonObject();
			userInput.add("userUtterance", new JsonPrimitive(userUtterance));
			JsonObject botOutput = c.process(userInput);
			String botUtterance = "";
			if (botOutput != null && botOutput.has("botUtterance")) {
				botUtterance = botOutput.get("botUtterance").getAsString();
			}
			System.out.println("Bot:" + botUtterance);
			
		} while (!userUtterance.equals("QUIT"));
		scanner.close();
	}
	
	public Chatbot(){
		context = new JsonObject();
		context.add("currentTask", new JsonPrimitive("none"));
		weather = new Weather();
	}
	
	public JsonObject process(JsonObject userInput){
		
		//step1: process user input
		JsonObject userAction = processUserInput(userInput);
		
		//step2: update context
		updateContext(userAction);
		
		//step3: identify bot intent
		identifyBotIntent();
		
		//step4: structure output
		JsonObject out = getBotOutput();
		
		return out;
	}
	
	public String processFB(JsonObject userInput){
		JsonObject out = process(userInput);
		return out.toString();
	}
	
	public JsonObject processUserInput(JsonObject userInput){
		String userUtterance = null;
		JsonObject userAction = new JsonObject();
		
		//default case
		userAction.add("userIntent", new JsonPrimitive(""));
		
		
		if (userInput.has("userUtterance")){
			userUtterance = userInput.get("userUtterance").getAsString();
			userUtterance = userUtterance.replaceAll("%2C", ",");
		}
		if (userUtterance.matches("(hi|hello)( there)?")){
			userAction.add("userIntent", new JsonPrimitive("greet"));
		}
		else if (userUtterance.matches("(thanks)|(thank you)")){
			userAction.add("userIntent", new JsonPrimitive("thank"));
		}
		else if (userUtterance.matches("current weather") || userUtterance.matches("weather now")){
			userAction.add("userIntent", new JsonPrimitive("request_current_weather"));
		}
		else {
			String currentTask = context.get("currentTask").getAsString();
			String botIntent = context.get("botIntent").getAsString();
			if (currentTask.equals("requestWeather") && 
					botIntent.equals("requestPlace")){
				JsonObject cityInfo = weather.getCityCode(userUtterance);
				if (!cityInfo.get("cityCode").isJsonNull()){
					userAction.add("userIntent", new JsonPrimitive("informCityCode"));
					userAction.add("cityCode", cityInfo.get("cityCode"));
					userAction.add("cityName", new JsonPrimitive(userUtterance));
				}
			}
		}
		
		return userAction;
	}
	
	public void updateContext(JsonObject userAction){
		
		//copy userIntent
		context.add("userIntent", userAction.get("userIntent"));
		
		//
		String userIntent = context.get("userIntent").getAsString();
		if (userIntent.equals("greet")){
			context.add("currentTask", new JsonPrimitive("greetUser"));
		}
		else if (userIntent.equals("request_current_weather")){
			context.add("currentTask", new JsonPrimitive("requestWeather"));
			context.add("timeOfWeather", new JsonPrimitive("current"));
			context.add("placeOfWeather", new JsonPrimitive("unknown"));
			context.add("placeName", new JsonPrimitive("unknown"));
		}
		else if (userIntent.equals("informCityCode")){
			context.add("placeOfWeather", userAction.get("cityCode"));
			context.add("placeName", userAction.get("cityName"));
		}
		else if (userIntent.equals("thank")){
			context.add("currentTask", new JsonPrimitive("thankUser"));
		}
	}
	
	public void identifyBotIntent(){
		String currentTask = context.get("currentTask").getAsString();
		if (currentTask.equals("greetUser")){
			context.add("botIntent", new JsonPrimitive("greetUser"));
		}
		else if (currentTask.equals("thankUser")){
			context.add("botIntent", new JsonPrimitive("thankUser"));
		}
		else if (currentTask.equals("requestWeather")){
			if (context.get("placeOfWeather").getAsString().equals("unknown")){
				context.add("botIntent", new JsonPrimitive("requestPlace"));
			} 
			else {
				Integer time = -1;
				if (context.get("timeOfWeather").getAsString().equals("current")){
					time = 0;
				}
				String weatherReport = null;
				try {
					weatherReport = weather.getWeatherReport(context.get("placeOfWeather").getAsString(), time);
				} catch (ClientProtocolException e) {
					e.printStackTrace();
				} catch (IOException e) {
					e.printStackTrace();
				}
				if (weatherReport != null){
					context.add("weatherReport", new JsonPrimitive(weatherReport));
					context.add("botIntent", new JsonPrimitive("informWeather"));
				}
			}
		}
		else {
			context.add("botIntent", null);
		}
	}
	
	public JsonObject getBotOutput(){
		
		JsonObject out = new JsonObject();
		String botIntent = context.get("botIntent").getAsString();
		
		String botUtterance = "";
		if (botIntent.equals("greetUser")){
			botUtterance = "Hi there! I am WeatherMan, your weather bot! "
					+ "What would you like to know? Current weather or forecast?";
		}
		else if (botIntent.equals("thankUser")){
			botUtterance = "Thanks for talking to me! Have a great day!!";
		}
		else if (botIntent.equals("requestPlace")){
			botUtterance = "Ok. Which city?";
		}
		else if (botIntent.equals("informWeather")){
			String timeDescription  = getTimeDescription(context.get("timeOfWeather").getAsString());
			String placeDescription = getPlaceDescription();
			String weatherReport = context.get("weatherReport").getAsString();
			botUtterance = "Ok. Weather " + timeDescription + " in " + placeDescription + ". " + 
							weatherReport;
					
		}
		out.add("botIntent", context.get("botIntent"));
		out.add("botUtterance", new JsonPrimitive(botUtterance));
		return out;
	}

	private String getPlaceDescription() {
		return context.get("placeName").getAsString();
	}

	private String getTimeDescription(String timeOfWeather) {
		if (timeOfWeather.equals("current")){
			return "now";
		}
		return null;
	}
}
