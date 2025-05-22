if(!secrets.apiKey) {
    throw Error("API key should be provided!")
  }
  const apiKey = secrets.apiKey;
  // This functions get details about Star Wars characters. This example will showcase usage of HTTP requests and console.logs.
  // 1, 2, 3 etc.
  const playerAddress = args[0];
  
  // Execute the API request (Promise)
  const apiResponse = await Functions.makeHttpRequest({
    url: `https://xhd2vqevdalmltc7kayye4toxy0beows.lambda-url.ap-southeast-2.on.aws/`,
    method: "GET",
    headers: {
      "player": playerAddress,
      "api-key": apiKey
    }
  })
  
  if (apiResponse.error) {
    console.error(apiResponse.error)
    throw Error("Request failed")
  }
  
  const { data } = apiResponse;
  
  //console.log('API response data:', JSON.stringify(data, null, 2));
  if(!data.score){
    console.log("score does not exist")
    throw Error("score does not exist")
  }
  // Return Character Name
  return Functions.encodeInt256(data.score)
  