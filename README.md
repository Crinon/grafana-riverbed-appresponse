# grafana-riverbed-appresponse

This datasource plugin allows Grafana to submit requests to Riverbed SteelCentral AppResponse.

Data retrieved are shown in panel (graph, heatmap, table ...).

This plugin is fully native, it replace this older one who required a Python server to be runned : https://github.com/Crinon/outDated-Grafana-Datasource-Plugin-For-Riverbed-AppResponse

![alt text](https://raw.githubusercontent.com/Crinon/grafana-riverbed-appresponse/master/screenAppResponseReadme.PNG)


## Installation

Download, unzip and place the ```grafana-riverbed-appresponse``` folder in the plugins directory /var/lib/grafana/plugins

You may need to reboot your Grafana server to complete plugin installation

In case of "unsigned external plugin" warning you need to rebuild the plugin (executes "Dev setup" steps)


### Dev setup

If you want to modify this plugin :

This plugin requires node 6.10.0

Run ```npm install```to build node_modules folder

Run ```npm run build```to build dist folder


### Changelog

1.0.0
- Release
