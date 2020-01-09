"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GenericDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
var globalCurrentToken;
var globalHOST = "knl640.krj.gie";
var userCredentials = {
  "user_credentials": {
    "username": "ncrinon", "password": "krj"
  },
  "generate_refresh_token": false
};

var GenericDatasource = exports.GenericDatasource = function () {
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

    // Function to test if datasource is connected (only used when setting up the plugin in Grafana)

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

    // _request.get(
    //   'https://knl640.krj.gie/api/common/1.0/auth_info',
    //   { json: { key: 'value' } },
    //   function (error, response, body) {
    //       if (!error && response.statusCode == 200) {
    //           console.log(body);
    //       }
    //   }
    // );


    // ESSAYER DE PASSER DU JSON
    // tryAuthentication(credentials){
    //   const url = 'https://knl640.krj.gie/api/mgmt.aaa/1.0/token';
    //   var json ="";

    //     fetch(url, {
    //       mode: 'no-cors',
    //       method: 'post',
    //       headers: {
    //         "Content-type": "application/json"
    //       },
    //       body: userCredentials
    //     })
    //     .then(json)
    //     .then(function (data) {
    //       console.log('Request succeeded with JSON response', data);
    //     });
    // return "json";
    // }


    // Refresh token function
    // Argument credentials = object with credentials

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

    // GET request function (collect informations through API : hostgroups, applications, webapps...)
    // Argument credentials = object with credentials
    // Argument url = API's url

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

    // PROOF OF CONCEPT


    // Faire une fonction auth (OU STOCKER LE TOKEN?)

    // Faire une fonction de check token

    // Quand je clique sur la case host group, je trigger:
    // verif token |||| le refresh?
    // taper dans l'API AppResponse
    // récup et mise en forme et pop

    // Fake metric, granularity, etc etc

    // Trigger query ?


    // Annotation feature is not used

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

    // Ask '/metricsHG' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/metricsApplication' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/metricsWebApp' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/getHost_group' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/getApplicationOptions' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/getWebAppOptions' end point, data sent is 'target: "" ' and not used by Python script

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

    // Ask '/getPageFamilyOptions' end point, data sent is the letter corresponding to the row used

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

    // Method giving the possibility to display text  but select id

  }, {
    key: "mapToTextValue",
    value: function mapToTextValue(result) {
      return _lodash2.default.map(result.data, function (d, i) {
        // If there is an object with .value and .txt attribute in JSON
        if (d && d.text && d.value) {
          return { text: d.text, value: d.value };
        }
        // ???
        else if (_lodash2.default.isObject(d)) {
            return { text: d, value: i };
          }
        // In other cases just display same text and value
        return { text: d, value: d };
      });
    }

    // http request, options are url(server+endPoint), data(if there is data to send), method(GET or POST))

  }, {
    key: "doRequest",
    value: function doRequest(options) {
      // Adding credentials and headers from self attributes 
      options.withCredentials = this.withCredentials;
      options.headers = { 'Content-Type': 'application/json' };

      return this.backendSrv.datasourceRequest(options);
    }

    // Method to construct the JSON that will be send to the end point /query

  }, {
    key: "buildQueryParameters",
    value: function buildQueryParameters(options) {
      var _this = this;

      //remove placeholder targets
      options.targets = _lodash2.default.filter(options.targets, function (target) {
        return target.target !== 'select metric';
      });

      // This variable correspond to the JSON sent to the end point /query
      var targets = _lodash2.default.map(options.targets, function (target) {
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

    // These two last methods are not used in this datasource for the moment

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
}();
//# sourceMappingURL=datasource.js.map
