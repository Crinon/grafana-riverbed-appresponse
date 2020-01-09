import { QueryCtrl } from 'app/plugins/sdk';
import './css/query-editor.css!'
import * as externalFunctions from './externalFunctions';


export class GenericDatasourceQueryCtrl extends QueryCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);
    this.scope = $scope;
    // Critical attribute needed in datasource spec (self tests)
    this.target.target = this.target.target;
    // Attribute type correspond to source type (Host group, webapp ...)
    this.target.type = this.target.type;
    // All source type available
    this.target.sourceTypeTab = ['Host group', 'WebApp', 'Application', 'Application/HG', 'PageFamily'];
    // All boolean needed to display correct box (HostGroup, application .... default is HostGroup)
    this.target.displayHostgroupBox = this.target.displayHostgroupBox;
    this.target.displayHostgroupBox = this.target.displayHostgroupBox;
    this.target.displayApplicationBox = this.target.displayApplicationBox;
    this.target.displayApplicationByHostGroupBox = this.target.displayApplicationByHostGroupBox;
    this.target.displayWebAppBox = this.target.displayWebAppBox;
    this.target.displayPageFamilyBox = this.target.displayPageFamilyBox;
    // Attribute targetID is the id of target selected (can be host_group.id, app.id)
    this.target.targetID = this.target.targetID;
    // Attribute metricID is the id of metric selected
    this.target.metricID = this.target.metricID;
    // Attribute pageFamilyID is the id of the page family selected
    this.target.pageFamilyID = this.target.pageFamilyID;
    // Attribute secondTargetID is the id of the host_group.id selected in 'Application/HG' source type
    this.target.secondTargetID = this.target.secondTargetID;
    // Attribute unit is the unit of the metric selected (or can be 'none')
    this.target.unit = '';
    // Attribute rate is the rate of the metric selected (can be empty) 
    this.target.rate = '';
    // Attribute granularity is the granularity selected
    this.target.granularity = this.target.granularity;
    // Granularities avalaible
    this.target.granularityTab = [{ "value": 60, "text": "60 seconds" },
    { "value": 300, "text": "5 minutes" },
    { "value": 3600, "text": "1 hour" },
    { "value": 21600, "text": "6 hours" },
    { "value": 86400, "text": "1 day" }];
    // Alias used or not by user
    this.target.customAlias;
    // Timeshift used or not by user
    this.target.timeshift;
  }

  // These methods are used by boxes in query.editor.html 

  // DO NOT TOUCH : GRUNT TEST
  getMetricOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  // Query datasource to retreive all metrics avalaible
  getFilteredMetricOptions(query) {
    return this.datasource.appResponseQueryMetricsFiltered(query || '');
  }

  // Query datasource to retreive all hostgroups avalaible
  getHostgroupOptions(query) {
    return this.datasource.appResponseQueryAllHostGroupsAvalaible(query || '');
  }

  // Query datasource to retreive all applications avalaible
  getApplicationOptions(query) {
    return this.datasource.appResponseQueryAllApplicationsAvalaible(query || '');
  }

  // Query datasource to retreive all webapps avalaible
  getWebAppOptions(query) {
    return this.datasource.appResponseQueryAllWebappsAvalaible(query || '');
  }

  // Query datasource to retreive all page families avalaible for a webapp
  getPageFamilyOptions(query) {
    // this.target.DOMextractedRefID = $(document.activeElement).parents(".query-editor-row").find(".gf-form-query-letter-cell-letter").text();
    return this.datasource.appResponseQueryFamilyPageFromWebapp(query || '');
  }


  // When changing source type, bind False to all boolean (all boxes disapear)
  disableAllBoxBool() {
    this.target.displayHostgroupBox = false;
    this.target.displayApplicationBox = false;
    this.target.displayWebAppBox = false;
    this.target.displayApplicationByHostGroupBox = false;
    this.target.displayPageFamilyBox = false;
  }

  // If source type 'host group' is selected, only his boolean is set to True
  toggleHostBool() {
    this.disableAllBoxBool();
    this.target.displayHostgroupBox = true;
  }

  // If source type 'application' is selected, only his boolean is set to True
  toggleApplicationBool() {
    this.disableAllBoxBool();
    this.target.displayApplicationBox = true;
  }

  // If source type 'application/HG' is selected, only his boolean is set to True
  toggleApplicationByHostGroupBool() {
    this.disableAllBoxBool();
    this.target.displayApplicationByHostGroupBox = true;
  }

  // If source type 'webapp' is selected, only his boolean is set to True
  toggleWebbAppBool() {
    this.disableAllBoxBool();
    this.target.displayWebAppBox = true;
  }

  // If source type 'pageFamily' is selected, only his boolean is set to True
  togglePageFamilyBool() {
    this.disableAllBoxBool();
    this.target.displayPageFamilyBox = true;
  }

  // (re)initialize variable (triggered when user selects or changes the source type (e.g new row created) 
  runningSelect() {
    this.target.targetID = ""
    this.target.metricID = ""
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

  // Method triggering datasource query() function
  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
    console.log(this.panelCtrl);
    console.log("REFRESHED");
  }

}

GenericDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';