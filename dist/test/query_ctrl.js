'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GenericDatasourceQueryCtrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sdk = require('app/plugins/sdk');

require('./css/query-editor.css!');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GenericDatasourceQueryCtrl = exports.GenericDatasourceQueryCtrl = function (_QueryCtrl) {
  _inherits(GenericDatasourceQueryCtrl, _QueryCtrl);

  function GenericDatasourceQueryCtrl($scope, $injector) {
    _classCallCheck(this, GenericDatasourceQueryCtrl);

    var _this = _possibleConstructorReturn(this, (GenericDatasourceQueryCtrl.__proto__ || Object.getPrototypeOf(GenericDatasourceQueryCtrl)).call(this, $scope, $injector));

    _this.scope = $scope;
    // Critical attribute needed in datasource spec (self tests)
    _this.target.target = 'unused attribute';
    // Attribute type correspond to source type (Host group, webapp ...)
    _this.target.type = _this.target.type;
    // All source type available
    _this.target.sourceTypeTab = ['Host group', 'Application', 'Application/HG', 'WebApp', 'PageFamily'];
    // All boolean needed to display correct box (HostGroup, application .... default is HostGroup)
    _this.target.displayHostgroupBox = _this.target.displayHostgroupBox;
    _this.target.displayApplicationBox = _this.target.displayApplicationBox;
    _this.target.displayApplicationByHostGroupBox = _this.target.displayApplicationByHostGroupBox;
    _this.target.displayWebAppBox = _this.target.displayWebAppBox;
    _this.target.displayPageFamilyBox = _this.target.displayPageFamilyBox;
    // Attribute targetID is the id of target selected (can be host_group.id, app.id)
    _this.target.targetID = _this.target.targetID || "";
    // Attribute metricID is the id of metric selected
    _this.target.metricID = _this.target.metricID;
    // Attribute pageFamilyID is the id of the page family selected
    _this.target.pageFamilyID = _this.target.pageFamilyID;
    // Attribute secondTargetID is the id of the host_group.id selected in 'Application/HG' source type
    _this.target.secondTargetID = _this.target.secondTargetID;
    // Attribute unit is the unit of the metric selected (or can be 'none')
    _this.target.unit = '';
    // Attribute rate is the rate of the metric selected (can be empty) 
    _this.target.rate = '';
    // Attribute granularity is the granularity selected
    _this.target.granularity = _this.target.granularity;
    // Granularities avalaible
    _this.target.granularityTab = [{ "value": 60, "text": "60 seconds" }, { "value": 300, "text": "5 minutes" }, { "value": 3600, "text": "1 hour" }, { "value": 21600, "text": "6 hours" }, { "value": 86400, "text": "1 day" }];
    return _this;
  }

  // These methods are used by boxes in query.editor.html 

  // Will go to end point '/metricsHG' wich retreives all metrics avalaible for hostGroup


  _createClass(GenericDatasourceQueryCtrl, [{
    key: 'getMetricOptions',
    value: function getMetricOptions(query) {
      return this.datasource.metricFindQuery(query || '');
    }

    // Will go to end point '/metricsApplication' wich retreives all metrics avalaible for application

  }, {
    key: 'getMetricApplicationsOptions',
    value: function getMetricApplicationsOptions(query) {
      return this.datasource.metricApplicationsFindQuery(query || '');
    }

    // Will go to end point '/metricsWebApp' wich retreives all metrics avalaible for webapp

  }, {
    key: 'getMetricWAOptions',
    value: function getMetricWAOptions(query) {
      return this.datasource.metricWAFindQuery(query || '');
    }

    // Will go to end point '/getHost_group' wich retreives all host groups avalaible

  }, {
    key: 'getHost_groupOptions',
    value: function getHost_groupOptions(query) {
      var ret = this.datasource.ENHANCEDmetricFindHost_groupQuery(query || '');
      this.datasource.testPrint();
      return ret;
    }

    // Will go to end point '/getApplicationOptions' wich retreives all applications avalaible

  }, {
    key: 'getApplicationOptions',
    value: function getApplicationOptions(query) {
      return this.datasource.metricFindApplicationQuery(query || '');
    }

    // Will go to end point '/getWebAppOptions' wich retreives all webapps avalaible

  }, {
    key: 'getWebAppOptions',
    value: function getWebAppOptions(query) {
      return this.datasource.metricFindWebAppQuery(query || '');
    }

    // Will go to end point '/getPageFamilyOptions' wich retreives all page families avalaible for a webapp

  }, {
    key: 'getPageFamilyOptions',
    value: function getPageFamilyOptions() {
      this.target.DOMextractedRefID = $(document.activeElement).parents("query-editor-row").find(".gf-form-query-letter-cell-letter").text();
      return this.datasource.metricFindPageFamilyQuery(this.target.DOMextractedRefID);
    }

    // When changing source type, bind False to all boolean (all boxes disapear)

  }, {
    key: 'disableAllBoxBool',
    value: function disableAllBoxBool() {
      this.target.displayHostgroupBox = false;
      this.target.displayApplicationBox = false;
      this.target.displayWebAppBox = false;
      this.target.displayApplicationByHostGroupBox = false;
      this.target.displayPageFamilyBox = false;
    }

    // If source type 'host group' is selected, only his boolean is set to True

  }, {
    key: 'toggleHostBool',
    value: function toggleHostBool() {
      this.disableAllBoxBool();
      this.target.displayHostgroupBox = true;
    }

    // If source type 'application' is selected, only his boolean is set to True

  }, {
    key: 'toggleApplicationBool',
    value: function toggleApplicationBool() {
      this.disableAllBoxBool();
      this.target.displayApplicationBox = true;
    }

    // If source type 'application/HG' is selected, only his boolean is set to True

  }, {
    key: 'toggleApplicationByHostGroupBool',
    value: function toggleApplicationByHostGroupBool() {
      this.disableAllBoxBool();
      this.target.displayApplicationByHostGroupBox = true;
    }

    // If source type 'webapp' is selected, only his boolean is set to True

  }, {
    key: 'toggleWebbAppBool',
    value: function toggleWebbAppBool() {
      this.disableAllBoxBool();
      this.target.displayWebAppBox = true;
    }

    // If source type 'pageFamily' is selected, only his boolean is set to True

  }, {
    key: 'togglePageFamilyBool',
    value: function togglePageFamilyBool() {
      this.disableAllBoxBool();
      this.target.displayPageFamilyBox = true;
    }

    // Method triggered by source type selection (a new query is being made), cleaning all up

  }, {
    key: 'runningSelect',
    value: function runningSelect() {
      // Reset attributes
      this.target.targetID = "";
      this.target.metricID = "";
      this.target.pageFamilyID = "";
      this.target.secondTargetID = "";
      this.target.granularity = '';
      this.target.unit = '';
      this.target.rate = '';
      // Toggling boolean depending of selected case of combobox 'Source type' (this will display concerned boxes):
      if (this.target.type == "Host group") {
        this.toggleHostBool();
      }
      if (this.target.type == "Application") {
        this.toggleApplicationBool();
      }
      if (this.target.type == "Application/HG") {
        this.toggleApplicationByHostGroupBool();
      }
      if (this.target.type == "WebApp") {
        this.toggleWebbAppBool();
      }
      if (this.target.type == 'PageFamily') {
        this.togglePageFamilyBool();
      }
    }

    // Method triggering /query end point

  }, {
    key: 'onChangeInternal',
    value: function onChangeInternal() {
      this.panelCtrl.refresh(); // Asks the panel to refresh data.
      console.log("REFRESHED");
    }

    // Debugging purpose

  }, {
    key: 'toString2',
    value: function toString2() {
      console.log("this.target.target " + this.target.target);
      console.log("this.target.type " + this.target.type);
      console.log("displayHostgroupBox : " + this.target.displayHostgroupBox);
      console.log("displayApplicationBox : " + this.target.displayApplicationBox);
      console.log("displayWebAppBox : " + this.target.displayWebAppBox);
      console.log("displayPageFamilyBox : " + this.target.displayPageFamilyBox);
      console.log("this.target.targetID : " + this.target.targetID);
      console.log("this.target.metricID : " + this.target.metricID);
      console.log("this.target.pageFamilyID : " + this.target.pageFamilyID);
      console.log("this.target.secondTargetID : " + this.target.secondTargetID);
      console.log("this.target.granularity : " + this.target.granularity);
      console.log("this.target.unit : " + this.target.unit);
      console.log("this.target.rate : " + this.target.rate);
    }
  }]);

  return GenericDatasourceQueryCtrl;
}(_sdk.QueryCtrl);

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
