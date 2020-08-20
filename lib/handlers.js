var _data = require("./data");
var helpers = require("./helpers");

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

module.export = handlers;
