package weatherman.web.utils;

import com.google.gson.Gson;

import spark.ResponseTransformer;

public class JSONUtil {
	public static String toJson(Object object) {
		return new Gson().toJson(object);
	}
	public static ResponseTransformer json() {
		return JSONUtil::toJson;
	}
	
}
