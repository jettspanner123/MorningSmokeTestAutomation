
export default interface PageLoadCheckTypeInterface {
    testRunId: string;
    pageName: string;
    success: boolean;
    message: string;
    statusCode: number | null;
}
