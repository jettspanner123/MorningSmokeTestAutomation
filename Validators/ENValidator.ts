import EnvironmentValueNegativeException from "../Exceptions/EnvironmentValueNegativeException";


export default class ENValidator {
    public static current = new ENValidator();

    public getVariable<T>(key: string): T {
        const value = process.env[key];

        if(!value || value.length == 0) {
            throw new EnvironmentValueNegativeException(key);
        }

        return value as T;
    }

    public checkOrThrowRequiredENVariables(): { username: string, password: string, baseURL: string } {
        const baseURL = process.env.BASE_URL;
        const username = process.env.SMOKE_USER;
        const password = process.env.SMOKE_PASS;

        if (!baseURL || !username || !password) {
            throw new EnvironmentValueNegativeException(
                'Missing BASE_URL, SMOKE_USER, or SMOKE_PASS. Copy .env.example to .env and fill in real values.',
                false
            );
        }
        return {baseURL, username, password}
    }
}