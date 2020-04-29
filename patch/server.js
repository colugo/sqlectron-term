'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.validate = validate;
exports.validateUniqueId = validateUniqueId;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _valida = require('valida');

var _valida2 = _interopRequireDefault(_valida);

var VALID_CLIETNS = ['mysql', 'postgresql', 'sqlserver'];

function serverAddressValidator(ctx) {
  var _ctx$obj = ctx.obj;
  var host = _ctx$obj.host;
  var port = _ctx$obj.port;
  var socketPath = _ctx$obj.socketPath;

  if (!host && !port && !socketPath || (host || port) && socketPath) {
    return {
      validator: 'serverAddressValidator',
      msg: 'You must use host+port or socket path'
    };
  }

  if (socketPath) {
    return undefined;
  }

  if (host && !port || !host && port) {
    return {
      validator: 'serverAddressValidator',
      msg: 'Host and port are required fields.'
    };
  }
}

function clientValidator(ctx, options, value) {
  if (typeof value === 'undefined' || value === null) {
    return undefined;
  }
  if (! ~VALID_CLIETNS.indexOf(ctx.obj.client)) {
    return {
      validator: 'clientValidator',
      msg: 'Invalid client type'
    };
  }
}

var SSH_SCHEMA = {
  host: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 250 }],
  port: [{ sanitizer: _valida2['default'].Sanitizer.toInt }, { validator: _valida2['default'].Validator.len, min: 1, max: 5 }],
  user: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.required }, { validator: _valida2['default'].Validator.len, min: 1, max: 55 }],
  password: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 55 }],
  privateKey: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 250 }]
};

var SERVER_SCHEMA = {
  name: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.required }, { validator: _valida2['default'].Validator.len, min: 1, max: 250 }],
  client: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.required }, { validator: clientValidator }],
  host: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 250 }, { validator: serverAddressValidator }],
  port: [{ sanitizer: _valida2['default'].Sanitizer.toInt }, { validator: _valida2['default'].Validator.len, min: 1, max: 5 }, { validator: serverAddressValidator }],
  socketPath: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 250 }, { validator: serverAddressValidator }],
  database: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.required }, { validator: _valida2['default'].Validator.len, min: 1, max: 100 }],
  user: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.required }, { validator: _valida2['default'].Validator.len, min: 1, max: 55 }],
  password: [{ sanitizer: _valida2['default'].Sanitizer.trim }, { validator: _valida2['default'].Validator.len, min: 1, max: 55 }],
  ssh: [{ validator: _valida2['default'].Validator.schema, schema: SSH_SCHEMA }]
};

/**
 * validations applied on creating/updating a server
 */

function validate(server) {
  var validated;
  return regeneratorRuntime.async(function validate$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_valida2['default'].process(server, SERVER_SCHEMA));

      case 2:
        validated = context$1$0.sent;

        if (validated.isValid()) {
          context$1$0.next = 5;
          break;
        }

        throw validated.invalidError();

      case 5:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function validateUniqueId(servers, serverId) {
  if (!serverId) {
    return;
  }

  var server = servers.find(function (srv) {
    return srv.id === serverId;
  });
  if (!server) {
    return;
  }
  if (serverId && server.id === serverId) {
    return;
  }

  throw new Error('Already exist another server with same id');
}
