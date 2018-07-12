require('./services/firebase');
var firebase 	   = require('./services/firebase');
var express 	   = require("express");
var request 	   = require("request");
var bodyParser 	 = require("body-parser");
var normalizer   = require("normalize-strings");

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
      var message = greeting + "Eu sou seu atendente no Batata, vou auxiliar-lhe à começar com o Batata app. Por favor escolha uma das opçoes abaixo:";
      sendMessage(senderId, {text: message});

      sendMessageWithButton(senderId, message);

    });

  }else if(payload === "profissional"){

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
      }
      var message = "Muito bom " + name + ", assista o tutorial no link https://www.facebook.com/appbatata/videos/265830567322283/ , e saiba como oferecer seus serviços no Batata!";
      sendMessage(senderId, {text: message});

      baixeAplicativo(senderId);

      //sendMessage(senderId, {text: "Baixe o aplicativo na google play através do link https://play.google.com/store/apps/details?id=com.gikacredgmail.gika, e facilite sua vida com o Batata!"});

    });

  }else if(payload === "cliente"){

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
      }
      var message = "Ok "+ name + ", no Batata você poderá encontrar diversos profissionais para atender as suas necessidades!";
      sendMessage(senderId, {text: message});

      sendAnswer(senderId);

     // baixeAplicativo(senderId);

    });

  }else if(payload === "saber"){

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
      }
      var message 	= "O Batata foi desenvolvido para possibilitar a conexão entre profissionais e pessoas que procuram serviços de uma maneira rápida, simples e aberta.";
      var message1 	= "Seus dados estão seguros conosco, disponibilizamos apenas as informações fundamentais para o contato entre cliente e profissional como telefone, email e nome.";
      var message2 	= "Não interferimos em suas negociações, fornecemos apenas uma interface para que o contato seja feito de forma fácil sem a intervenção de terceiros.";

      sendMessage(senderId, {text: message});
      sendMessage(senderId, {text: message1});
      sendMessage(senderId, {text: message2});

      baixeAplicativo(senderId);

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
          	sendResult(senderId, formattedMsg);
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
					"title": "O que você precisa?",
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

function baixeAplicativo(sender){

	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [{
					"title": "Baixe o Batata",
					"subtitle": "Facilite sua vida com um aplicativo que coloca na sua mão tudo o que você precisa!",
					"image_url":"https://lh3.googleusercontent.com/LWvXzh4uXBeju_0vsKWP21sUKNSnFeF2aS2DE68i-nCIoYj8VEiOIpkkWUO48sBzFg=s180-rw",
					"buttons": [{
						"type":"web_url",
            			"url":"https://play.google.com/store/apps/details?id=com.gikacredgmail.gika",
            			"title":"Instale o Batata",
            			"webview_height_ratio": "full"
					}, {
						"type": "postback",
						"title": "Quero saber mais",
						"payload": "saber",
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

async function sendAnswer(senderId) {

	let possibilidades = "Você poderá optar entre as seguintes opções: ";
	let explicacao = ". Insira o profissional dentre os apresentados e envie-nos a mensagem, deste modo podemos enviar o contato de um profissional!"

	firebase.firelord.REF
		.child('usuarios')
		.child('Lavras')
		.child('Disponiveis')
		.once('value', function(snap){

			var arraySnap = [];

			snap.forEach(function (childSnap){

				arraySnap.push(childSnap.key);
			});

			console.log(arraySnap.join(', '));

			var resultado = arraySnap.join(', ');

			var final = possibilidades + resultado;

			sendMessage(senderId, {text: final});
		});

}

async function sendResult(senderId, pesquisa) {

  let profissional = normalizer(pesquisa);

  firebase.firelord.REF
    .child('usuarios')
    .child('Lavras')
    .child('profissionais')
    .child('Padrao')
    .child('comum')
    .child(profissional)
    .once('value', function(snap){

      if(snap !== null){

        var arraySnap = [];

        snap.forEach(function(childSnap){

          arraySnap.push(childSnap.val())

        });

        if(arraySnap.length > 0){

          randomResult(senderId, arraySnap);

        }else{

          sendMessage(senderId, {text: "Desculpe não encontramos o profissional que você procura."});
          sendAnswer(senderId);
        }

      }else{

        sendMessage(senderId, {text: "Desculpe não encontramos o profissional que você procura."});
        sendAnswer(senderId);
      }

    });

}

function randomResult (senderId, arraySnap) {

  let resposta1 = "Aproveite, nos encontramos um ";
  let resposta2 = "seu nome é ";
  let resposta3 = "Ele é especialista em ";
  let resposta4 = "Você pode entrar em contato através do telefone ";
  let resposta5 = "ou do email. ";
  let resposta6 = "Não perca tempo e entre em contato!"

  let min          = Math.ceil(0);

  let max          = Math.floor(Object.keys(arraySnap).length);

  let randNum      = Math.floor(Math.random() * (max - min) + min);

  if(randNum < arraySnap.length){

    let profissional = arraySnap[randNum];

    console.log("Profissional", "" + arraySnap.length + ", " + randNum+ ", "+ JSON.stringify(profissional,null, ", ");

    sendMessage(senderId, {text: resposta1});

  }else{

    sendMessage(senderId, {text: "Desculpe, me confundi. Poderia iniciar novamente?"});

  }

} 


