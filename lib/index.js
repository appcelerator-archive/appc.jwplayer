var _ = require('lodash'),
  async = require('async'),
  crypto = require('crypto'),
  pkginfo = require('pkginfo')(module) && module.exports

var sha1 = require('sha1')
var md5 = require('crypto-js/md5')
var request = require('request')

// --------- com.appcelerator.jwplayer connector -------
exports.create = function (Arrow, server) {
  var Connector = Arrow.Connector,
    Collection = Arrow.Collection,
    Instance = Arrow.Instance

	// Because the primary key changes with JWPlayer API's
  var primaryKeys = {
    defaultKey: 'key',
    channels: 'channel_key',
    videos: 'video_key',
    conversions: 'key'
  }

	// return a Connector Class
  return Connector.extend({
		/*
		 Configuration.
		 */
    pkginfo: _.pick(pkginfo, 'name', 'version', 'description', 'author', 'license', 'keywords', 'repository'),
    logger: server && server.logger || Arrow.createLogger({}, { name: pkginfo.name }),

		// if you need to do this dynamically to load models, call this method after connect but before your callback
		// and set the models value on your connector instance
    models: Arrow.loadModelsForConnector(pkginfo.name, module),
		/*
		 Metadata.
		 */

		/**
		 * Provides metadata to be used to validate the config.
		 * @param callback
		 */
    fetchMetadata: function (callback) {
      callback(null, {
        fields: [
          Arrow.Metadata.Text({
            name: 'api_key',
            description: 'API Key',
            required: true
          }),
          Arrow.Metadata.Text({
            name: 'api_secret',
            description: 'API Secret',
            required: true
          }),
          Arrow.Metadata.Text({
            name: 'version',
            description: 'Version of API',
            required: true
          })
        ]
      })
    },
		/**
		 * Called before your connect to allow you to specify additional configuration, or mutate the configuration,
		 * before validation and connection. This is optional.
		 * @param callback
		 */
    fetchConfig: function (callback) {
      callback(null, this.config)
    },

    fetchSchema: function (next) {
			// schemaless
      next(null, {})
    },

		/*
		 CRUD.
		 */
    findOne: function (Model, id, callback) {
      var endpoint = Model.metadata.endpoint
      var key = Model.metadata.key || Model.metadata.endpoint.split('/')[0]

			// Warn if no URL in where key is provided
      if (!endpoint || !key) {
        this.logger.warn('You MUST provide an endpoint key in the model metadata for this to work')
      }

      var params = {}
      params[primaryKeys[key]] = id

      this.makeRequest(endpoint + '/show', params, function (err, data) {
        if (err) {
          callback(err, null)
        } else {
          var responseKey = key.substring(0, key.length - 1)
          var instance = Model.instance(data[responseKey], true)
          instance.setPrimaryKey(data[responseKey][primaryKeys.defaultKey])

          callback(null, new Collection(Model, instance))
        }
      })
    },

    findAll: function (Model, callback) {
      var endpoint = Model.metadata.endpoint
      var key = Model.metadata.key || Model.metadata.endpoint.split('/')[0]

			// Warn if no URL in where key is provided
      if (!endpoint || !key) {
        this.logger.warn('You MUST provide an endpoint key in the model metadata for this to work')
      }

      this.makeRequest(endpoint + '/list', {}, function (err, data) {
        if (err) {
          callback(err, null)
        } else {
          var rows = []
          data[key].forEach(function (row) {
            var instance = Model.instance(row, true)
            instance.setPrimaryKey(row[primaryKeys.defaultKey])
            rows.push(instance)
          })
          callback(null, new Collection(Model, rows))
        }
      })
    },

    query: function (Model, options, callback) {
      var endpoint = Model.metadata.endpoint
      var key = Model.metadata.key || Model.metadata.endpoint.split('/')[0]

			// Warn if no URL in where key is provided
      if (!endpoint || !key) {
        this.logger.warn('You MUST provide an endpoint key in the model metadata for this to work')
      }

			// Warn that the other query options are not implemented.
      if (options.page !== 1 || options.per_page !== 10 || options.skip !== 0 || options.limit !== 10 || options.sel || options.unsel || options.order) {
        this.logger.warn('page, per_page, skip, limit, sel, unsel and order have not been implemented by this connector!')
      }

      this.makeRequest(endpoint + '/list', options.where || {}, function (err, data) {
        if (err) {
          callback(err, null)
        } else {
          var rows = []
          data[key].forEach(function (row) {
            var instance = Model.instance(row, true)
            instance.setPrimaryKey(row[primaryKeys.defaultKey])
            rows.push(instance)
          })
          callback(null, new Collection(Model, rows))
        }
      })
    },
    makeRequest: function (_endpoint, _params, _callback) {
      if (typeof _params === 'function') {
        _callback = _params
      }

      request({
        url: this.buildUrl(_endpoint, _params),
        method: 'GET',
        json: true
      }, function (error, response, body) {
				// Wow JWPlayer's API is horrible sometimes...
        if (error || response.statusCode != 200 || body.status === 'error') {
					// UGH
          if (response && response.body) {
            response.body.code = response.statusCode
          }

          _callback(error || response.body, null)
        } else {
          _callback(null, body)
        }
      })
    },
    buildUrl: function (_class, _params) {
      _params = _params || {}
      var url = this.config.endpoint + this.config.version + '/' + _class

      var args = {
        api_format: 'json',
        api_key: this.config.api_key,
        api_nonce: Math.floor(Math.random() * 90000000) + 10000,
        api_timestamp: Math.floor(new Date().getTime() / 1000)
      }

      var request = this.signRequest(_.extend(args, _params))

      url += '?api_signature=' + request.signature + '&' + request.queryString

      return url
    },
    signRequest: function (_params) {
      var queryString = ''

      Object.keys(_params)
				.sort()
				.forEach(function (prop, index) {
  if (queryString.length > 0) {
    queryString += '&'
  }

  queryString += prop + '=' + _params[prop]
})

      return {
        signature: sha1(queryString + this.config.api_secret),
        queryString: queryString
      }
    }
  })
}
