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
      
      sendMessageTimed(senderId);

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
      let message 	= "O Batata foi desenvolvido para possibilitar a conexão entre profissionais e pessoas que procuram serviços de uma maneira rápida, simples e aberta.";
      let message1 	= "Seus dados estão seguros conosco, disponibilizamos apenas as informações fundamentais para o contato entre cliente e profissional como telefone, email e nome.";
      let message2 	= "Não interferimos em suas negociações, fornecemos apenas uma interface para que o contato seja feito de forma fácil sem a intervenção de terceiros.";

      sendMessage(senderId, {text: message});
      sendMessage(senderId, {text: message1});
      sendMessage(senderId, {text: message2});

      baixeAplicativo(senderId);

      sendMessageTimed(senderId);

    });


  }else{

    if(aContainsB(payload, "email")){

      let email = payload.substring(6,payload.length);

      sendMessage(senderId, {text: "Email: " + email});

    }else if(aContainsB(payload, "endereco")){

      let endereco = payload.substring(9,payload.length);

      sendMessage(senderId, {text: "Endereço: " + endereco});

    }
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

        case "oi":
          sendMessageWithButton(senderId, message);
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
	let explicacao = ". Insira o profissional dentre os apresentados e envie-nos a mensagem, assim podemos retornar o contato de um profissional inscrito no Batata!"

	firebase.firelord.REF
		.child('usuarios')
		.child('Lavras')
		.child('Disponiveis')
		.once('value', function(snap){

			let arraySnap = [];

			snap.forEach(function (childSnap){

				arraySnap.push(childSnap.key);
			});

			console.log(arraySnap.join(', '));

			let resultado = arraySnap.join(', ');

			let final = possibilidades + resultado + explicacao;

			sendMessage(senderId, {text: final});
		});

}

function sendMessageTimed(senderId){

  var messageSend = "Caso precise de mim basta mandar a palavra oi e voltamos a conversar, ou digite o profissional que você procura.";

  var enviarMensagem = setTimeout(function(){sendMessage(senderId, {text: messageSend})},3500);
 
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

        let arraySnap = [];

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
  let resposta2 = ", seu nome é ";
  let resposta3 = ", sua especialidade em ";
  let resposta4 = ", você pode entrar em contato através do telefone ";
  let resposta5 = ", ou do email ";
  let resposta6 = ". Não perca tempo e entre em contato!"

  let min          = Math.ceil(0);

  let max          = Math.floor(Object.keys(arraySnap).length);

  let randNum      = Math.floor(Math.random() * (max - min) + min);

  if(randNum < arraySnap.length){

    let profissional = arraySnap[randNum];

    let resposta = resposta1 + profissional.profissao + 
    resposta2 + profissional.nome + 
    resposta3 + profissional.especializacao + 
    resposta4 + profissional.telefone +
    resposta5 + profissional.email +
    resposta6;

    sendMessage(senderId, {text: resposta});

    if(profissional.empresa !== undefined && profissional.empresa !== null)
      contatoEmpresa(senderId, profissional.empresa);
    else
      sendMessageTimed(senderId);
    
    var enviarMensagem = setTimeout(function(){baixeAplicativo(senderId)},2000);
    

  }else{

    sendMessage(senderId, {text: "Desculpe, me confundi. Poderia iniciar novamente?"});

  }

} 

function contatoEmpresa(senderId, empresa){

  let resposta1 = "Caso precise de algo, entre em contato com ";
  let resposta2 = ", através telefone ";
  let resposta3 = ", do email ";
  let resposta4 = ", você pode também acessar a página ";
  let resposta5 = " ou ir ao endereço ";
  let resposta6 = ". Entre em contato e tenha acesso a tudo que precisa.";

  if(empresa !== null){
    if( empresa.nome      !== undefined && 
        empresa.telefone  !== undefined &&
        empresa.email     !== undefined &&
        empresa.site      !== undefined &&
        empresa.endereco  !== undefined &&
        empresa.cidade    !== undefined &&
        empresa.estado    !== undefined ){

      botaoEmpresa(senderId, empresa);



    }
  }

}

function botaoEmpresa(senderId, empresa){

  var telefone = empresa.telefone.replace(/[^\d]+/g,'');

  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Precisando de algo conte com " + empresa.nome,
          "subtitle": empresa.descricao,
          "image_url":"https://lh3.googleusercontent.com/LWvXzh4uXBeju_0vsKWP21sUKNSnFeF2aS2DE68i-nCIoYj8VEiOIpkkWUO48sBzFg=s180-rw",
          "buttons": [
            {
              "type":"web_url",
              "url": empresa.site,
              "title":"Acesse a página",
              "webview_height_ratio": "full"
            }, {
              "type":"phone_number",
              "title":"Telefone",
              "payload":"+55" + telefone
            }, {
              "type": "postback",
              "title": "Email",
              "payload": "email_"+empresa.email,
            }
          ]
        }]
      }
    }
  }

  sendMessage(senderId, messageData);
  botaoEndereco(senderId,empresa);

}

function botaoEndereco(senderId, empresa){

  var telefone = empresa.telefone.replace(/[^\d]+/g,'');

  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Vá até " + empresa.nome,
          "subtitle": empresa.endereco,
          "buttons": [
            {
              "type":"web_url",
              "url": "https://www.google.com/maps/?q="+ empresa.endereco + " - " + empresa.cidade + ", " + empresa.estado,
              "title":"Mapa",
              "webview_height_ratio": "full"
            }
          ]
        }]
      }
    }
  }

  var enviarEndereco = setTimeout(function(){sendMessage(senderId, messageData)},2000);
  sendMessageTimed(senderId);

}

function aContainsB (a, b) {
    return a.indexOf(b) >= 0;
}


/*

https://www.google.com/maps/?q=18.519825,73.929449*/