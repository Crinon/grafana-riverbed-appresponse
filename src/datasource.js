import _ from "lodash";
import * as externalFunctions from './externalFunctions';

export class GenericDatasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    // ID of the plugin (set in plugin.json)
    this.type = instanceSettings.type;
    // Name of the plugin (set in plugin.json)
    this.name = instanceSettings.name;
    // ID stored by Grafana
    this.IDplugin = instanceSettings.id;
    // Used for compilation by Grunt and query building
    this.targetID = instanceSettings.targetID;
    // Access token, refreshed when needed
    this.token;
    // Looks like '/api/datasources/proxy/{yourPluginIdGaveByGrafana}' this proxy url avoids CORS issue
    this.urlDatasource = instanceSettings.url;
    // For debug purpose
    this.instanceSettings = instanceSettings;

    // Theses login informations are set in plugin configuration page
    // First condition avoids error when grunt is building
    if (typeof instanceSettings.jsonData !== 'undefined') {
      // Second condition verifies that username and password for AppResponse API are actually set in plugin's config page
      if (typeof instanceSettings.jsonData.username !== 'undefined' && typeof instanceSettings.jsonData.password !== 'undefined') {
        this.datasourceUserName = instanceSettings.jsonData.username;
        this.datasourceUserPassword = instanceSettings.jsonData.password;
      }
    }

    // Object needed by AppResponse to login
    this.credentialsAppResponseJSON = JSON.stringify(
      {
        "user_credentials": { "username": this.datasourceUserName, "password": this.datasourceUserPassword },
        "generate_refresh_token": false
      });

    // The following strings end urls used for query, each url is proxy/api 
    // API for access token retrievement
    this.urlAuthentication = this.urlDatasource + '/api/mgmt.aaa/1.0/token';
    // API for hostgroups list retrievement
    this.urlHostGroups = this.urlDatasource + '/api/npm.classification/2.0/hostgroups';
    // API for metrics list retrievement
    this.urlMetrics = this.urlDatasource + '/api/npm.reports.sources/1.0/sources/items/aggregates';
    // API for applications list retrievement
    this.urlApplications = this.urlDatasource + '/api/npm.classification/2.0/applications';
    // API for webapps list retrievement
    this.urlWebApps = this.urlDatasource + '/api/npm.wta_config/1.0/wta_webapps';
    // API for instance creation (report)
    this.urlInstanceCreationSync = this.urlDatasource + '/api/npm.reports/1.0/instances/sync';

    // Following variables are used as buffer, when user is typing to filter results, it avoids unecessary request to AppResponse
    this.tableauHostGroups = [];
    this.tableauMetricsHostgroup = [];
    this.tableauMetricsApplication = [];
    this.tableauMetricsWebapp = [];
    this.tableauMetrics = [];
    this.tableauApplications = [];
    this.tableauWebApps = [];

    // Used in family page id fetching (workaround solution until Riverbed release API for family_page_id retrieving)
    this.globalAllRowSourceIDs = [];

    // Following variables are used as timer to avoid unecessary requests to AppResponse (anti-spam)
    this.timeMetricHostgroup = 0;
    this.timeMetricApplication = 0;
    this.timeMetricWebbApp = 0;
    this.timeListHostgroups = 0;
    this.timeListApplications = 0;
    this.timeListWebbapps = 0;
    this.timeToken = 0;
    this.lastTimeYouWereHostgroupsList = 0;
    this.lastTimeYouWereApplicationsList = 0;
    this.lastTimeYouWereWebbappsList = 0;
    this.lastTimeYouWereGeneralMetricsList = 0;
    this.lastTimeYouWereFamilypage = 0;
    // Token durability in milliseconds (15 minutes by default)
    this.tokenDefaultAvalaibility = 900000;
    // How much time lists are alive (change this if you need to rebuild more often lists (in milliseconds))
    this.bufferMaxTime = 120000

    // Contains last familypages request
    this.pageFamilyList;

    // The Holy Grail is a treasure that serves as an important motif with the Grail you have full access to both panel and datasource data
    this.graal;

    // Core variable
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    // Default headers for DoRequest() function
    this.headers = { 'Content-Type': 'application/json' };
    // Unused : AppResponse use Oauth
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }



  //#########################################################################################################################
  //##                                                                                                                     ##
  //##                                                     CORE FUNCTION                                                   ##
  //##                                                                                                                     ##
  //#########################################################################################################################
  // Function to test if datasource is connected (only used when setting up the plugin in Grafana)
  testDatasource() {
    return this.doRequest({
      url: '/',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }


  // Function to send http request, options are url(proxy+api_endpoint), data(if there is data to send), and method(GET or POST))
  doRequest(options) {
    // Adding credentials and headers from self attributes 
    options.withCredentials = this.withCredentials;
    // If token is expired, get a fresh one
    if (Date.now() - this.timeToken > this.tokenDefaultAvalaibility) {
      return this.backendSrv.datasourceRequest({
        url: this.urlAuthentication,
        data: this.credentialsAppResponseJSON,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        withCredentials: this.withCredentials
      }
      ).then(
        (response) => {
          // Notification
          $('.alert-body').append('<div class="alert-title">Token refreshed</div>')
          // Assign token
          this.token = response.data.access_token;
          // Assign date of token in order to check his validity later
          this.timeToken = Date.now()
          // Creating hearders with content-type and token
          if (this.token !== undefined) {
            let authorization = "Bearer " + this.token;
            options.headers = { 'Content-Type': 'application/json', 'Authorization': authorization };
          } else {
            options.headers = { 'Content-Type': 'application/json' };
          }
          // Finally, do the request with this token
          return this.backendSrv.datasourceRequest(options)
        })
    } else {
      // If token is still effectiv, create hearders with content-type and token
      if (this.token !== undefined) {
        let authorization = "Bearer " + this.token;
        options.headers = { 'Content-Type': 'application/json', 'Authorization': authorization };
      } else {
        options.headers = { 'Content-Type': 'application/json' };
      }
      // Do the request with current token
      return this.backendSrv.datasourceRequest(options)
    }
  }


  // This function is used when Grunt build dist folder
  metricFindQuery(query) {
    var interpolated = {
      target: this.templateSrv.replace(query, null, 'regex')
    };
    return this.doRequest({
      // Ask this url
      url: this.url + '/fake_url',
      // Send variable 'interpolated' as data
      data: interpolated,
      // As data are sent, method is POST
      method: 'POST',
      // Response sent is mapped and go for display in correct box
    }).then(this.mapToTextValue);
  }


  // Annotation feature is not used in this plugin
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


  // Method giving chance to display text but select id
  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
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


  // Method to construct the JSON that will be send to function query()
  buildQueryParameters(options) {
    this.graal = options

    // Extract targets array from object into simple array containing each target
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    // This variable is the JSON sent to function query()
    var targets = _.map(options.targets, target => {
      return {
        // Each attribute is a field from JSON
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        targetID: target.targetID,
        metricID: target.metricID,
        pageFamilyID: target.pageFamilyID,
        secondTargetID: target.secondTargetID,
        granularity: target.granularity,
        type: target.type || '',
        timeshift: target.timeshift,
        customAlias: target.customAlias
      };
    });

    options.targets = targets;

    return options;
  }


  // Tag feature is not used in this plugin
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



  //#########################################################################################################################
  //##                                                                                                                     ##
  //##                                                     MY FUNCTIONS                                                    ##
  //##                                                                                                                     ##
  //#########################################################################################################################
  // Check if string ends with your string, return boolean
  strEndsWith(str, suffix) {
    return str.match(suffix + "$") == suffix;
  }

  // Round
  homeMadeRound(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }

  // Return grafana's row letter alphabetical position (e.g between 0 and 25)
  getGrafanaRowNumber() {
    // Depending of Grafana version, retrieving row's letter may differ
    let newlettre = $(document.activeElement).parents(".query-editor-row").find(".query-editor-row__ref-id").text();
    let oldLettre = $(document.activeElement).parents(".query-editor-row").find(".gf-form-query-letter-cell-letter").text();
    // 65 for uppercase, or 97 for lowercase
    // if length of String oldLettre is 0, then retrieving row's letter from old version has failed, we use newletter
    if (oldLettre.length == 0) {
      return newlettre.charCodeAt(0) - 65;
    } else {
      return oldLettre.charCodeAt(0) - 65;
    }
  }


  //#########################################################################################################################
  //##                                                                                                                     ##
  //##                                                     ROUTE FUNCTION                                                  ##
  //##                                                                                                                     ##
  //#########################################################################################################################
  // HOST_GROUPS LIST RETRIEVING
  appResponseQueryAllHostGroupsAvalaible(query) {
    // When openning dashboard, Grafana repeat a lot the same request, this condition is used as anti-spam
    if (Date.now() - this.lastTimeYouWereHostgroupsList < 100) {
      return
    }
    this.lastTimeYouWereHostgroupsList = Date.now()

    // Check if we need to build a fresh list of hostgroups available
    if (Date.now() - this.timeListHostgroups < this.bufferMaxTime) {
      console.log('tableauHostGroups not refreshed')
      return this.tableauHostGroups;
    }

    // If bufferMaxTime is passed and token is valid, build a new hostgroups list
    return this.doRequest({
      // url for http request
      url: this.urlHostGroups,
      // No data to send, use GET
      method: 'GET'
    }).then(
      // responseHostGroup is the response from Riverbed AppResponse
      (responseHostGroup) => {
        // Verify if request has failed 
        if (typeof responseHostGroup === 'undefined') {
          this.tableauHostGroups = []
        } else {
          // If successfull, store and return result as {'text': hostgroupName, 'value': hostgroupID}
          // Reset old array
          this.tableauHostGroups = [];
          // What we are looking for are objects in array responseHostGroup.data.items
          for (let k in responseHostGroup.data.items) {
            // We only retreive 'enabled' hostgroups
            if (responseHostGroup.data.items[k]["enabled"])
              this.tableauHostGroups.push({ 'text': responseHostGroup.data.items[k].name, 'value': responseHostGroup.data.items[k].name + ' {id}' + responseHostGroup.data.items[k].id });
          }
          // Refresh timer
          this.timeListHostgroups = Date.now()
          console.log('tableauHostGroups recreated')
        }
        return this.tableauHostGroups
      }
    )
  }


  // METRICS LIST RETRIEVING (manually filtered)
  appResponseQueryMetricsFiltered(query) {
    // When openning dashboard, Grafana repeats a lot the same request, this condition is used as anti-spam
    if (Date.now() - this.lastTimeYouWereGeneralMetricsList < 100) {
      return
    }
    this.lastTimeYouWereGeneralMetricsList = Date.now()
    // In order to filter metrics, we need to know if these metrics are for Webapp, Application or Hostgroup
    // We grab the letter of line query and convert it to index of alphabet (array position)
    let sourceTypeSelectedRaw = $(document.activeElement).parents(".query-editor-row").find("#selectType").val();
    // Avoiding crash when user create a new empty query line  
    if (typeof sourceTypeSelectedRaw === 'undefined') {
      console.log("Metrics gathering cancelled: no source type selected")
      return { 'text': 'Metrics gathering cancelled: no source type selected', 'value': 'Metrics gathering cancelled: no source type selected' }
    }
    // Avoiding crash when user create a new empty query line
    let sourceTypeSelectedValue = sourceTypeSelectedRaw.split(':');
    sourceTypeSelectedValue = sourceTypeSelectedValue[1]
    if (typeof sourceTypeSelectedValue === 'undefined') {
      console.log("Metrics gathering cancelled: no source type selected")
      return { 'text': 'Metrics gathering cancelled: no source type selected', 'value': 'Metrics gathering cancelled: no source type selected' }
    }
    // If current row is a HostGroup query and this query got fullfilled recently, stop here and return hostgroup avalaible list
    if ((sourceTypeSelectedValue === 'Host group') && Date.now() - this.timeMetricHostgroup < this.bufferMaxTime) {
      console.log('tableauMetricsHostgroup not refreshed')
      return this.tableauMetricsHostgroup;
    }
    // If current row is an application query and this query got fullfilled recently, stop here and return application avalaible list
    if ((sourceTypeSelectedValue == "Application" || sourceTypeSelectedValue == "Application/HG")
      && Date.now() - this.timeMetricApplication < this.bufferMaxTime) {
      console.log('timeMetricApplication not refreshed')
      return this.tableauMetricsApplication;
    }
    // If current row is a webapp query and this query got fullfilled recently, stop here and return webapp avalaible list
    if ((sourceTypeSelectedValue == "WebApp" || sourceTypeSelectedValue == "PageFamily")
      && Date.now() - this.timeMetricWebbApp < this.bufferMaxTime) {
      console.log('tableauMetricsWebapp not refreshed')
      return this.tableauMetricsWebapp;
    }

    return this.doRequest({
      url: this.urlMetrics,
      method: 'GET'
    }).then(
      (responseMetrics) => {
        // From now we build the list depending of source type (application, webapp, hostgroup)
        this.tableauMetrics = []
        let unit;
        for (let k in responseMetrics.data.columns) {
          // Global filters
          if (
            !this.strEndsWith(responseMetrics.data.columns[k].id, '.id') && !this.strEndsWith(responseMetrics.data.columns[k].id, '_id') &&
            !this.strEndsWith(responseMetrics.data.columns[k].id, '.name') && !this.strEndsWith(responseMetrics.data.columns[k].id, '_name') &&
            !this.strEndsWith(responseMetrics.data.columns[k].id, '.ip') && !this.strEndsWith(responseMetrics.data.columns[k].id, '_ip') &&
            !this.strEndsWith(responseMetrics.data.columns[k].id, '.dns') && !this.strEndsWith(responseMetrics.data.columns[k].id, '_dns') &&
            !this.strEndsWith(responseMetrics.data.columns[k].id, '.type') && !this.strEndsWith(responseMetrics.data.columns[k].id, '_type') &&
            !this.strEndsWith(responseMetrics.data.columns[k].id, 'start_time') && !this.strEndsWith(responseMetrics.data.columns[k].id, 'end_time') &&
            !responseMetrics.data.columns[k].id.includes('rtp')) {
            // Applications filter
            if ((sourceTypeSelectedValue == "Application" || sourceTypeSelectedValue == "Application/HG") &&
              !responseMetrics.data.columns[k].id.includes('p2m') &&
              !responseMetrics.data.columns[k].id.includes('m2p') &&
              !responseMetrics.data.columns[k].id.includes('web')) {
              console.log("METRIC FOR APPLICATION OR APPLICATIONS/HG")
              if (responseMetrics.data.columns[k].unit === 'none') {
                unit = 'occurence'
              }
              else {
                unit = responseMetrics.data.columns[k].unit
              }
              if (typeof responseMetrics.data.columns[k].rate !== 'undefined') {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
              else {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
            }


            // WebApps filter 
            else if ((sourceTypeSelectedValue == "WebApp" || sourceTypeSelectedValue == "PageFamily") && responseMetrics.data.columns[k].id.includes('web')) {
              console.log("METRIC FOR WEBAPP et PageFamily")
              if (responseMetrics.data.columns[k].unit === 'none') {
                unit = 'occurence'
              }
              else {
                unit = responseMetrics.data.columns[k].unit
              }
              if (typeof responseMetrics.data.columns[k].rate !== 'undefined') {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
              else {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
            } else if (sourceTypeSelectedValue === 'Host group') {


              // Hostgroup : no specific filter
              console.log("METRIC FOR HOSTGROUP")
              if (responseMetrics.data.columns[k].unit === 'none') {
                unit = 'occurence'
              }
              else {
                unit = responseMetrics.data.columns[k].unit
              }
              //  If rate is available display unit/rate
              if (typeof responseMetrics.data.columns[k].rate !== 'undefined') {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + "/" + responseMetrics.data.columns[k].rate + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
              else {
                this.tableauMetrics.push({ 'text': responseMetrics.data.columns[k].label + "  (" + unit + ")", 'value': responseMetrics.data.columns[k].label + "  (" + unit + ")" + " {id}" + responseMetrics.data.columns[k].id });
              }
            }
          }
        }
        // Clone results in matching variable, this variable will be returned as long as buffer time allowed is not exceeded
        // If we just built the list for hostgroups, we clone tableauMetrics in tableauMetricsHostgroup
        if (sourceTypeSelectedValue === 'Host group') {
          this.tableauMetricsHostgroup = [];
          this.tableauMetricsHostgroup = this.tableauMetrics.map((x) => x)
          this.timeMetricHostgroup = Date.now()
        }
        // If we just built the list for Application or Application, we clone tableauMetrics in tableauMetricsApplication
        if (sourceTypeSelectedValue == "Application" || sourceTypeSelectedValue == "Application/HG") {
          this.tableauMetricsApplication = [];
          this.tableauMetricsApplication = this.tableauMetrics.map((x) => x)
          this.timeMetricApplication = Date.now()
        }
        // If we just built the list for WebApp or PageFamily, we clone tableauMetrics in tableauMetricsWebapp
        if (sourceTypeSelectedValue == "WebApp" || sourceTypeSelectedValue == "PageFamily") {
          this.tableauMetricsWebapp = [];
          this.tableauMetricsWebapp = this.tableauMetrics.map((x) => x)
          this.timeMetricWebbApp = Date.now()
        }
        return this.tableauMetrics
      }
    )
  }


  // APPLICATIONS LIST RETRIEVING
  appResponseQueryAllApplicationsAvalaible(query) {
    // If you want information, please refer to hostgroups list request, function 'appResponseQueryAllHostGroupsAvalaible'
    if (Date.now() - this.lastTimeYouWereApplicationsList < 100) {
      return
    }
    this.lastTimeYouWereApplicationsList = Date.now()
    if (Date.now() - this.timeListApplications < this.bufferMaxTime) {
      console.log('tableauApplications not refreshed')
      return this.tableauApplications;
    }
    return this.doRequest({
      url: this.urlApplications,
      method: 'GET'
    }).then(
      (responseHostGroup) => {
        this.tableauApplications = [];
        for (var k in responseHostGroup.data.items) {
          if (responseHostGroup.data.items[k]["enabled"])
            this.tableauApplications.push({ 'text': responseHostGroup.data.items[k].name, 'value': responseHostGroup.data.items[k].name + ' {id}' + responseHostGroup.data.items[k].id });
        }
        this.timeListApplications = Date.now()
        return this.tableauApplications
      }
    )
  }


  // WEBAPPS LIST RETRIEVING
  appResponseQueryAllWebappsAvalaible() {
    // If you want information, please refer to hostgroups list request, function 'appResponseQueryAllHostGroupsAvalaible'
    if (Date.now() - this.lastTimeYouWereWebbappsList < 100) {
      return
    }
    this.lastTimeYouWereWebbappsList = Date.now()
    if (Date.now() - this.timeListWebbapps < this.bufferMaxTime) {
      console.log('tableauWebApps not refreshed')
      return this.tableauWebApps;
    }
    return this.doRequest({
      url: this.urlWebApps,
      method: 'GET'
    }).then(
      (responseHostGroup) => {
        this.tableauWebApps = [];
        for (var k in responseHostGroup.data.items) {
          if (responseHostGroup.data.items[k]["enabled"])
            this.tableauWebApps.push({ 'text': responseHostGroup.data.items[k].name, 'value': responseHostGroup.data.items[k].name + ' {id}' + responseHostGroup.data.items[k].id });
        }
        this.timeListWebbapps = Date.now()
        return this.tableauWebApps
      }
    )
  }


  //#########################################################################################################################
  //##                                                                                                                     ##
  //##                                          FAMILY PAGES LIST RETRIEVING                                               ##
  //##                                                                                                                     ##
  //#########################################################################################################################
  // Riverbed AppResponse does not offer the possibility to retrieve page.family.id through API
  // This is a workaround solution until Riverbed release API for family_page_id retrieving)
  // Request all pages requested (of current Webapp) for the last 24 hours (very large granularity for light query)
  appResponseQueryFamilyPageFromWebapp(query) {
    // Anti-spam
    if (Date.now() - this.lastTimeYouWereFamilypage < 5000) {
      return this.pageFamilyList
    }
    this.lastTimeYouWereFamilypage = Date.now()
    // Get row alphabet index (A is 0, B is 1 , C is 2 ...)
    let grafanaRowIndex = this.getGrafanaRowNumber()
    // Avoid error if row is correctly created
    if (Number.isNaN(grafanaRowIndex) === true) {
      console.log("Family pages gathering cancelled: no query")
      return 'Family pages gathering cancelled: no query';
    }
    // Stop here is no webapp selected
    let sourceID = this.globalAllRowSourceIDs[grafanaRowIndex]
    if (typeof sourceID === 'undefined') {
      console.log("Family pages gathering cancelled: no WebApp selected")
      return 'Family pages gathering cancelled: no no WebApp selected';
    }
    // Object send to AppResponse, request all page.family.id for the specified webapp for the last 24 hours with larg granularity (24h)
    let dataDefs = {
      'data_defs': [
        {
          "source": {
            "origin": "",
            "path": 'aggregates:App',
            "type": "",
            "name": "aggregates"
          },
          "time": {
            "duration": "last 24 hours",
            "granularity": "86400",
          },
          "group_by": [
            "start_time",
            "app.id"
          ],
          "columns": [
            "app.name",
            "app.id",
            "start_time",
            "sum_web.pages",
            "web.page.family.id",
            "web.page.family.name"
          ],
          "filters": [
            {
              "value": "app.id == " + sourceID.toString(),
              "type": "STEELFILTER",
              "id": "rowFilter"
            }]
        }
      ]
    }
    return this.doRequest({
      url: this.urlInstanceCreationSync,
      data: dataDefs,
      method: 'POST'
    }).then(
      (responseQuery) => {
        // Variable to improve readability
        let allPageFamily;
        let pageID;
        let pagename;
        let pageFamilyIDandName;
        // allPageFamily contains data from AppResponse
        allPageFamily = responseQuery.data.data_defs[0].data
        // Resetting the list in case of multiple page family row
        this.pageFamilyList = [];
        // For each sample, get page.family.id and page.family.name
        for (let indice in allPageFamily) {
          //  position in array from 0 to 5 : app.name, app.ip, timestamp, page.views, page.family.id, page.family.name
          pageID = allPageFamily[indice][4]
          pagename = allPageFamily[indice][5]
          //  Keep both id and name, id will be extracted in /query
          pageFamilyIDandName = pagename + ' {id}' + pageID;
          this.pageFamilyList.push({ 'text': pagename, 'value': pageFamilyIDandName });
        }
        return this.pageFamilyList
      }
    )
  }


  //#########################################################################################################################
  //##                                                                                                                     ##
  //##                                                     QUERY                                                           ##
  //##                                                                                                                     ##
  //#########################################################################################################################
  // Query function is triggered each time query_ctrl's value is modified (e.g each time user modify his request)
  // Query function is triggered each time Grafana or user refresh panel plugin (graph, heatmap...)
  query(options) {
    // Query variable contains everything (e.g Graal)
    var query = this.buildQueryParameters(options);
    // If user clicked on 'eye' icon to disable the row, disable it
    query.targets = query.targets.filter(t => !t.hide);
    // If no query is built, fill promise with empty data and return
    if (query.targets.length <= 0) {
      return this.q.when({ data: [] });
    }
    // If adhocFilters are presents, use them, else adhocFilters are empty 
    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }
    // Debugging purpose, display queries
    // for (var i = 0; i <= query.targets.length; i++) {
    //   console.log("Query " + i);
    //   console.log(query.targets[i]);
    // }

    //##################################################################
    //##             Variables needed to run the query                ##
    //##################################################################
    // Granularity selected
    let granularityQueried;
    // Source part of AppResponse's data_defs (See below for infos)
    let sourceDatadefs;
    // groupBy part of AppResponse's data_defs (See below for infos)
    let groupbyDatadefs;
    // Columns part of AppResponse's data_defs (See below for infos)
    let columnsDatadefs;
    // Filterts part of AppResponse's data_defs (See below for infos)
    let filters_value1;
    let filters_value2;
    // Start time selected for query
    let queryTimeFrom;
    // End time selected for query
    let queryTimeTo;
    // data_defs is the JSON sent to AppReponse for query, can contain several requests
    let dataDefsWithList = { 'data_defs': [] };
    // This array is used to make the size of "row array" match with the size of and the "responseQuery array"
    let continueTab = [];
    // Used to check if query did not take to much time for synchronous request
    let timeSyncStart;
    // Used to check if query did not take to much time for synchronous request
    let timeToCollection;
    // Used to collect informations for legend construction
    let metricCaptionObjTab = {};

    let metricSplitted = [];
    // Metric selected for query
    let metricQueried = '';
    // If family page query, this variable store web.page.family.id
    let familyPageID = '';
    // If family page query, this variable store web.page.family.name
    let familyPageName = '';
    // For caption construction, used to differentiate a family page response from other response
    let firstFilter;
    // For caption construction, used to spot Application/Hostgroup response
    let secondFilter;
    // Label contains both caption and metric name
    let label;
    // Used to build request Application/Hostgroup, will store hostgroup ID
    let secondTargetID;
    // Used to build request Application/Hostgroup
    let secondTargetIDTAB = [];
    // In case of timeshifted request, will store timeshift requested
    let deltaTimeshift;
    // Caption is the curve's legend
    let caption;
    let sourceID;
    let metricId;
    let sourceType;
    let grafanaRowIndex;
    let dataDefs;
    let hostgroupSplitted;
    let newTarget;
    let grafanaRefId;
    let datapointTimestamp;
    let datapointValue;
    let metricLabel
    let little = []

    // appresponseDatapoints contains all datapoint from Riverbed AppResponse probe
    let appresponseDatapoints;
    // Datapoint is a list which will receive all datapoints in correct format [value, timestamp]
    let datapoints = [];
    // Reset final results from old query's results
    let dataPointsForGrafana = [];
    // continueTab is used to arrange things, there will be as much query row as response (we'll add fake response if query row is not complete)
    for (let y = 0; y < query.targets.length; y++) {
      continueTab.push(false);
    }

    //##################################################################
    //##                 Gathering Grafana's data                     ##
    //##################################################################


    // If you need to debug, enable this 3 lines, show JSON from all rows
    // console.log('\n\n\n###### BEGIN : ALL ROW #######');
    // console.log(JSON.stringify(query.targets, null, 4));
    // console.log('###### END : ALL ROW #######\n\n\n');

    // For each row of Grafana query (A, B, C, D...) we TRY to build a corresponding query
    // If row is incomplete, tag as incomplete in continueTab and move to next row
    for (let i in query.targets) {


      //##################################################################
      //##                   Dealing with timeshift                     ##
      //##################################################################
      // To do timeshift, we take Grafana query time, substract how many days back we need, do the request, add timeshift back to display correctly

      // Retrieving times queried from Grafana's JSON (string epoch format needed, /1000 converts ms to s)
      queryTimeFrom = ((new Date(query.range.from)).getTime()) / 1000;
      queryTimeTo = ((new Date(query.range.to)).getTime()) / 1000;
      //   console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');}
      // If timeshift field is empty, timeshift is set to 0
      if (typeof query.targets[i].timeshift === "undefined" ||
        (typeof query.targets[i].timeshift === "string" && query.targets[i].timeshift.length === 0)) {
        query.targets[i].timeshift = 0;
      }
      // Timeshift is converted from string to number
      query.targets[i].timeshift = parseInt(query.targets[i].timeshift)
      // Timeshift is converted from day to seconds (and corrected by one seconds per day)
      query.targets[i].timeshift += query.targets[i].timeshift * 86400 - (1 * query.targets[i].timeshift)
      // Store timeshift to calculate delta 
      deltaTimeshift = query.targets[i].timeshift
      // Substract queryTime from timeshift 
      queryTimeFrom = queryTimeFrom - deltaTimeshift
      queryTimeTo = queryTimeTo - deltaTimeshift
      if (typeof deltaTimeshift !== 'undefined') {
        query.targets[i].timeshift = deltaTimeshift
      }


      //##################################################################
      //##                    Checking rows completion                  ##
      //##################################################################
      // We check if all field are filled corrrectly, if one required field is incomplete, we tag the row as incomplete and continue to next row

      // sourceID is host_group.id or app.id
      sourceID = query.targets[i].targetID
      // If no source for the row has been selected, tag as incomplete and continue to next row
      if (typeof sourceID === 'undefined') {
        console.log('[[[[[[[[[[[[[[[[[[[[[[[CONTINUE 0 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]')
        continueTab[i] = true;
        continue
      }
      // id is stored as 'text {id}idWANTED', need to extract idWANTED
      hostgroupSplitted = sourceID.split(' {id}')
      sourceID = hostgroupSplitted[1]
      // grafanaRowIndex is identification for one row in Grafana (A, B, C ...) automaticly created by Grafana
      // Converting to alphabetical index
      grafanaRowIndex = this.getGrafanaRowNumber();
      // Save sourceID to use it in family page id retrieving function 'appResponseQueryFamilyPageFromWebapp'
      this.globalAllRowSourceIDs[grafanaRowIndex] = sourceID;

      // Retrieving metric queried by Grafana
      if (typeof query.targets[i].metricID === 'undefined' || query.targets[i].metricID === '') {
        console.log('[[[[[[[[[[[[[[[[[[[[[[[ CONITNUE (no metric) ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]')
        continueTab[i] = true;
        continue
      }
      // id is stored as 'text {id}idWANTED', need to extract idWANTED
      metricQueried = query.targets[i].metricID.split(' {id}')
      metricCaptionObjTab[metricSplitted[1]] = metricQueried[0]
      metricQueried = metricQueried[1]

      // Retrieving specified granularity
      if (typeof query.targets[i].granularity !== 'undefined') {
        granularityQueried = query.targets[i].granularity;
      }
      else {
        console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 1 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]')
        granularityQueried = ''
        continueTab[i] = true;
        continue
      }

      // SourceType is one of Host_group, Application, Application/HG, WebApp or PageFamily (combobox)
      sourceType = query.targets[i].type;



      //##################################################################
      //##              Building queries for AppResponse                ##
      //##################################################################
      // Depending on the type of source, variables are built


      if (sourceType == 'Host group') {
        // A host group query requires both a source and a metric (granularity has already been checked)
        if (sourceID == '' || metricQueried == '') {
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 2 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]');
          continueTab[i] = true;
          continue
        }
        // This variable contains the type of source selected, it is the same for hostgroups and applications
        sourceDatadefs = {
          "name": "aggregates"
        };
        // For each datapoint, data are grouped by timestamp and id of hostgroup
        groupbyDatadefs = ["start_time", "host_group.id"];
        // Columns are fields queried, some are fixed value (host_group.id, host_group.name...) and some are metrics
        columnsDatadefs = ["start_time", "host_group.id", "host_group.name", metricQueried];
        // Metric request is filtered by hortgroup selected
        filters_value1 = "host_group.id == " + sourceID;
        // filters_value2 is only used in  Application/HG query
        filters_value2 = "";
      }


      if (sourceType == "Application") {
        // A application query requires both a source and a metric (granularity has already been checked)
        if (sourceID == '' || metricQueried == '') {
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 3 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]');
          continueTab[i] = true;
          continue
        }
        sourceDatadefs = {
          "name": "aggregates"
        };
        groupbyDatadefs = ["start_time", "app.id"];
        columnsDatadefs = ["start_time", "app.id", "app.name", metricQueried];
        filters_value1 = "app.id == " + sourceID;
        // filters_value2 is only used in  Application/HG query
        filters_value2 = "";
      }


      if (sourceType == "Application/HG") {
        // A Application/HG query requires both a source (application), a filter (host group) ,and a metric (granularity has already been checked)
        if (sourceID == '' || metricQueried == '' || query.targets[i].secondTargetID == '') {
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 4 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]')
          continueTab[i] = true;
          continue
        }
        // secondTargetID is filter (e.g hostgroup)
        secondTargetID = query.targets[i].secondTargetID
        secondTargetIDTAB = secondTargetID.split(' {id}')
        secondTargetID = secondTargetIDTAB[1]
        sourceDatadefs = {
          "name": "aggregates"
        };
        groupbyDatadefs = ["start_time", "app.id"];
        columnsDatadefs = ["start_time", "app.id", "app.name", "host_group.id", "host_group.name", metricQueried];
        filters_value1 = "app.id == " + sourceID;
        filters_value2 = "host_group.id == " + secondTargetID;
      }


      if (sourceType == 'WebApp') {
        // A WebApp query requires both a source and a metric (granularity has already been checked)
        if (sourceID == '' || metricQueried == '') {
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 5 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]')
          continueTab[i] = true;
          continue
        }
        sourceDatadefs = {
          "origin": "",
          "path": "aggregates:App",
          "type": "",
          "name": "aggregates"
        }
        groupbyDatadefs = ["start_time", "app.id"]
        columnsDatadefs = ["start_time", "app.id", "app.name", metricQueried]
        filters_value1 = "app.id == " + sourceID
        filters_value2 = ""
      }


      if (sourceType == 'PageFamily') {
        familyPageID = query.targets[i].pageFamilyID;
        //  Extracting id
        if(familyPageID === ''){
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 6 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]');
          continueTab[i] = true;
          continue
        }
        familyPageID = familyPageID.split(' {id}')
        familyPageName = familyPageID[0];
        familyPageID = familyPageID[1];
        // Store name for caption building (see below)
        metricCaptionObjTab[familyPageID.toString()] = familyPageName
        // A PageFamily query requires both a source (id of page), and a metric (granularity has already been checked)
        if (metricQueried == '' || familyPageID == '') {
          console.log('[[[[[[[[[[[[[[[[[[[[[[[continue 6 ]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]');
          continueTab[i] = true;
          continue
        }
        sourceDatadefs = {
          "origin": "",
          "path": "aggregates:App",
          "type": "",
          "name": "aggregates"
        }
        groupbyDatadefs = ["start_time", "app.id"]
        columnsDatadefs = ["start_time", "app.id", "app.name", metricQueried]
        filters_value1 = "web.page.family.id == " + familyPageID
        filters_value2 = ""
      }

      // Implementing fields in "data_definition" for Riverbed
      // Commentaries of the following object come from Riverbed support's documentation
      // The data definition (request) has the following properties: source, time, group_by, and filters
      // WARNING : dataDefs object is highly customizable, this one is small and does not exploit all the capacities offered by AppResponse
      // Please refer to Appresponse API documentation if you want to complete this object 
      dataDefs =
      {
        // Data source to handle the data request. The source property is an object
        // It has the following required sub-properties: name (required) and path (optional)
        'source': sourceDatadefs,
        // Specify the time duration of the data requests
        // The time property also includes a few properties that help refine time-series requests.
        "time": {
          // Epoch start time of the request, the start time is inclusive, the unit is seconds.
          "start": queryTimeFrom.toString(),
          // Epoch end time of the request, the end time is exclusive, the unit is seconds.
          "end": queryTimeTo.toString(),
          // This refers to the amount of time for which the data source computes a summary of the metrics it received
          // The data source examines all data and creates summaries for 1 minute, 5 minutes, 1 hour, 6 hours, and 1 day
          'granularity': granularityQueried.toString(),
        },
        // The group by property specifies the keys in the request. It is usually used to determine what kind of data is requested
        // If the start_time (or end_time) column is in the group_by, then the request is considered time series
        "group_by": groupbyDatadefs,
        // Request columns, the client can specify the requested key/metric columns, as well as their order
        "columns": columnsDatadefs,
        // The filters property is an array with filter objects (STEELFILTER is default filter)
        "filters": [
          {
            "type": "STEELFILTER",
            "value": filters_value1
          },
          {
            "type": "STEELFILTER",
            "value": filters_value2
          }]
      }
      // Adding current data_defs to the list containing all of data_defs (multi-query)
      dataDefsWithList.data_defs.push(dataDefs);

      // Measuring time needed to Riverbed for datapoints collection (if time>50s then sync mode returns no data but still continue to collect data queried)
      // Important thing is, datapoints collection is still running, even if API does not return the result (when collection is over, datapoints can be manually retrieve with instance ID)
      // Multiple request > 50s may overload the probe, keep it in mind
      timeSyncStart = Date.now();

      // Query is now ready to be sent to RiverBed AppResponse probe
      // End of foreach query
    }
    // Sending datadefs to Riverbed and waiting for response

    return this.doRequest({
      url: this.urlInstanceCreationSync,
      data: dataDefsWithList,
      method: 'POST'
    }).then(
      (responseQuery) => {
        // If you need to debug, enable this 3 lines, show response in JSON from AppResponse
        // console.log('\n\n\n###### BEGIN : ALL ROW #######');
        // console.log(JSON.stringify(responseQuery, null, 4));
        // console.log('###### END : ALL ROW #######\n\n\n');

        // To match the size of "row array" and the "responseQuery array", we insert fake data in "responseQuery array"
        // Thanks to this workaround, it is possible to determine which line corresponds to which request 
        for (let adjustPosition in continueTab) {
          // If row corresponding was incomplete, insert fake response
          if (continueTab[adjustPosition] === true) {
            // Delete 0 element from index index adjustPosition, and insert fake response and tag as fake { "real query": false }
            responseQuery.data.data_defs.splice(adjustPosition, 0, { "real query": false })
          } else {
            // Else, tag response as real
            responseQuery.data.data_defs[adjustPosition]["real query"] = true
          }
        }

        // For each response
        for (let currentData in responseQuery.data.data_defs) {
          // If response is fake, skip it
          if (responseQuery.data.data_defs[currentData]["real query"] === false) {
            continue
          }
          // Save collection time, this plugin use sync request, this kind of request can not exceed 50 seconds of processing
          // If the delay is exceeded, alerts user to change his request
          timeToCollection = Date.now() - timeSyncStart;
          if (timeToCollection >= 49000)
            alert("Your request takes too much time and ressources from AppResponse and cannot be displayed, please make it shorter")



          //    ##################################################################
          //    ##                 Gathering AppResponse's data                 ##
          //    ##################################################################
          // If no datapoints are presents in response, move on to next response
          if (typeof responseQuery.data.data_defs[currentData].data === 'undefined') {
            console.log('###### NO DATA POINT FOR ROW ' + currentData + '  #####')
            continue;
          }


          //##################################################################
          //##                    Curve's legend generation                 ##
          //##################################################################
          little = []
          little = query.targets[currentData].metricID.split(' {id}')
          metricLabel = little[0]


          // Verify if filters exist
          if (typeof responseQuery.data.data_defs[currentData].filters !== 'undefined') {
            // Grab filter 0 (position of filter with family page)
            firstFilter = responseQuery.data.data_defs[currentData].filters[0].value

            // In case of page family query
            if (firstFilter.includes('web.page.family.id ==')) {
              // Retrieve id number of family page 
              caption = responseQuery.data.data_defs[currentData].filters[0].value.split("==")
              caption = caption[1]
              // Compare id to array (family_page_id : familiy_page_name) and get the readable name
              if (typeof metricCaptionObjTab[caption] !== undefined) {
                caption = metricCaptionObjTab[parseInt(caption)]
              }
            } else {
              // In case of application/hostgroup query (e.g if filter[0] contains app.id and filters[1] contains host_group.id)
              secondFilter = responseQuery.data.data_defs[currentData].filters[1].value
              if (firstFilter.includes('app.id ==') && secondFilter.includes('host_group.id ==')) {
                // Retrieve name of application and host group name contained in results (asked in data_defs earlier) 
                caption = responseQuery.data.data_defs[currentData].data[0][2] + ' (' + responseQuery.data.data_defs[currentData].data[0][4] + ')'
                // General case (no page family request nor Application/hostgroup)
              } else {
                caption = responseQuery.data.data_defs[currentData].data[0][2]
              }
            }
          }




          // If user specifies "alias" field, then label is alias
          if (typeof query.targets[currentData].customAlias !== 'undefined' && query.targets[currentData].customAlias.length > 0) {
            label = query.targets[currentData].customAlias
          } else {
            //  If no alias is specified, if timeshift field is used, add the number of day to label
            if (query.targets[currentData].timeshift > 0) {
              label = caption + ' : ' + metricLabel + "_" + query.targets[currentData].timeshift / 86400 + "day"
            } else {
              // If neither the alias nor the timeshift is specified, label is default
              label = caption + ' : ' + metricLabel
            }
          }
          // appresponseDatapoints is a list containing summary data from Riverbed AppResponse probe
          appresponseDatapoints = responseQuery.data.data_defs[currentData].data

          // Datapoint is a list which will receive all datapoints in correct format [value, timestamp]
          datapoints = []

          if (typeof query.targets[currentData].timeshift !== 'undefined') {
            deltaTimeshift = query.targets[currentData].timeshift * 1000
          } else {
            deltaTimeshift = 0
          }

          // Filling datapoints
          for (let k in appresponseDatapoints) {
            let datapointValue;
            // Timestamp is at position appresponseDatapoints[k][0] in unicode type, converting to int in milliseconde (*1000)
            // Adding 60 seconds to synchronize probe's clock and Grafana's clock
            // Timestamp received is string, convert it to int, add a minute and *1000 to get milliseconds
            datapointTimestamp = ((parseInt(appresponseDatapoints[k][0]) + 60) * 1000) + deltaTimeshift

            // Depending to the format of the result

            // Change int to float
            if (appresponseDatapoints[k][3] % 1 === 0) {
              // toFixed is used to force max decimal number
              datapointValue = this.homeMadeRound(parseFloat(appresponseDatapoints[k][3].replace(",", ".")), 5);

            }
            // Change string to float 
            if (typeof (appresponseDatapoints[k][3]) === 'string') {
              datapointValue = this.homeMadeRound(parseFloat(appresponseDatapoints[k][3].replace(",", ".")), 5);
            }
            // No change if float encountered
            if (appresponseDatapoints[k][3] % 1 !== 0) {
              datapointValue = this.homeMadeRound(appresponseDatapoints[k][3], 5)
            }
            // Adding couple [appresponseDatapoints[k], timestamp] to datapoints list
            datapoints.push([datapointValue, datapointTimestamp])
          }

          let grafanaRefId = query.targets[currentData].refId;

          // Object representating each row's of Grafana (contains caption, meta informations, row's id, collection time, and datapoints)
          let newTarget = {
            // target is curve's caption
            "target": label,
            // meta is miscellaneous informations
            "meta": { 'info 1': "nothing" },
            // refId is the letter of the row (A, B, C, D ...)
            'refId': grafanaRefId,
            // collectionTime is the time needed to complete the query, sync must be <50 [REQUIRE MORE THAN DATASOURCE PLUGIN TO BE USEFUL]
            'collection time (ms)': timeToCollection,
            // datapoints is a list containing all points retrieved by Riverbed AppResponse probe
            "datapoints": datapoints
          };
          // Each target (or row) is insert into a list (will be send to Grafana)
          dataPointsForGrafana.push(newTarget)
          deltaTimeshift = 0
        }

        // Finaly, sending data to Grafana in JSON format
        // console.log(JSON.stringify(dataPointsForGrafana, null, 4));
        responseQuery.data = dataPointsForGrafana
        return responseQuery
      }
    )

  }
}