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
    login,
    getRandomApplicationData,
    getRandomAnalysisData,
    resetURL,
    deleteByList,
} from "../../../../../utils/utils";
import * as data from "../../../../../utils/data_utils";
import { Analysis } from "../../../../models/migration/applicationinventory/analysis";
import { CredentialsMaven } from "../../../../models/administration/credentials/credentialsMaven";
import { CredentialsSourceControlUsername } from "../../../../models/administration/credentials/credentialsSourceControlUsername";
import { CredentialType, UserCredentials } from "../../../../types/constants";
import { Report } from "../../../../models/migration/applicationinventory/reportPage";
import { name, tag } from "../../../../types/constants";
import { clearAllFilters } from "../../../../views/reportPage.view";
let source_credential;
let maven_credential;
const dependencies = "deps";
let applicationsList: Analysis[] = [];
describe(["@tier2"], "Report Page Filter Validation", () => {
    const report = new Report();
    before("Login", function () {
        login();
        source_credential = new CredentialsSourceControlUsername(
            data.getRandomCredentialsData(
                CredentialType.sourceControl,
                UserCredentials.usernamePassword,
                true
            )
        );
        source_credential.create();
        maven_credential = new CredentialsMaven(
            data.getRandomCredentialsData(CredentialType.maven, "None", true)
        );
        maven_credential.create();
    });

    beforeEach("Load Data", function () {
        cy.fixture("application").then(function (appData) {
            this.appData = appData;
        });
        cy.fixture("analysis").then(function (analysisData) {
            this.analysisData = analysisData;
        });

        cy.intercept("POST", "/hub/application*").as("postApplication");
        cy.intercept("GET", "/hub/application*").as("getApplication");
    });

    it("Filter by application/dependency name on anaysis report page", function () {
        const application = new Analysis(
            getRandomApplicationData("tackleTestApp_Source+dependencies", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["source+dep_analysis_on_tackletestapp"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.manageCredentials(source_credential.name, maven_credential.name);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();

        // Enter an existing display name substring and assert that appName is listed in filter results
        report.applyFilter(name, application.appName.substring(0, 6));
        cy.get("[role=main]").should("contain.text", application.appName);
        cy.get(clearAllFilters).click();

        // Enter an existing display exact name and assert that application dependency is listed in filter results
        report.applyFilter(name, "deps");
        cy.get("[role=main]").should("contain.text", dependencies);
        cy.get(clearAllFilters).click();

        // Enter a non-existing Name and apply it as search filter
        let invalidSearchInput = "SomeInvalidInput";
        report.applyFilter(name, invalidSearchInput);

        // Assert that no search results are found
        cy.get("span[id=count-results]").should("have.text", "0");
        cy.get(clearAllFilters).click();
    });

    it("Filter by application tag on analysis report page", function () {
        const application = new Analysis(
            getRandomApplicationData("tackleTestApp_Source+dependencies", {
                sourceData: this.appData["tackle-testapp-git"],
            }),
            getRandomAnalysisData(this.analysisData["source+dep_analysis_on_tackletestapp"])
        );
        application.create();
        applicationsList.push(application);
        cy.wait("@getApplication");
        cy.wait(2000);
        application.manageCredentials(source_credential.name, maven_credential.name);
        application.analyze();
        application.verifyAnalysisStatus("Completed");
        application.openReport();

        // Enter an existing Tag and assert appName is listed in filter results
        report.applyFilter(tag, "Servlet");
        cy.get("[role=main]").should("contain.text", application.appName);
        cy.get(clearAllFilters).click();

        // Enter an existing Tag and assert that application dependency is listed in filter results
        report.applyFilter(tag, "JDBC");
        cy.get("[role=main]").should("contain.text", dependencies);
        cy.get(clearAllFilters).click();

        // Enter a non-existing tag and apply it as search filter
        let invalidSearchInput = "SomeInvalidInput0";
        report.applyFilter(tag, invalidSearchInput);

        // Assert that no search results are found
        cy.get("span[id=count-results]").should("have.text", "0");
        cy.get(clearAllFilters).click();
    });

    afterEach("Reset url", function () {
        // Reset URL from report page to web UI
        resetURL();
    });

    after("Perform test data clean up", function () {
        deleteByList(applicationsList);
    });
});
