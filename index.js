var http = require("http");
var https = require("https");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var config = require("./lib/config");
var fs = require("fs");
//var handlers = require("./lib/handlers");
var _data = require("./lib/data");
var helpers = require("./lib/helpers");
//---CRUD OPERATIONS Starts here---
//var _data = require("./lib/data");

// _data.create("test", "newFile", { foo: "bar" }, function (err) {
//   console.log("This was the error ", err);
// });

// _data.read("test", "newFile", function (err, data) {
//   console.log("This was the error: ", err, "\n And this is the Data: ", data);
// });

// _data.update("test", "newFile", { fizz: "buzz" }, function (err) {
//   console.log("This was the error: ", err);
// });

// _data.delete("test", "newFile", function (err) {
//   console.log("This was the error: ", err);
// });

//---CRUD OPERATIONS Ends here---

var httpServer = http.createServer(function (request, response) {
  unifiedServer(request, response);
});

httpServer.listen(config.httpPort, function () {
  console.log(
    "The Server is listening at port: " +
      config.httpPort +
      " and mode: " +
      config.envName
  );
});
var httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem"),
};
var httpsServer = http.createServer(httpsServerOptions, function (
  request,
  response
) {
  unifiedServer(request, response);
});

httpsServer.listen(config.httpsPort, function () {
  console.log(
    "The Server is listening at port: " +
      config.httpsPort +
      " and mode: " +
      config.envName
  );
});

var unifiedServer = function (request, response) {
  var parseUrl = url.parse(request.url, true);
  var path = parseUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");
  var method = request.method.toLowerCase();
  var queryStringObj = parseUrl.query;
  var header = request.headers;
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  request.on("data", function (data) {
    buffer += decoder.write(data);
  });
  request.on("end", function () {
    buffer += decoder.end();

    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    /*    var chosenHandler = router[trimmedPath] || handlers.notFound;*/
    var data = {
      trimmedPath: trimmedPath,
      queryStringObj: queryStringObj,
      method: method,
      header: header,
      payload: buffer,
      //payload: helpers.parseJsonToObject(buffer),
    };

    chosenHandler(data, function (statusCode, payload) {
      statusCode = typeof statusCode == "number" ? statusCode : 200;
      payload = typeof payload == "object" ? payload : {};

      var payloadString = JSON.stringify(payload);

      response.setHeader("Content-Type", "application/json");
      response.writeHead(statusCode);
      response.end(payloadString);
      console.log(trimmedPath, statusCode);
    });
  });
};

/*-------HANDLERS CODE - Starts Here-------
-------------------------------------------*/
var handlers = {};

handlers.users = function (data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.post = function (data, callback) {
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && tosAgreement && password) {
    _data.read("users", phone, function (err, data) {
      if (err) {
        var hashPassword = helpers.hash(password);

        if (hashPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashpassword: hashPassword,
            tosAgreement: true,
          };

          _data.create("users", phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        callback(400, { Error: "A user with that phone already exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing Required Fields" });
  }
};
handlers._users.get = function (data, callback) {
  var phone =
    typeof data.queryStringObj.phone == "string" &&
    data.queryStringObj.phone.trim().length == 10
      ? data.queryStringObj.phone.trim()
      : false;

  if (phone) {
    _data.read("users", function (err, data) {
      if (!err && data) {
        delete data.hashPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};
handlers._users.put = function (data, callback) {};
handlers._users.delete = function (data, callback) {};

handlers.sample = function (data, callback) {
  callback(406, { name: "sample handler..." });
};

handlers.ping = function (data, callback) {
  callback(200);
};

handlers.notFound = function (data, callback) {
  callback(404);
};

/*-------HANDLERS CODE - Ends Here-------
-----------------------------------------*/

var router = {
  ping: handlers.ping,
  users: handlers.users,
  notFound: handlers.notFound,
};
