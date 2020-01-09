"use strict";

System.register(["lodash"], function (_export, _context) {
  "use strict";

  var _, _createClass, globalCurrentToken, globalHOST, userCredentials, GenericDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
      globalHOST = "knl640.krj.gie";
      userCredentials = {
        "user_credentials": {
          "username": "ncrinon", "password": "krj"
        },
        "generate_refresh_token": false
      };

      _export("GenericDatasource", GenericDatasource = function () {
        function GenericDatasource(instanceSettings, $q, backendSrv, templateSrv) {
          _classCallCheck(this, GenericDatasource);

          // "type": "mgent-appresponse-json-datasource"
          this.type = instanceSettings.type;
          // "url": "/api/datasources/proxy/26"
          this.url = instanceSettings.url;
          // "name": "AppResponse"
          this.name = instanceSettings.name;
          this.targetID = instanceSettings.targetID;
          this.q = $q;
          // infos about a lot of things about backend server and user logged
          this.backendSrv = backendSrv;
          this.templateSrv = templateSrv;
          this.withCredentials = instanceSettings.withCredentials;
          this.headers = { 'Content-Type': 'application/json' };

          if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
            this.headers['Authorization'] = instanceSettings.basicAuth;
          }
        }

        // Ask '/query' end point, use function buildQueryParameters() to build data
        // These data are sent to Python 


        _createClass(GenericDatasource, [{
          key: "query",
          value: function query(options) {
            var query = this.buildQueryParameters(options);
            query.targets = query.targets.filter(function (t) {
              return !t.hide;
            });

            // Debugging purpose
            for (var i = 0; i <= query.targets.length; i++) {
              console.log("Query " + i);
              console.log(query.targets[i]);
            }

            if (query.targets.length <= 0) {
              return this.q.when({ data: [] });
            }

            if (this.templateSrv.getAdhocFilters) {
              query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
            } else {
              query.adhocFilters = [];
            }
            return this.doRequest({
              url: this.url + '/query',
              data: query,
              method: 'POST'
            });
          }
        }, {
          key: "testDatasource",
          value: function testDatasource() {
            return this.doRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: "testPrint",
          value: function testPrint() {
            var HOST = "knl640.krj.gie";
            var USERNAME = "ncrinon";
            var PASSWORD = "krj";
          }
        }, {
          key: "tryAuthentication",
          value: function tryAuthentication() {
            // FONCTIONNE ::::: FIREFOX DEV Juste un GET infos de la sonde ET RECUPERATION DE REPONSE DANS ANALYSE NETWORK 
            // tryAuthentication(credentials){
            var url = 'https://knl640.krj.gie/api/common/1.0/auth_info';
            var json = "";
            var response = fetch(url, {
              referrerPolicy: 'unsafe-url',
              mode: 'no-cors',
              method: 'GET', // or 'PUT'
              headers: {
                // Ces headers passent a condition que la clef soit reconnue par le navigateur
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
              }
            }).then(json).then(function (data) {
              console.log("console.log(fetch)");
              console.log('Request succeeded with JSON response', data);
            });
            console.log(JSON.stringify(response));

            // ENVOYER DES CREDNENTIAL === CREDENTIAL EST UNE OPTION DE FETCH


            // TENTER XHR ###################################################################

            var opts = { agent: false };
            // SSL options for Node.js client
            // opts.pfx = this.pfx;
            // opts.key = this.key;
            // opts.passphrase = this.passphrase;
            // opts.cert = this.cert;
            // opts.ca = this.ca;
            // opts.ciphers = this.ciphers;
            opts.rejectUnauthorized = false;

            var xhr = this.xhr = new XMLHttpRequest(opts);

            xhr.addEventListener("readystatechange", function () {
              if (this.readyState === this.DONE) {
                console.log("console.log(xhr) 1");
                console.log(this.responseText);
              }
            });

            xhr.open("GET", url);
            // xhr.setRequestHeader(`api-key`, apiKeySecured);

            xhr.send();
            console.log("console.log(xhr) 2");
            console.log(xhr);

            // fetch(url, {
            //   rejectUnauthorized: false,
            //   agent:false,
            //   method: 'get',
            //   // mode: 'no-cors',
            //   // Ces headers passent a condition que la clef soit reconnue par le navigateur
            //   headers: {
            //     'Accept': 'application/json, text/plain, */*',
            //     'Content-Type': 'application/json',
            //   }
            //   // body: JSON.stringify({a: 7, str: 'Some string: &=&'})
            //   }).then(res=>res.json())
            //     .then(res => console.log(res));


            return "RETURN";
          }
        }, {
          key: "getNewToken",
          value: function getNewToken(credentials) {
            console.log("Direction : tryAuthentication");
            console.log(this.headers);
            var reponse = this.tryAuthentication(credentials);
            // var dictionnaire = reponse.json()
            // On extrait le token
            // var token = dictionnaire['access_token']
            var token = '';
            return token;
          }
        }, {
          key: "retrieveInformationFromAPI",
          value: function retrieveInformationFromAPI(credentials, url) {

            // Adding token to headers for Riverbed access
            headers = { "Authorization": "Bearer " + globalCurrentToken
              // Querying Riverbed AppResponse
            };response = session.get(url, headers = headers, verify = False);
            // If token is expired get a brand new token
            if (response.status_code == 401) {
              print("Token expired, collecting new token . . .");
              globalCurrentToken = this.getNewToken(credentials);
              headers = { "Authorization": "Bearer " + globalCurrentToken };
              response = session.get(url, headers = headers, verify = False);
            }
            // Returning server's response, containing all data returned by API
            return response;
          }
        }, {
          key: "ENHANCEDmetricFindHost_groupQuery",
          value: function ENHANCEDmetricFindHost_groupQuery(query) {
            this.testPrint();
            console.log("Test des logs :");
            console.log(userCredentials);
            globalCurrentToken = this.tryAuthentication(userCredentials);
            console.log(globalCurrentToken);
            this.headers['Authorization'] = "Bearer " + globalCurrentToken;
            return "test";
          }
        }, {
          key: "annotationQuery",
          value: function annotationQuery(options) {
            var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
            var annotationQuery = {
              range: options.range,
              annotation: {
                name: options.annotation.name,
                datasource: options.annotation.datasource,
                enable: options.annotation.enable,
                iconColor: options.annotation.iconColor,
                query: query
              },
              rangeRaw: options.rangeRaw
            };

            return this.doRequest({
              url: this.url + '/annotations',
              method: 'POST',
              data: annotationQuery
            }).then(function (result) {
              return result.data;
            });
          }
        }, {
          key: "metricFindQuery",
          value: function metricFindQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };
            console.log(this.userCredentials);
            return this.doRequest({
              // Ask this url
              url: this.url + '/metricsHG',
              // Send variable 'interpolated' as data
              data: interpolated,
              // As data are sent, method is POST
              method: 'POST'
              // Response sent by Python is mapped and go for display in correct box
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricApplicationsFindQuery",
          value: function metricApplicationsFindQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/metricsApplication',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricWAFindQuery",
          value: function metricWAFindQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/metricsWebApp',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricFindHost_groupQuery",
          value: function metricFindHost_groupQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/getHost_group',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricFindApplicationQuery",
          value: function metricFindApplicationQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/getApplicationOptions',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricFindWebAppQuery",
          value: function metricFindWebAppQuery(query) {
            var interpolated = {
              target: this.templateSrv.replace(query, null, 'regex')
            };

            return this.doRequest({
              url: this.url + '/getWebAppOptions',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "metricFindPageFamilyQuery",
          value: function metricFindPageFamilyQuery(grafanaRow) {
            // At initialization, plugin automaticaly try this end point without GET value, adding fake one
            if (grafanaRow == '') var goodGrafanaRow = 'A';else var goodGrafanaRow = grafanaRow;
            var interpolated = {
              target: goodGrafanaRow
            };
            return this.doRequest({
              url: this.url + '/getPageFamilyOptions',
              data: interpolated,
              method: 'POST'
            }).then(this.mapToTextValue);
          }
        }, {
          key: "mapToTextValue",
          value: function mapToTextValue(result) {
            return _.map(result.data, function (d, i) {
              // If there is an object with .value and .txt attribute in JSON
              if (d && d.text && d.value) {
                return { text: d.text, value: d.value };
              }
              // ???
              else if (_.isObject(d)) {
                  return { text: d, value: i };
                }
              // In other cases just display same text and value
              return { text: d, value: d };
            });
          }
        }, {
          key: "doRequest",
          value: function doRequest(options) {
            // Adding credentials and headers from self attributes 
            options.withCredentials = this.withCredentials;
            options.headers = { 'Content-Type': 'application/json' };

            return this.backendSrv.datasourceRequest(options);
          }
        }, {
          key: "buildQueryParameters",
          value: function buildQueryParameters(options) {
            var _this = this;

            //remove placeholder targets
            options.targets = _.filter(options.targets, function (target) {
              return target.target !== 'select metric';
            });

            // This variable correspond to the JSON sent to the end point /query
            var targets = _.map(options.targets, function (target) {
              return {
                // Each attribute is a field of the JSON
                target: _this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
                refId: target.refId,
                hide: target.hide,
                targetID: target.targetID,
                metricID: target.metricID,
                pageFamilyID: target.pageFamilyID,
                secondTargetID: target.secondTargetID,
                granularity: target.granularity,
                type: target.type || ''
              };
            });

            options.targets = targets;

            return options;
          }
        }, {
          key: "getTagKeys",
          value: function getTagKeys(options) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
              _this2.doRequest({
                url: _this2.url + '/tag-keys',
                method: 'POST',
                data: options
              }).then(function (result) {
                return resolve(result.data);
              });
            });
          }
        }, {
          key: "getTagValues",
          value: function getTagValues(options) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
              _this3.doRequest({
                url: _this3.url + '/tag-values',
                method: 'POST',
                data: options
              }).then(function (result) {
                return resolve(result.data);
              });
            });
          }
        }]);

        return GenericDatasource;
      }());

      _export("GenericDatasource", GenericDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
