var express 	= require("express");
var request 	= require("request");
var bodyParser 	= require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

app.get("/", function (req, res) {
  res.send("Deployed!");
});

app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.postback) {
          processPostback(event);
        }else if(event.message){
        	processMessage(event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Olá " + name + ". ";
      }
      var message = greeting + "Eu sou seu atendente no Batata, vou auxiliar-lhe a começar com o Batata app. Por favor escolha uma das opçoes abaixo:";
     // sendMessage(senderId, {text: message});

     sendMessageWithButton(senderId, message);
    });
  }
}

function processMessage(event) {
  if (!event.message.is_echo) {
    var message = event.message;
    var senderId = event.sender.id;

    console.log("Received message from senderId: " + senderId);
    console.log("Message is: " + JSON.stringify(message));

    // You may get a text or attachment but not both
    if (message.text) {
      var formattedMsg = message.text.toLowerCase().trim();

      // If we receive a text message, check to see if it matches any special
      // keywords and send back the corresponding movie detail.
      // Otherwise, search for new movie.
      switch (formattedMsg) {

        case "cliente":
        	sendMessage(senderId, {text: "Entre com as uma das opções abaixo e veremos o que temos no batata para lhe oferecer!"});
        	break;
        
        case "profissional":
          	sendMessage(senderId, {text: "Legal, Assista o tutorial no link e saiba como oferecer seus serviços no Batata!"});
          	break;

        default:
          	sendMessage(senderId, {text: "Desculpe, não entendi sua mensagem."});
      }
    } else if (message.attachments) {
      sendMessage(senderId, {text: "Desculpe, não entendi sua mensagem."});
    }
  }
}


function sendMessageWithButton(sender, message){

	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"text": message,
					"buttons": [{
						"type": "postback",
						"title": "Sou  profissional",
						"payload": "profissional",
					}, {
						"type": "postback",
						"title": "Procuro serviços",
						"payload": "cliente",
					}],
				}]
			}
		}
	}

	sendMessage(sender, messageData);

}
// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}


/*
function findMovie(userId, movieTitle) {
  request("http://www.omdbapi.com/?type=movie&amp;t=" + movieTitle, function (error, response, body) {
    if (!error &amp;&amp; response.statusCode === 200) {
      var movieObj = JSON.parse(body);
      if (movieObj.Response === "True") {
        var query = {user_id: userId};
        var update = {
          user_id: userId,
          title: movieObj.Title,
          plot: movieObj.Plot,
          date: movieObj.Released,
          runtime: movieObj.Runtime,
          director: movieObj.Director,
          cast: movieObj.Actors,
          rating: movieObj.imdbRating,
          poster_url:movieObj.Poster
        };
        var options = {upsert: true};
        Movie.findOneAndUpdate(query, update, options, function(err, mov) {
          if (err) {
            console.log("Database error: " + err);
          } else {
            message = {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [{
                    title: movieObj.Title,
                    subtitle: "Is this the movie you are looking for?",
                    image_url: movieObj.Poster === "N/A" ? "http://placehold.it/350x150" : movieObj.Poster,
                    buttons: [{
                      type: "postback",
                      title: "Yes",
                      payload: "Correct"
                    }, {
                      type: "postback",
                      title: "No",
                      payload: "Incorrect"
                    }]
                  }]
                }
              }
            };
            sendMessage(userId, message);
          }
        });
      } else {
          console.log(movieObj.Error);
          sendMessage(userId, {text: movieObj.Error});
      }
    } else {
      sendMessage(userId, {text: "Something went wrong. Try again."});
    }
  });
}


/*
function processMessage(event) {
  if (!event.message.is_echo) {
    var message = event.message;
    var senderId = event.sender.id;

    console.log("Received message from senderId: " + senderId);
    console.log("Message is: " + JSON.stringify(message));

    // You may get a text or attachment but not both
    if (message.text) {
      var formattedMsg = message.text.toLowerCase().trim();

      // If we receive a text message, check to see if it matches any special
      // keywords and send back the corresponding movie detail.
      // Otherwise, search for new movie.
      switch (formattedMsg) {
        case "plot":
        case "date":
        case "runtime":
        case "director":
        case "cast":
        case "rating":
          getMovieDetail(senderId, formattedMsg);
          break;

        default:
          findMovie(senderId, formattedMsg);
      }
    } else if (message.attachments) {
      sendMessage(senderId, {text: "Sorry, I don't understand your request."});
    }
  }
}

*/