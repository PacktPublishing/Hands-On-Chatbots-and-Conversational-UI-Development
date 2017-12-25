package weatherman.web.utils;

public class ResponseError {
	private String errorType;
	
	public ResponseError(String message, String... args) {
		this.errorType = String.format(message, args);
	}

	public ResponseError(Exception e) {
		this.errorType = e.getMessage();
	}

	public String getMessage() {
		return this.errorType;
	}
}
