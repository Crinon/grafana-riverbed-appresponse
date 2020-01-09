# grafana-riverbed-appresponse

This datasource plugin allows Grafana to submit requests to Riverbed SteelCentral AppResponse.

Data retrieved are shown in panel (graph, heatmap, table ...).



## Installation

Place this folder in the plugins directory /var/lib/grafana/plugins

Run ```npm install```to build node_modules folder

Run ```npm run build```to build dist folder

You may need to reboot your Grafana server to complete plugin installation



### Dev setup

This plugin requires node 6.10.0

```
npm install -g yarn
yarn install
npm run build
```


### Changelog

1.0.0
- Release


CRINON Nicolas ncrinon@mgen.fr
