import ApplicationDatabaseProvider from "../../Providers/ApplicationDatabaseProvider";
import EncryptionHelper from "../../Helpers/EncryptionHelper";
import AuthenticationPingCheckTypeInterface from "../../Types/AuthenticationPingCheckTypeInterface";
import AuthenticationLoginCheckTypeInterface from "../../Types/AuthenticationLoginCheckTypeInterface";
import PageLoadCheckTypeInterface from "../../Types/PageLoadCheckTypeInterface";
import IndexingFreshnessCheckTypeInterface from "../../Types/IndexingFreshnessCheckTypeInterface";

export default class ApplicationDatabaseService {
    public static current = new ApplicationDatabaseService();

    // One row per `npx playwright test` invocation — every check for this
    // run links back to the returned id.
    public async startTestRun(): Promise<string> {
        const run = await ApplicationDatabaseProvider.current.client.testRun.create({ data: {} });
        return run.id;
    }

    public async recordAuthenticationPingCheck(params: AuthenticationPingCheckTypeInterface): Promise<void> {
        const {testRunId, success, message, statusCode} = params;

        await ApplicationDatabaseProvider.current.client.authenticationPingCheck.create({
            data: {testRunId, success, message, statusCode},
        });
    }

    public async recordAuthenticationLoginCheck(params: AuthenticationLoginCheckTypeInterface): Promise<void> {
        const {testRunId, username, plainTextPassword, success, message} = params;

        await ApplicationDatabaseProvider.current.client.authenticationLoginCheck.create({
            data: {
                testRunId,
                username,
                password: EncryptionHelper.current.encrypt(plainTextPassword),
                success,
                message,
            },
        });
    }

    public async recordPageLoadCheck(params: PageLoadCheckTypeInterface): Promise<void> {
        const {testRunId, pageName, success, message, statusCode} = params;

        await ApplicationDatabaseProvider.current.client.pageLoadCheck.create({
            data: {testRunId, pageName, success, message, statusCode},
        });
    }

    public async recordIndexingFreshnessCheck(params: IndexingFreshnessCheckTypeInterface): Promise<void> {
        const {testRunId, resultCount, indexTime, machineTime, timeDifference, isFresh, message} = params;

        await ApplicationDatabaseProvider.current.client.indexingFreshnessCheck.create({
            data: {testRunId, resultCount, indexTime, machineTime, timeDifference, isFresh, message},
        });
    }
}
