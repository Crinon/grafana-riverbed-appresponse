import _ from "lodash";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
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
    this.headers = {'Content-Type': 'application/json'};
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  // Ask '/query' end point, use function buildQueryParameters() to build data
  // These data are sent to Python 
  query(options) {
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    // Debugging purpose
    // for(var i=0; i<= query.targets.length; i++) {
    //   console.log("Query " + i);
    //   console.log(query.targets[i]);
    // }

    if (query.targets.length <= 0) {
      return this.q.when({data: []});
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
  testDatasource() {
    return this.doRequest({
      url: this.url + '/',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }


  // Annotation feature is not used
  annotationQuery(options) {
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
    }).then(result => {
      return result.data;
    });
  }


  // Ask '/metricsHG' end point, data sent is 'target: "" ' and not used by Python script
  metricFindQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      // Ask this url
      url: this.url + '/metricsHG',
      // Send variable 'interpolated' as data
      data: interpolated,
      // As data are sent, method is POST
      method: 'POST',
      // Response sent by Python is mapped and go for display in correct box
    }).then(this.mapToTextValue);
  }


  // Ask '/metricsApplication' end point, data sent is 'target: "" ' and not used by Python script
  metricApplicationsFindQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/metricsApplication',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }


  // Ask '/metricsWebApp' end point, data sent is 'target: "" ' and not used by Python script
  metricWAFindQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/metricsWebApp',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  // Ask '/getHost_group' end point, data sent is 'target: "" ' and not used by Python script
  metricFindHost_groupQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/getHost_group',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  // Ask '/getApplicationOptions' end point, data sent is 'target: "" ' and not used by Python script
  metricFindApplicationQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/getApplicationOptions',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  // Ask '/getWebAppOptions' end point, data sent is 'target: "" ' and not used by Python script
  metricFindWebAppQuery(query) {
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/getWebAppOptions',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  // Ask '/getPageFamilyOptions' end point, data sent is the letter corresponding to the row used
  metricFindPageFamilyQuery(grafanaRow) {
  // At initialization, plugin automaticaly try this end point without GET value, adding fake one
    if(grafanaRow == '')
      var goodGrafanaRow = 'A';
    else
      var goodGrafanaRow = grafanaRow;
    var interpolated = {
        target: goodGrafanaRow
    };
    return this.doRequest({
      url: this.url + '/getPageFamilyOptions',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }  

  // Method giving the possibility to display text  but select id
  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
      // If there is an object with .value and .txt attribute in JSON
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      } 
      // ???
      else if (_.isObject(d)) {
        return { text: d, value: i};
      }
      // In other cases just display same text and value
      return { text: d, value: d };
    });
  }

  // http request, options are url(server+endPoint), data(if there is data to send), method(GET or POST))
  doRequest(options) {
    // Adding credentials and headers from self attributes 
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  // Method to construct the JSON that will be send to the end point /query
  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    // This variable correspond to the JSON sent to the end point /query
    var targets = _.map(options.targets, target => {
      return {
        // Each attribute is a field of the JSON
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
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
  getTagKeys(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-keys',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-values',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

}
