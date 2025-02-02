/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/// <reference types="cypress" />

import {
    deleteAllBusinessServices,
    deleteByList,
    getRandomAnalysisData,
    getRandomApplicationData,
    login,
    resetURL,
    writeGpgKey,
} from "../../../../../utils/utils";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { GeneralConfig } from "../../../../models/administration/general/generalConfig";

var applicationsList: Array<Analysis> = [];

describe(["@tier1"], "Upload Binary Analysis", () => {
    before("Login", function () {
        login();

        // Enable HTML anc CSV report downloading
        let generalConfig = GeneralConfig.getInstance();
        generalConfig.enableDownloadHtml();
        generalConfig.enableDownloadCsv();
    });

    beforeEach("Load data", function () {
        cy.fixture("application").then(function (appData) {
            this.appData = appData;
        });
        cy.fixture("analysis").then(function (analysisData) {
            this.analysisData = analysisData;
        });

        // Interceptors
        cy.intercept("POST", "/hub/application*").as("postApplication");
        cy.intercept("GET", "/hub/application*").as("getApplication");
    });

    afterEach("Persist session", function () {
        // Reset URL from report page to web UI
        resetURL();
    });

    it(["@interop"], "Upload Binary Analysis", function () {
        const application = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["uploadbinary_analysis_on_acmeair"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        // No credentials required for uploaded binary.
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.downloadReport("HTML");
        application.openReport();
        application.validateStoryPoints();
    });

    it("Custom rules with custom targets", function () {
        // Automated https://issues.redhat.com/browse/TACKLE-561
        const application = new Analysis(
            getRandomApplicationData("customRule_customTarget"),
            getRandomAnalysisData(this.analysisData["uploadbinary_analysis_with_customrule"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        // No credentials required for uploaded binary.
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.downloadReport("CSV");
        application.openReport();
        application.validateStoryPoints();
    });

    it("DIVA report generation", function () {
        const application = new Analysis(
            getRandomApplicationData("DIVA"),
            getRandomAnalysisData(this.analysisData["analysis_for_DIVA-report"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        // No credentials required for uploaded binary.
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();
        application.validateStoryPoints();
        application.validateTransactionReport();
    });

    it("Analysis for jee-example-app upload binary ", function () {
        const application = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(
                this.analysisData["analysis_and_incident_validation_jeeExample_app"]
            )
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();
        application.validateIncidents();
    });

    it("Analysis for camunda-bpm-spring-boot-starter", function () {
        const application = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["analysis_and_incident_validation_camunda_app"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();
        application.validateStoryPoints();
        application.validateIncidents();
    });

    it("Analysis for complete-duke app upload binary ", function () {
        const application = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(
                this.analysisData["analysis_and_incident_validation_complete-duke"]
            )
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();
        application.validateStoryPoints();
        application.validateIncidents();
    });

    it("Analysis for kafka-clients-sb app ", function () {
        const application = new Analysis(
            getRandomApplicationData("uploadBinary"),
            getRandomAnalysisData(this.analysisData["analysis_and_incident_validation_kafka-app"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();
        application.validateStoryPoints();
        application.validateIncidents();
    });

    after("Perform test data clean up", function () {
        deleteByList(applicationsList);
        deleteAllBusinessServices();

        // Disable HTML anc CSV report downloading
        let generalConfig = GeneralConfig.getInstance();
        generalConfig.disableDownloadHtml();
        generalConfig.disableDownloadCsv();

        writeGpgKey("abcde");
    });
});
